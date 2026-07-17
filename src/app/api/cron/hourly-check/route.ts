import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { sendPlatformMessage, sendPlatformSplitMessages } from '@/lib/messaging';
import { formatUserGreeting, appendToConversationHistory } from '@/lib/telegram/message';
import { getDayNumber, getTodayISO, getTomorrowISO } from '@/lib/utils/date';
import { parseTasks, formatTaskForTelegram } from '@/lib/utils';

function extractStudyHint(taskText: string): string {
  if (!taskText) return '';
  const studyMatch = taskText.match(/Study:\s*([^.]+)/i);
  if (studyMatch && studyMatch[1]) {
    return studyMatch[1].trim();
  }
  const firstSentence = taskText.split('.')[0];
  return firstSentence.replace(/Study:\s*/i, '').trim();
}

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const force = request.nextUrl.searchParams.get('force') === 'true';
  const forcedHour = request.nextUrl.searchParams.get('hour') ? parseInt(request.nextUrl.searchParams.get('hour')!, 10) : null;

  try {
    const supabase = await createServiceClient();

    // Fetch all users with either platform connected
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, display_name, telegram_chat_id, whatsapp_number, preferred_platform, timezone, preferred_greeting, carry_over_count_this_week, is_pro')
      .or('telegram_chat_id.not.is.null,whatsapp_number.not.is.null');

    if (error) {
      console.error('[hourly-check] Failed to fetch users:', error);
      return NextResponse.json({ error: 'DB error' }, { status: 500 });
    }

    let sentCount = 0;
    let skippedCount = 0;
    const challengeDays = 21;

    const results = await Promise.allSettled(
      (users ?? []).map(async (user) => {
        const userLocalTime = new Date(
          new Date().toLocaleString('en-US', { timeZone: user.timezone || 'Africa/Lagos' })
        );
        const currentHour = forcedHour !== null ? forcedHour : userLocalTime.getHours();

        const { data: plan } = await supabase
          .from('plans')
          .select('id, created_at, start_date, plan_data')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!plan) return;

        const dayNumber = getDayNumber(plan.start_date || new Date(plan.created_at), user.timezone || 'Africa/Lagos');
        
        if (!user.is_pro && dayNumber > 14) {
          if (dayNumber === 15) {
            const greeting = formatUserGreeting(user.preferred_greeting, user.display_name, user.email);
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://deylon.app';
            const paywallMsg = `✨ <b>${greeting}</b>\n\nYour 14-day Deylon free trial completed yesterday. We did some great work building your habits toward your goals!\n\nHow are you feeling now that the initial sprint is done?\n\nOur journey doesn't have to stop here. Upgrading to Deylon Pro unlocks the rest of your sprint (Days 15–21), custom daily plans, and personalized strategy updates.\n\nReady to keep building? Head to your dashboard to upgrade:\n${appUrl}/dashboard`;
            await sendPlatformMessage(user, paywallMsg);
            await appendToConversationHistory(supabase, user.id, 'assistant', paywallMsg);
          }
          return;
        }

        if (dayNumber > challengeDays) return;

        const { data: card } = await supabase
          .from('daily_cards')
          .select('*')
          .eq('user_id', user.id)
          .eq('plan_id', plan.id)
          .eq('day_number', dayNumber)
          .maybeSingle();

        if (!card) return;

        const greeting = formatUserGreeting(user.preferred_greeting, user.display_name, user.email);

        // ==========================================
        // MORNING (10 AM) CHECK
        // ==========================================
        if (currentHour === 10) {
          let streakWarning = '';
          if (dayNumber > 1) {
            const { data: pastCards } = await supabase
              .from('daily_cards')
              .select('day_number, status')
              .eq('user_id', user.id)
              .eq('plan_id', plan.id)
              .in('day_number', [dayNumber - 1, dayNumber - 2]);
              
            const yesterdayCard = pastCards?.find(c => c.day_number === dayNumber - 1);
            const twoDaysAgoCard = pastCards?.find(c => c.day_number === dayNumber - 2);

            if (twoDaysAgoCard && twoDaysAgoCard.status === 'pending') {
              streakWarning = `\n\n<i>(P.S. I noticed we missed the move from two days ago, which resets the active streak. Let's start fresh and build it back up today.)</i>`;
            } else if (yesterdayCard && yesterdayCard.status === 'pending') {
              streakWarning = `\n\n<i>(P.S. I noticed yesterday's move is still unchecked! You have a 24-hour grace period to finish it today alongside your new task. Knock them both out today so you don't lose your streak!)</i>`;
            }
          }

          const messageText = `🌅 <b>${greeting}</b>\n\nHere's a quick reminder of your daily move today:\n\n📌 <b>${formatTaskForTelegram(card.task)}</b>\n\nYou've got this! Let's get it done today.${streakWarning}`;

          await sendPlatformMessage(user, messageText);
          await appendToConversationHistory(supabase, user.id, 'assistant', messageText);
          sentCount++;
          return;
        }

        // ==========================================
        // AFTERNOON (4 PM) CHECK
        // ==========================================
        if (currentHour === 16) {
          if (card.status === 'done' || card.status === 'adjusted') {
            // Task is done — celebrate and don't repeat the task
            const messageText = `🌟 *${greeting}*\n\nNice work getting today's move done! You're building serious momentum. Enjoy your afternoon — I'll check in this evening.`;
            await sendPlatformMessage(user, messageText);
            await appendToConversationHistory(supabase, user.id, 'assistant', messageText);
          } else {
            // Task still pending — reference it by name, don't repeat the whole thing
            const taskTitle = card.task.split('\n')[0].replace(/^[•\-\*]\s*/, '').slice(0, 80);
            const { data: pastCards } = await supabase
              .from('daily_cards')
              .select('status')
              .eq('user_id', user.id)
              .eq('plan_id', plan.id)
              .in('day_number', [dayNumber - 1, dayNumber - 2]);

            const pendingCount = pastCards?.filter(c => c.status === 'pending').length || 0;

            let messageText: string;
            if (pendingCount >= 2) {
              const primaryGoal = (plan.plan_data as any)?.primaryGoal || 'your goals';
              messageText = `👀 *${greeting}*\n\nHaven't seen you in a couple of days — just checking in. Your goal of *${primaryGoal}* is worth the push.\n\nYour move for today is still pending. Even 10 minutes counts. Reply \"Done\" whenever you've made progress!`;
            } else {
              messageText = `☀️ *${greeting}*\n\nAfternoon check-in — *${taskTitle}* is still on your list for today.\n\nHow's it going? Let me know when you've knocked it out, or reply \"done\" to check it off!`;
            }
            await sendPlatformMessage(user, messageText);
            await appendToConversationHistory(supabase, user.id, 'assistant', messageText);
          }
          sentCount++;
          return;
        }

        // ==========================================
        // EVENING (9 PM) DELIVERY / CARRY-OVER
        // ==========================================
        if (currentHour === 21) {
          const nextDayNumber = dayNumber + 1;

          if (card.status === 'done' || card.status === 'adjusted') {
            if (nextDayNumber > challengeDays) {
              const finishedMsg = `🎉 <b>${greeting}</b>\n\nYou have completed all daily cards for this challenge! Sensational job. Rest well.`;
              await sendPlatformMessage(user, finishedMsg);
              await appendToConversationHistory(supabase, user.id, 'assistant', finishedMsg);
              return;
            }

            const { data: tomorrowCard } = await supabase
              .from('daily_cards')
              .select('*')
              .eq('user_id', user.id)
              .eq('plan_id', plan.id)
              .eq('day_number', nextDayNumber)
              .maybeSingle();

            if (tomorrowCard) {
              let bubbles = (tomorrowCard.social_chat_messages as string[]) || [];
              
              if (!Array.isArray(bubbles) || bubbles.length === 0) {
                bubbles = [
                  `🌅 <b>Tomorrow's Move — Day ${nextDayNumber}</b>`,
                  `📌 <b>Task:</b>\n${formatTaskForTelegram(tomorrowCard.task)}`,
                  `Are you ready for it?`
                ];
              }

              bubbles[0] = `✨ <b>${greeting}</b>\n\n${bubbles[0]}`;

              await sendPlatformSplitMessages(user, bubbles);
              await appendToConversationHistory(supabase, user.id, 'assistant', bubbles.join('\n\n'));

              await supabase
                .from('daily_cards')
                .update({ revealed_at: new Date().toISOString() })
                .eq('id', tomorrowCard.id);
            }
          } else if (card.status === 'pending') {
            const taskTitle = card.task.split('\n')[0].replace(/^[•\-\*]\s*/, '').slice(0, 80);
            const currentCarryOverCount = user.carry_over_count_this_week ?? 0;

            if (currentCarryOverCount < 1) {
              const carryOverPrompt = `👀 *${greeting}*\n\n*${taskTitle}* is still pending on your dashboard.\n\nWould you like to carry it over to tomorrow? (You can only do this once per week).\n\nReply *"carry over"* to confirm, or *"no"* if you'll finish it tonight!`;
              await sendPlatformMessage(user, carryOverPrompt);
              await appendToConversationHistory(supabase, user.id, 'assistant', carryOverPrompt);
            } else {
              let cannotCarryMsg = `👀 *${greeting}*\n\n*${taskTitle}* is still pending and you've already used your weekly carry-over. Push to finish it tonight — you've got this!`;

              if (nextDayNumber <= challengeDays) {
                const { data: tomorrowCard } = await supabase
                  .from('daily_cards')
                  .select('*')
                  .eq('user_id', user.id)
                  .eq('plan_id', plan.id)
                  .eq('day_number', nextDayNumber)
                  .maybeSingle();

                if (tomorrowCard) {
                  let bubbles = (tomorrowCard.social_chat_messages as string[]) || [];
                  if (!Array.isArray(bubbles) || bubbles.length === 0) {
                    bubbles = [
                      `🌅 <b>Tomorrow's Move — Day ${nextDayNumber}</b>`,
                      `📌 <b>Task:</b>\n${formatTaskForTelegram(tomorrowCard.task)}`,
                    ];
                  }
                  
                  cannotCarryMsg = `👀 <b>${greeting}</b>\n\nIt looks like today's task is still pending, and you've already used your weekly carry-over limit.\n\nTry to finish it tonight! To keep you prepared, here is what is on the agenda for tomorrow:`;
                  
                  await sendPlatformMessage(user, cannotCarryMsg);
                  await appendToConversationHistory(supabase, user.id, 'assistant', cannotCarryMsg);

                  await sendPlatformSplitMessages(user, bubbles);
                  await appendToConversationHistory(supabase, user.id, 'assistant', bubbles.join('\n\n'));

                  await supabase
                    .from('daily_cards')
                    .update({ revealed_at: new Date().toISOString() })
                    .eq('id', tomorrowCard.id);
                } else {
                  await appendToConversationHistory(supabase, user.id, 'assistant', cannotCarryMsg);
                }
              } else {
                await appendToConversationHistory(supabase, user.id, 'assistant', cannotCarryMsg);
              }
            }
          }
          sentCount++;
        } else {
          skippedCount++;
        }
      })
    );

    const failed = results.filter((r) => r.status === 'rejected').length;

    return NextResponse.json({
      success: true,
      sent: sentCount,
      skipped: skippedCount,
      failed,
    });
  } catch (error) {
    console.error('[hourly-check] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
