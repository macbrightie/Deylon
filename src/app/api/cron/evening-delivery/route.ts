import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { sendPlatformMessage, sendPlatformSplitMessages } from '@/lib/messaging';
import { formatUserGreeting, appendToConversationHistory } from '@/lib/telegram/message';
import { getDayNumber } from '@/lib/utils/date';
import { formatTaskForTelegram } from '@/lib/utils';

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const force = request.nextUrl.searchParams.get('force') === 'true';

  try {
    const supabase = await createServiceClient();

    // Fetch all users with either platform connected
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, display_name, telegram_chat_id, whatsapp_number, preferred_platform, timezone, preferred_greeting, carry_over_count_this_week')
      .or('telegram_chat_id.not.is.null,whatsapp_number.not.is.null');

    if (error) {
      console.error('[evening-delivery] Failed to fetch users:', error);
      return NextResponse.json({ error: 'DB error' }, { status: 500 });
    }

    let sentCount = 0;
    let skippedCount = 0;

    const results = await Promise.allSettled(
      (users ?? []).map(async (user) => {
        // 1. Timezone Check
        const userLocalTime = new Date(
          new Date().toLocaleString('en-US', { timeZone: user.timezone || 'Africa/Lagos' })
        );
        const currentHour = userLocalTime.getHours();

        if (!force && currentHour !== 21) {
          skippedCount++;
          return;
        }

        // 2. Sunday night weekly carryover reset
        const userDayOfWeek = userLocalTime.getDay(); // 0 is Sunday
        let currentCarryOverCount = user.carry_over_count_this_week ?? 0;
        if (userDayOfWeek === 0) {
          await supabase
            .from('users')
            .update({
              carry_over_count_this_week: 0,
              carry_over_last_reset: new Date().toISOString(),
            })
            .eq('id', user.id);
          currentCarryOverCount = 0;
        }

        // 3. Fetch latest active plan
        const { data: plan } = await supabase
          .from('plans')
          .select('id, created_at, start_date')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!plan) return;

        const dayNumber = getDayNumber(plan.start_date || new Date(plan.created_at), user.timezone || 'Africa/Lagos');
        if (dayNumber > 21) return; // Sprint complete

        // 4. Fetch today's card status
        const { data: todayCard } = await supabase
          .from('daily_cards')
          .select('*')
          .eq('user_id', user.id)
          .eq('plan_id', plan.id)
          .eq('day_number', dayNumber)
          .maybeSingle();

        if (!todayCard) return;

        const greeting = formatUserGreeting(user.preferred_greeting, user.display_name, user.email);

        if (todayCard.status !== 'pending') {
          // Today's task is completed or adjusted. Deliver tomorrow's task card!
          const nextDayNumber = dayNumber + 1;
          if (nextDayNumber > 21) {
            // End of challenge!
            const finishedMsg = `🎉 <b>${greeting}</b>\n\nYou have completed all daily cards for this sprint! Sensational job. Rest well.`;
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

          if (!tomorrowCard) return;

          let bubbles = (tomorrowCard.social_chat_messages as string[]) || [];
          if (!Array.isArray(bubbles) || bubbles.length === 0) {
            bubbles = [
              `🌅 <b>Tomorrow's Move — Day ${nextDayNumber}</b>`,
              `📌 <b>Task:</b>\n${formatTaskForTelegram(tomorrowCard.task)}`,
            ];
          }

          // Prepend greeting to the first bubble
          bubbles[0] = `✨ <b>${greeting}</b>\n\n${bubbles[0]}`;

          await sendPlatformSplitMessages(user, bubbles);
          await appendToConversationHistory(supabase, user.id, 'assistant', bubbles.join('\n\n'));

          // Mark tomorrow's card as revealed
          await supabase
            .from('daily_cards')
            .update({ revealed_at: new Date().toISOString() })
            .eq('id', tomorrowCard.id);

        } else {
          // Today's task is still pending!
          if (currentCarryOverCount < 1) {
            // Offer carry-over
            const carryOverPrompt = `👀 <b>${greeting}</b>\n\nIt looks like today's task is still pending on your dashboard.\n\nWould you like to carry it over to tomorrow? (You can only do this once per week).\n\nReply with <b>"carry over"</b> to confirm, or <b>"no"</b> if you'll finish it tonight!`;
            await sendPlatformMessage(user, carryOverPrompt);
            await appendToConversationHistory(supabase, user.id, 'assistant', carryOverPrompt);
          } else {
            // Cannot carry over. Warn and deliver tomorrow's task summary anyway.
            const nextDayNumber = dayNumber + 1;
            if (nextDayNumber <= 21) {
              const { data: tomorrowCard } = await supabase
                .from('daily_cards')
                .select('*')
                .eq('user_id', user.id)
                .eq('plan_id', plan.id)
                .eq('day_number', nextDayNumber)
                .maybeSingle();

              if (tomorrowCard) {
                const { parseTasks } = await import('@/lib/utils');
                const parsedTomorrow = parseTasks(tomorrowCard.task);
                const summaryActions = parsedTomorrow.map(t => t.action.replace(/^(Study|Daily Reps|Strategy|Hint):\\s*/i, '')).join(' and ');
                
                const cannotCarryMsg = `👀 <b>${greeting}</b>\n\nIt looks like today's task is still pending, and you've already used your weekly carry-over limit.\n\nTry to finish it tonight! To keep you prepared, tomorrow's focus will be: <b>${summaryActions}</b>.`;

                await sendPlatformMessage(user, cannotCarryMsg);
                await appendToConversationHistory(supabase, user.id, 'assistant', cannotCarryMsg);

                // Mark tomorrow's card as revealed
                await supabase
                  .from('daily_cards')
                  .update({ revealed_at: new Date().toISOString() })
                  .eq('id', tomorrowCard.id);
              } else {
                const cannotCarryMsg = `👀 <b>${greeting}</b>\n\nIt looks like today's task is still pending, and you've already used your weekly carry-over limit.\n\nTry to finish it tonight!`;
                await sendPlatformMessage(user, cannotCarryMsg);
                await appendToConversationHistory(supabase, user.id, 'assistant', cannotCarryMsg);
              }
            } else {
              const cannotCarryMsg = `👀 <b>${greeting}</b>\n\nIt looks like today's task is still pending, and you've already used your weekly carry-over limit.\n\nTry to finish it tonight!`;
              await sendPlatformMessage(user, cannotCarryMsg);
              await appendToConversationHistory(supabase, user.id, 'assistant', cannotCarryMsg);
            }
          }
        }
        sentCount++;
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
    console.error('[evening-delivery] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
