import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { formatUserGreeting, appendToConversationHistory } from '@/lib/telegram/message';
import { formatForWhatsApp } from '@/lib/twilio/message';
import { sendWhatsAppMessage } from '@/lib/twilio/bot';
import { DailyChatService } from '@/lib/ai/services/daily-chat.service';
import { MemoryService } from '@/lib/ai/services/memory.service';
import { OnboardingService } from '@/lib/ai/services/onboarding.service';
import { getDayNumber, getTodayISO, getTomorrowISO } from '@/lib/utils/date';
import { parseTasks, formatTaskForTelegram } from '@/lib/utils';

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

async function sendBubbleReply(chatId: string, text: string) {
  const bubbles = text
    .split('\n\n')
    .map((b) => b.trim())
    .filter((b) => b.length > 0);

  for (let i = 0; i < bubbles.length; i++) {
    if (i > 0) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
    await sendWhatsAppMessage(chatId, formatForWhatsApp(bubbles[i]));
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const body = formData.get('Body');
    const from = formData.get('From');

    if (!body || !from) {
      return new Response('OK', { status: 200 });
    }

    // From is like "whatsapp:+1234567890", we just use the whole string or strip "whatsapp:"
    // Let's strip "whatsapp:" so we just store the number
    const chatId = from.toString().replace('whatsapp:', '');
    const text = body.toString().replace(/’/g, "'").trim();

    // Handle /start <token> command — links Telegram to Deylon account
    if (text.startsWith('/start') || text.toLowerCase().startsWith('connect ')) {
      const parts = text.split(' ');
      const token = parts[1]; // deep link token

      if (!token) {
        await sendWhatsAppMessage(chatId, formatForWhatsApp('👋 Welcome to Deylon! To connect your account, go to your Deylon dashboard and click <b>Connect WhatsApp</b>.'
        ));
        return NextResponse.json({ ok: true });
      }

      const supabase = await createServiceClient();

      // Look up user by token stored temporarily in users table
      let userId: string;
      try {
        userId = Buffer.from(token, 'base64url').toString('utf-8');
      } catch {
        await sendWhatsAppMessage(chatId, formatForWhatsApp('❌ Invalid link. Please try again from your Deylon dashboard.'));
        return NextResponse.json({ ok: true });
      }

      console.log('[Twilio Webhook] Linking account. Decoded userId:', userId, 'chatId:', chatId);

      // Fetch user profile details
      const { data: dbUser, error: dbUserErr } = await supabase
        .from('users')
        .select('id, display_name, email, is_pro, timezone')
        .eq('id', userId)
        .single();

      if (dbUserErr || !dbUser) {
        console.error('[Twilio Webhook] Database link error for user:', userId, 'Error:', dbUserErr);
        await sendWhatsAppMessage(chatId, formatForWhatsApp(`❌ Could not find your account. (Debug: token_len=${token?.length || 0}, decoded_userId="${userId}", error=${dbUserErr ? JSON.stringify(dbUserErr) : 'no_user_found'}). Please try again from your Deylon dashboard.`
        ));
        return NextResponse.json({ ok: true });
      }

      // Fetch active plan to get timeline_months or timelineGoal
      const { data: activePlan } = await supabase
        .from('plans')
        .select('plan_data, timeline_months')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const timelineText = activePlan?.timeline_months
        ? `${activePlan.timeline_months}-month`
        : ((activePlan?.plan_data as any)?.timelineGoal || '3-month');
      const challengeDays = dbUser.is_pro ? 21 : 14;

      if (dbUser.display_name && dbUser.display_name.trim().length > 0) {
        // Skip name collection, transition directly to awaiting_start_date
        await supabase
          .from('users')
          .update({ 
            whatsapp_number: chatId,
            whatsapp_linking_state: 'awaiting_start_date'
          })
          .eq('id', userId);

        const timezone = dbUser.timezone || 'Africa/Lagos';
        const userLocalTime = new Date(
          new Date().toLocaleString('en-US', { timeZone: timezone })
        );
        const currentHour = userLocalTime.getHours();

        let promptMsg = `When would you like to start your ${challengeDays}-day challenge of your ${timelineText} plan? Reply "today", "tomorrow", "Wednesday", "Friday", or type a relative date (e.g., "in 3 days" or a date like "YYYY-MM-DD").`;
        if (currentHour >= 21) {
          promptMsg = `Since it's past 9 PM, when would you like to start your ${challengeDays}-day challenge of your ${timelineText} plan? Reply "tomorrow", "Wednesday", "Friday", or type a relative date (e.g., "in 3 days" or a date like "YYYY-MM-DD").`;
        }

        await sendWhatsAppMessage(chatId, formatForWhatsApp(`👋 Hey ${dbUser.display_name}, this is Deylon.`
        ));
        await new Promise((resolve) => setTimeout(resolve, 1500));
        await sendWhatsAppMessage(chatId, formatForWhatsApp(promptMsg));
      } else {
        // No display name, ask for it
        await supabase
          .from('users')
          .update({ 
            whatsapp_number: chatId,
            whatsapp_linking_state: 'awaiting_greeting'
          })
          .eq('id', userId);

        await sendWhatsAppMessage(chatId, formatForWhatsApp('👋 Hey, this is Deylon.\n\nBefore we get started, what should I call you?'
        ));
      }
    } else {
      const supabase = await createServiceClient();

      // 1. Look up user by whatsapp_number
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('whatsapp_number', chatId)
        .maybeSingle();

      if (userError || !user) {
        await sendWhatsAppMessage(chatId, formatForWhatsApp('👋 Welcome to Deylon! To link your WhatsApp, please visit your web dashboard and click <b>Connect WhatsApp</b>.'
        ));
        return NextResponse.json({ ok: true });
      }

      // 1.5 Handle awaiting_greeting state
      if (user.whatsapp_linking_state === 'awaiting_greeting') {
        const cleanGreeting = text.replace(/^(greetings|hey|hi|yo|hello|dear|bonjour|salut)\s+/i, '').trim();
        const cleanName = cleanGreeting || text;

        // Save preferred greeting, update display_name
        await supabase
          .from('users')
          .update({
            preferred_greeting: text,
            display_name: cleanName,
            whatsapp_linking_state: 'awaiting_start_date'
          })
          .eq('id', user.id);

        const { data: activePlan } = await supabase
          .from('plans')
          .select('plan_data, timeline_months')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        const timelineText = activePlan?.timeline_months
          ? `${activePlan.timeline_months}-month`
          : ((activePlan?.plan_data as any)?.timelineGoal || '3-month');
        const challengeDays = user.is_pro ? 21 : 14;

        const timezone = user.timezone || 'Africa/Lagos';
        const userLocalTime = new Date(
          new Date().toLocaleString('en-US', { timeZone: timezone })
        );
        const currentHour = userLocalTime.getHours();

        let promptMsg = `When would you like to start your ${challengeDays}-day challenge of your ${timelineText} plan? Reply "today", "tomorrow", "Wednesday", "Friday", or type a relative date (e.g., "in 3 days" or a date like "YYYY-MM-DD").`;
        if (currentHour >= 21) {
          promptMsg = `Since it's past 9 PM, when would you like to start your ${challengeDays}-day challenge of your ${timelineText} plan? Reply "tomorrow", "Wednesday", "Friday", or type a relative date (e.g., "in 3 days" or a date like "YYYY-MM-DD").`;
        }

        await sendWhatsAppMessage(chatId, formatForWhatsApp(`👋 Got it, I'll address you as "${cleanName}"!`
        ));
        await new Promise((resolve) => setTimeout(resolve, 1500));
        await sendWhatsAppMessage(chatId, formatForWhatsApp(promptMsg));
        return NextResponse.json({ ok: true });
      }

      // 1.6 Handle awaiting_start_date state
      if (user.whatsapp_linking_state === 'awaiting_start_date') {
        const cleanText = text.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").trim();
        const timezone = user.timezone || 'Africa/Lagos';
        const userLocalTime = new Date(
          new Date().toLocaleString('en-US', { timeZone: timezone })
        );

        let startDate = '';
        if (cleanText === 'today') {
          const currentHour = userLocalTime.getHours();
          if (currentHour >= 21) {
            await sendWhatsAppMessage(chatId, formatForWhatsApp(`⚠️ It's past 9 PM, so today is almost over. Please select "tomorrow" or another date.`));
            return NextResponse.json({ ok: true });
          }
          startDate = getTodayISO(timezone);
        } else if (cleanText === 'tomorrow') {
          startDate = getTomorrowISO(timezone);
        } else {
          // Check for weekdays first, e.g. "wednesday", "friday"
          const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
          let matchedDayIndex = -1;
          for (let i = 0; i < weekdays.length; i++) {
            if (cleanText.includes(weekdays[i])) {
              matchedDayIndex = i;
              break;
            }
          }

          if (matchedDayIndex !== -1) {
            const todayDayIndex = userLocalTime.getDay(); // 0 is Sunday
            let daysOffset = matchedDayIndex - todayDayIndex;
            if (daysOffset <= 0) {
              daysOffset += 7; // Next week
            }
            const date = new Date(userLocalTime);
            date.setDate(date.getDate() + daysOffset);
            startDate = date.toISOString().split('T')[0];
          } else {
            // Check for relative day offset e.g., "in 3 days", "3 days", "in 3 days time"
            const relativeMatch = cleanText.match(/(?:in\s+)?(\d+)\s*days?/i);
            if (relativeMatch) {
              const daysOffset = parseInt(relativeMatch[1], 10);
              const date = new Date(userLocalTime);
              date.setDate(date.getDate() + daysOffset);
              startDate = date.toISOString().split('T')[0];
            } else {
              // Check for YYYY-MM-DD
              const dateMatch = cleanText.match(/^(\d{4})-(\d{2})-(\d{2})$/);
              if (dateMatch) {
                startDate = cleanText;
              }
            }
          }
        }

        if (startDate) {
          // Fetch the user's latest plan
          const { data: plan, error: planErr } = await supabase
            .from('plans')
            .select('id, primary_goal')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (planErr || !plan) {
            console.error('[Twilio Webhook] Error fetching active plan:', planErr);
            await sendWhatsAppMessage(chatId, formatForWhatsApp('⚠️ Plan not found. Please contact support.'));
            return NextResponse.json({ ok: true });
          }

          // Update the plan with start_date and set linking state to active
          await supabase
            .from('plans')
            .update({ start_date: startDate })
            .eq('id', plan.id);

          await supabase
            .from('users')
            .update({ whatsapp_linking_state: 'active' })
            .eq('id', user.id);

          if (startDate === getTodayISO(timezone)) {
            // Fetch today's card to deliver directly (since start date is today, today is day 1)
            const { data: todayCard } = await supabase
              .from('daily_cards')
              .select('*')
              .eq('user_id', user.id)
              .eq('plan_id', plan.id)
              .eq('day_number', 1)
              .maybeSingle();

            const messageText = `🚀 <b>Your challenge starts TODAY!</b>\n\nHere is your very first daily move:\n\n📌 <b>${formatTaskForTelegram(todayCard?.task || 'No task assigned')}</b>\n\nYou've got this! Let me know when you've finished it.`;
            await sendWhatsAppMessage(chatId, formatForWhatsApp(messageText));
            
            // Log delivery in conversation history
            await appendToConversationHistory(supabase, user.id, 'assistant', messageText);

            // Mark card as revealed
            if (todayCard) {
              await supabase
                .from('daily_cards')
                .update({ revealed_at: new Date().toISOString() })
                .eq('id', todayCard.id);
            }
          } else {
            await sendWhatsAppMessage(chatId, formatForWhatsApp(`🌅 <b>Your challenge is scheduled to start on ${startDate}!</b>\n\nI'll deliver your first daily move on that morning at 10 AM. Rest up and get ready!`));
          }
        } else {
          // Fetch active plan to get timelineGoal for dynamic fallback message
          const { data: activePlan } = await supabase
            .from('plans')
            .select('plan_data, timeline_months')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          const timelineText = activePlan?.timeline_months
            ? `${activePlan.timeline_months}-month`
            : ((activePlan?.plan_data as any)?.timelineGoal || '3-month');
          const challengeDays = user.is_pro ? 21 : 14;

          await sendWhatsAppMessage(chatId, formatForWhatsApp(`Please reply with "today", "tomorrow", "Wednesday", "Friday", or type a relative date (e.g., "in 3 days" or a date like "YYYY-MM-DD") to select the start date of your ${challengeDays}-day challenge of your ${timelineText} plan.`));
        }
        return NextResponse.json({ ok: true });
      }
      
      // 1.7 Intercept Carry-Over Confirmations
      const cleanText = text.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").trim();
      if (cleanText === 'carry over' || cleanText === 'no') {
        const { data: activePlan } = await supabase
          .from('plans')
          .select('id, created_at, start_date')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (activePlan) {
          const dayNumber = getDayNumber(activePlan.start_date || new Date(activePlan.created_at), user.timezone || 'Africa/Lagos');
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
                  await sendWhatsAppMessage(chatId, formatForWhatsApp("❌ You cannot carry over a task on the final day of the challenge!"));
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
                  await sendWhatsAppMessage(chatId, formatForWhatsApp(`✅ <b>Carried over!</b>\n\nI've added today's moves to tomorrow's list. Tomorrow will be a bigger day, but you've got this!\n\nHere is tomorrow's combined task list:`));

                  let bubbles = (tomorrowCard.social_chat_messages as string[]) || [];
                  if (!Array.isArray(bubbles) || bubbles.length === 0) {
                    bubbles = [
                      `🌅 <b>Tomorrow's Move — Day ${nextDayNumber}</b>`,
                      `📌 <b>Task:</b>\n${formatTaskForTelegram(newTomorrowTask)}`,
                    ];
                  }
                  bubbles[0] = `✨ <b>${greeting}</b>\n\n${bubbles[0]}`;

                  for (let i = 0; i < bubbles.length; i++) {
                    if (i > 0) {
                      await new Promise((resolve) => setTimeout(resolve, 1500));
                    }
                    await sendWhatsAppMessage(chatId, formatForWhatsApp(bubbles[i]));
                  }

                  await supabase
                    .from('daily_cards')
                    .update({ revealed_at: new Date().toISOString() })
                    .eq('id', tomorrowCard.id);

                  return NextResponse.json({ ok: true });
                }
              } else {
                await sendWhatsAppMessage(chatId, formatForWhatsApp("❌ You've already used your carry-over limit for this week. Let's try to finish today's task tonight!"));
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
              await sendWhatsAppMessage(chatId, formatForWhatsApp(`💪 <b>Let's do this!</b>\n\nKeep pushing to finish today's task tonight. Here is tomorrow's task to keep you prepared:`));

              if (tomorrowCard) {
                let bubbles = (tomorrowCard.social_chat_messages as string[]) || [];
                if (!Array.isArray(bubbles) || bubbles.length === 0) {
                  bubbles = [
                    `🌅 <b>Tomorrow's Move — Day ${nextDayNumber}</b>`,
                    `📌 <b>Task:</b>\n${formatTaskForTelegram(tomorrowCard.task)}`,
                  ];
                }
                bubbles[0] = `✨ <b>${greeting}</b>\n\n${bubbles[0]}`;

                for (let i = 0; i < bubbles.length; i++) {
                  if (i > 0) {
                    await new Promise((resolve) => setTimeout(resolve, 1500));
                  }
                  await sendWhatsAppMessage(chatId, formatForWhatsApp(bubbles[i]));
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

      // 1.8 Intercept completion/done messages — broad fuzzy match
      const completionText = text.toLowerCase().trim();
      const isCompletion = /\b(done|completed|finished|complete|task done|i(('ve?)|( have)) (done|completed|finished)|i did it|all done|done today|checked it)\b/i.test(completionText);
      if (isCompletion) {
        const { data: activePlan } = await supabase
          .from('plans')
          .select('id, created_at, start_date')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (activePlan) {
          const dayNumber = getDayNumber(activePlan.start_date || new Date(activePlan.created_at), user.timezone || 'Africa/Lagos');
          const { data: todayCard } = await supabase
            .from('daily_cards')
            .select('*')
            .eq('user_id', user.id)
            .eq('plan_id', activePlan.id)
            .eq('day_number', dayNumber)
            .maybeSingle();

          if (todayCard) {
            if (todayCard.status === 'done') {
              await sendWhatsAppMessage(chatId, formatForWhatsApp(`✨ Today's moves are already marked as completed! Splendid work.`));
              return NextResponse.json({ ok: true });
            }

            const taskItems = parseTasks(todayCard.task);
            const checkedStates = Array(taskItems.length).fill(true);

            const { error: updateErr } = await supabase
              .from('daily_cards')
              .update({
                status: 'done',
                completed_at: new Date().toISOString(),
                checked_states: checkedStates
              })
              .eq('id', todayCard.id);

            if (updateErr) {
              console.error('[Twilio Webhook] Failed to mark task as done:', updateErr);
              await sendWhatsAppMessage(chatId, formatForWhatsApp(`❌ Sorry, I couldn't update today's task. Please try checking it on the web dashboard.`));
            } else {
              const greeting = formatUserGreeting(user.preferred_greeting, user.display_name, user.email);
              await sendWhatsAppMessage(chatId, formatForWhatsApp(`✅ <b>Awesome job, ${user.display_name || 'friend'}!</b>\n\nI've marked today's moves as completed on your dashboard. Keep up the phenomenal momentum! 🚀`));
            }
            return NextResponse.json({ ok: true });
          }
        }
      }

      // 2. Determine if user is in onboarding or active coaching (has a plan)
      const { data: plan } = await supabase
        .from('plans')
        .select('id, created_at, start_date')
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
          await sendWhatsAppMessage(chatId, formatForWhatsApp('⚠️ Something went wrong trying to start onboarding. Please try again on the web.'));
          return NextResponse.json({ ok: true });
        }

        const updatedMessages = [
          ...(conversation.messages || []),
          { role: 'user', content: text }
        ];

        // Call Gemini onboarding chat
        const reply = await OnboardingService.chat(updatedMessages, { name: user.display_name, timezone: user.timezone });
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

        // Send Deylon's reply back to user via Telegram split into bubbles
        await sendBubbleReply(chatId, cleanReply);
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
          // Fetch the completed onboarding conversation to copy the extracted profile
          const { data: onboardingConv } = await supabase
            .from('conversations')
            .select('extracted_profile')
            .eq('user_id', user.id)
            .eq('completed', true)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          const { data: newConv } = await supabase
            .from('conversations')
            .insert({ 
              user_id: user.id, 
              messages: [],
              extracted_profile: onboardingConv?.extracted_profile || null
            })
            .select()
            .single();
          conversation = newConv;
        }

        if (!conversation) {
          await sendWhatsAppMessage(chatId, formatForWhatsApp('⚠️ Something went wrong trying to access your coaching session.'));
          return NextResponse.json({ ok: true });
        }

        // PRE-START CHECK: If the sprint hasn't started yet, intercept the chat!
        const sprintDayCalc = getDayNumber(plan.start_date || new Date(plan.created_at), user.timezone || 'Africa/Lagos');
        if (sprintDayCalc < 1) {
          const timezone = user.timezone || 'Africa/Lagos';
          const userLocalTime = new Date(new Date().toLocaleString('en-US', { timeZone: timezone }));
          const msgClean = text.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '').trim();
          const hasWord = (w: string) => new RegExp(`\\b${w}\\b`).test(msgClean);

          let newStartDate = '';
          if (hasWord('today') && !hasWord('not')) {
            const currentHour = userLocalTime.getHours();
            if (currentHour >= 21) {
              await sendWhatsAppMessage(chatId, formatForWhatsApp(`⚠️ It's past 9 PM — too late to kick off today. Want to start *tomorrow* instead? Just reply "tomorrow".`));
              return NextResponse.json({ ok: true });
            }
            newStartDate = getTodayISO(timezone);
          } else if (hasWord('tomorrow')) {
            newStartDate = getTomorrowISO(timezone);
          } else {
            const ordinalMatch = msgClean.match(/\b(\d{1,2})(?:st|nd|rd|th)\b/);
            if (ordinalMatch) {
              const dayNum = parseInt(ordinalMatch[1], 10);
              if (dayNum >= 1 && dayNum <= 31) {
                const candidate = new Date(userLocalTime);
                candidate.setDate(dayNum);
                if (candidate.getTime() < userLocalTime.getTime() && candidate.getDate() !== userLocalTime.getDate()) {
                  candidate.setMonth(candidate.getMonth() + 1);
                  candidate.setDate(dayNum);
                }
                newStartDate = candidate.toISOString().split('T')[0];
              }
            } else {
              const weekdays = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
              let wdIdx = -1;
              for (let i = 0; i < weekdays.length; i++) {
                if (msgClean.includes(weekdays[i])) { wdIdx = i; break; }
              }
              if (wdIdx !== -1) {
                let diff = wdIdx - userLocalTime.getDay();
                if (diff <= 0) diff += 7;
                const d = new Date(userLocalTime);
                d.setDate(d.getDate() + diff);
                newStartDate = d.toISOString().split('T')[0];
              } else {
                const relMatch = msgClean.match(/(?:in\s+)?(\d+)\s*days?/i);
                if (relMatch) {
                  const d = new Date(userLocalTime);
                  d.setDate(d.getDate() + parseInt(relMatch[1], 10));
                  newStartDate = d.toISOString().split('T')[0];
                } else {
                  const isoMatch = msgClean.match(/(\d{4})-(\d{2})-(\d{2})/);
                  if (isoMatch) newStartDate = `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
                }
              }
            }
          }

          if (newStartDate) {
            await supabase.from('plans').update({ start_date: newStartDate }).eq('id', plan.id);
            if (newStartDate === getTodayISO(timezone)) {
              await sendWhatsAppMessage(chatId, formatForWhatsApp(`✅ *Got it, ${user.display_name || 'friend'}!* I've updated your challenge to start *today*.

I'll send your first daily move at *10 AM*. Rest up and get ready! 💪`));
            } else {
              await sendWhatsAppMessage(chatId, formatForWhatsApp(`✅ *Got it!* I've rescheduled your challenge to start on *${newStartDate}*.

I'll deliver your first daily move that morning at 10 AM. See you then!`));
            }
          } else {
            await sendWhatsAppMessage(chatId, formatForWhatsApp(`🌅 *Hey ${user.display_name || 'friend'}!*

Your challenge is currently scheduled to start on *${plan.start_date}*.

Want to start sooner? Just say "today", "tomorrow", or give me a specific date (e.g. "the 16th" or "Friday").`));
          }
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
        
        const sprintDay = latestCard?.day_number || sprintDayCalc;

        // Call daily coaching chat service
        const reply = await DailyChatService.chat(supabase, user.id, conversation.id, sprintDay);

        // Check for the new explicit hidden completion sync token (e.g. [TASK_DONE: X])
        let syncedDayNumber: number | null = null;
        let cleanReply = reply;
        const taskDoneMatch = reply.match(/\[TASK_DONE:\s*(\d+)\]/i);

        if (taskDoneMatch) {
          syncedDayNumber = parseInt(taskDoneMatch[1], 10);
          cleanReply = reply.replace(/\[TASK_DONE:\s*\d+\]/gi, '').trim();
          console.log('[Twilio Webhook] Found explicit task completion sync token for day:', syncedDayNumber);
        }

        // Check if LLM response indicates task completion verification
        const lowerReply = reply.toLowerCase();
        const shouldMarkDone = !!taskDoneMatch ||
                               lowerReply.includes('task checked 100%') || 
                               lowerReply.includes('task checked') ||
                               lowerReply.includes("marked today's move as done") ||
                               lowerReply.includes("marked today's moves as done") ||
                               lowerReply.includes("marked today's task as done") ||
                               lowerReply.includes("marked today's tasks as done") ||
                               lowerReply.includes("marked today's move as completed") ||
                               lowerReply.includes("marked today's task as completed");

        if (shouldMarkDone) {
          const targetDay = syncedDayNumber || sprintDay;
          console.log('[Twilio Webhook] Syncing DB completion status for dayNumber:', targetDay);
          // Fetch target card
          const { data: targetCard } = await supabase
            .from('daily_cards')
            .select('*')
            .eq('user_id', user.id)
            .eq('plan_id', plan.id)
            .eq('day_number', targetDay)
            .maybeSingle();

          if (targetCard && targetCard.status !== 'done') {
            const taskItems = parseTasks(targetCard.task);
            const checkedStates = Array(taskItems.length).fill(true);

            const { error: updateErr } = await supabase
              .from('daily_cards')
              .update({
                status: 'done',
                completed_at: new Date().toISOString(),
                checked_states: checkedStates
              })
              .eq('id', targetCard.id);

            if (updateErr) {
              console.error('[Twilio Webhook] Failed to auto-mark task as done from LLM reply:', updateErr);
            } else {
              console.log('[Twilio Webhook] Successfully marked task as done in DB from LLM reply for day:', targetDay);
            }
          }
        }

        // Save Deylon's reply to the database
        const finalMessages = [
          ...updatedMessages,
          { role: 'assistant', content: cleanReply }
        ];

        await supabase
          .from('conversations')
          .update({ messages: finalMessages })
          .eq('id', conversation.id);

        // Send Deylon's response to the user via WhatsApp split into bubbles
        await sendBubbleReply(chatId, cleanReply);

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
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[telegram/webhook] Error:', error);
    return NextResponse.json({ ok: true }); // Always 200 to Telegram
  }
}
