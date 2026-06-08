import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { formatUserGreeting } from '@/lib/telegram/message';
import { sendMessage } from '@/lib/telegram/bot';
import { DailyChatService } from '@/lib/ai/services/daily-chat.service';
import { MemoryService } from '@/lib/ai/services/memory.service';
import { OnboardingService } from '@/lib/ai/services/onboarding.service';
import { getDayNumber } from '@/lib/utils/date';

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from?: {
      id: number;
      first_name?: string;
      username?: string;
    };
    chat: {
      id: number;
    };
    text?: string;
  };
}

export async function POST(request: NextRequest) {
  // Verify webhook secret
  const secret = request.headers.get('x-telegram-bot-api-secret-token');
  console.log('[Telegram Webhook] Received request. Headers secret length:', secret?.length || 0, 'Env secret length:', process.env.TELEGRAM_WEBHOOK_SECRET?.length || 0);

  if (secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    console.warn('[Telegram Webhook] Unauthorized secret token mismatch.');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const update: TelegramUpdate = await request.json();
    const message = update.message;

    if (!message?.text) {
      return NextResponse.json({ ok: true });
    }

    const chatId = message.chat.id;
    const text = message.text.trim();

    // Handle /start <token> command — links Telegram to Deylon account
    if (text.startsWith('/start')) {
      const parts = text.split(' ');
      const token = parts[1]; // deep link token

      if (!token) {
        await sendMessage(
          chatId,
          '👋 Welcome to Deylon! To connect your account, go to your Deylon dashboard and click <b>Connect Telegram</b>.'
        );
        return NextResponse.json({ ok: true });
      }

      const supabase = await createServiceClient();

      // Look up user by token stored temporarily in users table or a linking table
      // Token format: userId encoded as base64url
      let userId: string;
      try {
        userId = Buffer.from(token, 'base64url').toString('utf-8');
      } catch {
        await sendMessage(chatId, '❌ Invalid link. Please try again from your Deylon dashboard.');
        return NextResponse.json({ ok: true });
      }

      console.log('[Telegram Webhook] Linking account. Decoded userId:', userId, 'chatId:', chatId);

      const { data: user, error } = await supabase
        .from('users')
        .update({ 
          telegram_chat_id: chatId,
          telegram_linking_state: 'awaiting_greeting'
        })
        .eq('id', userId)
        .select('id')
        .single();

      if (error || !user) {
        console.error('[Telegram Webhook] Database link error for user:', userId, 'Error:', error);
        await sendMessage(chatId, '❌ Could not link your account. Please try again from your Deylon dashboard.');
        return NextResponse.json({ ok: true });
      }

      await sendMessage(
        chatId,
        '👋 Hey, this is Deylon.\n\nBefore we get started, what should I call you?'
      );
    } else {
      const supabase = await createServiceClient();

      // 1. Look up user by telegram_chat_id
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('telegram_chat_id', chatId)
        .maybeSingle();

      if (userError || !user) {
        await sendMessage(
          chatId,
          '👋 Welcome to Deylon! To link your Telegram, please visit your web dashboard and click <b>Connect Telegram</b>.'
        );
        return NextResponse.json({ ok: true });
      }

      // 1.5 Handle awaiting_greeting state
      if (user.telegram_linking_state === 'awaiting_greeting') {
        const cleanGreeting = text.replace(/^(greetings|hey|hi|yo|hello|dear|bonjour|salut)\s+/i, '').trim();
        const cleanName = cleanGreeting || text;

        // Save preferred greeting, update display_name
        await supabase
          .from('users')
          .update({
            preferred_greeting: text,
            display_name: cleanName,
            telegram_linking_state: 'active'
          })
          .eq('id', user.id);

        // Fetch the user's latest plan goal
        const { data: plan } = await supabase
          .from('plans')
          .select('primary_goal')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        await sendMessage(
          chatId,
          `✅ <b>Got it, I'll address you as "${text}"!</b>\n\nDeylon will send your daily tasks and check-ins here, starting this evening.\n\n🎯 <b>Your goal:</b> ${plan?.primary_goal ?? 'your goal'}`
        );
        return NextResponse.json({ ok: true });
      }
      
      // 1.7 Intercept Carry-Over Confirmations
      const cleanText = text.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").trim();
      if (cleanText === 'carry over' || cleanText === 'no') {
        const { data: activePlan } = await supabase
          .from('plans')
          .select('id, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (activePlan) {
          const dayNumber = getDayNumber(new Date(activePlan.created_at), user.timezone || 'Africa/Lagos');
          const { data: todayCard } = await supabase
            .from('daily_cards')
            .select('*')
            .eq('user_id', user.id)
            .eq('plan_id', activePlan.id)
            .eq('day_number', dayNumber)
            .maybeSingle();

          if (todayCard && todayCard.status === 'pending') {
            if (cleanText === 'carry over') {
              const carryOverCount = user.carry_over_count_this_week ?? 0;
              if (carryOverCount < 1) {
                const nextDayNumber = dayNumber + 1;
                if (nextDayNumber > 21) {
                  await sendMessage(chatId, "❌ You cannot carry over a task on the final day of the challenge!");
                  return NextResponse.json({ ok: true });
                }

                const { data: tomorrowCard } = await supabase
                  .from('daily_cards')
                  .select('*')
                  .eq('user_id', user.id)
                  .eq('plan_id', activePlan.id)
                  .eq('day_number', nextDayNumber)
                  .maybeSingle();

                if (tomorrowCard) {
                  let newTomorrowTask = tomorrowCard.task;
                  if (!newTomorrowTask.includes(todayCard.task)) {
                    newTomorrowTask = `${newTomorrowTask.trim()} ${todayCard.task.trim()}`;
                  }

                  await supabase
                    .from('daily_cards')
                    .update({ task: newTomorrowTask })
                    .eq('id', tomorrowCard.id);

                  await supabase
                    .from('daily_cards')
                    .update({ status: 'adjusted' })
                    .eq('id', todayCard.id);

                  await supabase
                    .from('users')
                    .update({ carry_over_count_this_week: carryOverCount + 1 })
                    .eq('id', user.id);

                  const greeting = formatUserGreeting(user.preferred_greeting, user.display_name, user.email);
                  await sendMessage(chatId, `✅ <b>Carried over!</b>\n\nI've added today's moves to tomorrow's list. Tomorrow will be a bigger day, but you've got this!\n\nHere is tomorrow's combined task list:`);

                  let bubbles = (tomorrowCard.social_chat_messages as string[]) || [];
                  if (!Array.isArray(bubbles) || bubbles.length === 0) {
                    bubbles = [
                      `🌅 <b>Tomorrow's Move — Day ${nextDayNumber}</b>`,
                      `📌 <b>Task:</b> ${newTomorrowTask}\n\n⏱ <i>Duration: ${tomorrowCard.duration || '30 mins'}</i>`,
                    ];
                  }
                  bubbles[0] = `✨ <b>${greeting}</b>\n\n${bubbles[0]}`;

                  for (let i = 0; i < bubbles.length; i++) {
                    if (i > 0) {
                      await new Promise((resolve) => setTimeout(resolve, 1500));
                    }
                    await sendMessage(chatId, bubbles[i]);
                  }

                  await supabase
                    .from('daily_cards')
                    .update({ revealed_at: new Date().toISOString() })
                    .eq('id', tomorrowCard.id);

                  return NextResponse.json({ ok: true });
                }
              } else {
                await sendMessage(chatId, "❌ You've already used your carry-over limit for this week. Let's try to finish today's task tonight!");
                return NextResponse.json({ ok: true });
              }
            } else if (cleanText === 'no') {
              const nextDayNumber = dayNumber + 1;
              const { data: tomorrowCard } = await supabase
                .from('daily_cards')
                .select('*')
                .eq('user_id', user.id)
                .eq('plan_id', activePlan.id)
                .eq('day_number', nextDayNumber)
                .maybeSingle();

              const greeting = formatUserGreeting(user.preferred_greeting, user.display_name, user.email);
              await sendMessage(chatId, `💪 <b>Let's do this!</b>\n\nKeep pushing to finish today's task tonight. Here is tomorrow's task to keep you prepared:`);

              if (tomorrowCard) {
                let bubbles = (tomorrowCard.social_chat_messages as string[]) || [];
                if (!Array.isArray(bubbles) || bubbles.length === 0) {
                  bubbles = [
                    `🌅 <b>Tomorrow's Move — Day ${nextDayNumber}</b>`,
                    `📌 <b>Task:</b> ${tomorrowCard.task}\n\n⏱ <i>Duration: ${tomorrowCard.duration || '30 mins'}</i>`,
                  ];
                }
                bubbles[0] = `✨ <b>${greeting}</b>\n\n${bubbles[0]}`;

                for (let i = 0; i < bubbles.length; i++) {
                  if (i > 0) {
                    await new Promise((resolve) => setTimeout(resolve, 1500));
                  }
                  await sendMessage(chatId, bubbles[i]);
                }

                await supabase
                  .from('daily_cards')
                  .update({ revealed_at: new Date().toISOString() })
                  .eq('id', tomorrowCard.id);
              }
              return NextResponse.json({ ok: true });
            }
          }
        }
      }

      // 2. Determine if user is in onboarding or active coaching (has a plan)
      const { data: plan } = await supabase
        .from('plans')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!plan) {
        // ONBOARDING FLOW
        let { data: conversation } = await supabase
          .from('conversations')
          .select('*')
          .eq('user_id', user.id)
          .eq('completed', false)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!conversation) {
          const { data: newConv } = await supabase
            .from('conversations')
            .insert({ user_id: user.id, messages: [] })
            .select()
            .single();
          conversation = newConv;
        }

        if (!conversation) {
          await sendMessage(chatId, '⚠️ Something went wrong trying to start onboarding. Please try again on the web.');
          return NextResponse.json({ ok: true });
        }

        const updatedMessages = [
          ...(conversation.messages || []),
          { role: 'user', content: text }
        ];

        // Call Gemini onboarding chat
        const reply = await OnboardingService.chat(updatedMessages);
        const isComplete = OnboardingService.isProfileComplete(reply);

        // Save conversation history to Supabase
        await supabase
          .from('conversations')
          .update({
            messages: [
              ...updatedMessages,
              { role: 'assistant', content: reply }
            ],
            completed: isComplete
          })
          .eq('id', conversation.id);

        let cleanReply = reply;
        if (isComplete) {
          cleanReply = reply.replace(/\[PROFILE_READY\][\s\S]*?\[\/PROFILE_READY\]/g, '').trim();
        }

        // Send Deylon's reply back to user via Telegram
        await sendMessage(chatId, cleanReply);
      } else {
        // DAILY COACHING SPRINT CHAT FLOW
        let { data: conversation } = await supabase
          .from('conversations')
          .select('*')
          .eq('user_id', user.id)
          .eq('completed', false)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!conversation) {
          const { data: newConv } = await supabase
            .from('conversations')
            .insert({ user_id: user.id, messages: [] })
            .select()
            .single();
          conversation = newConv;
        }

        if (!conversation) {
          await sendMessage(chatId, '⚠️ Something went wrong trying to access your coaching session.');
          return NextResponse.json({ ok: true });
        }

        const updatedMessages = [
          ...(conversation.messages || []),
          { role: 'user', content: text }
        ];

        // Save user message immediately to the database
        await supabase
          .from('conversations')
          .update({ messages: updatedMessages })
          .eq('id', conversation.id);

        // Determine active sprint day
        const { data: latestCard } = await supabase
          .from('daily_cards')
          .select('day_number')
          .eq('user_id', user.id)
          .eq('status', 'pending')
          .order('day_number', { ascending: true })
          .limit(1)
          .maybeSingle();
        
        const sprintDay = latestCard?.day_number || 1;

        // Call daily coaching chat service
        const reply = await DailyChatService.chat(supabase, user.id, conversation.id, sprintDay);

        // Save Deylon's reply to the database
        const finalMessages = [
          ...updatedMessages,
          { role: 'assistant', content: reply }
        ];

        await supabase
          .from('conversations')
          .update({ messages: finalMessages })
          .eq('id', conversation.id);

        // Send Deylon's response to the user via Telegram
        await sendMessage(chatId, reply);

        // Run background processes concurrently
        try {
          Promise.allSettled([
            DailyChatService.calculateHealthScore(supabase, user.id, sprintDay),
            MemoryService.extractAndSave(supabase, user.id, conversation.id, sprintDay)
          ]);
        } catch (bgError) {
          console.error('[telegram/webhook] Background tasks error:', bgError);
        }
      }
    }
  } catch (error) {
    console.error('[telegram/webhook] Error:', error);
    return NextResponse.json({ ok: true }); // Always 200 to Telegram
  }
}
