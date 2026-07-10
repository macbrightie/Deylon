import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { sendPlatformMessage } from '@/lib/messaging';
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
      .select('id, email, display_name, telegram_chat_id, whatsapp_number, preferred_platform, timezone, preferred_greeting')
      .or('telegram_chat_id.not.is.null,whatsapp_number.not.is.null');

    if (error) {
      console.error('[morning-check] Failed to fetch users:', error);
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

        if (!force && currentHour !== 10) {
          skippedCount++;
          return;
        }

        // 2. Fetch latest active plan
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

        // 3. Fetch today's card if it's pending
        const { data: card } = await supabase
          .from('daily_cards')
          .select('*')
          .eq('user_id', user.id)
          .eq('plan_id', plan.id)
          .eq('day_number', dayNumber)
          .eq('status', 'pending')
          .maybeSingle();

        if (!card) return;

        // 3.5 Check for Grace Period & Streak Breaks
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

        // 4. Send morning task reminder
        const greeting = formatUserGreeting(user.preferred_greeting, user.display_name, user.email);
        const messageText = `🌅 <b>${greeting}</b>\n\nHere is your move for today:\n\n📌 <b>Today's Move:</b>\n${formatTaskForTelegram(card.task)}\n\nYou've got this! Let's get it done today.${streakWarning}`;
        const followUpText = `Feel free to ask me any questions if today's task isn't perfectly clear!`;

        await sendPlatformMessage(user, messageText);
        await new Promise((resolve) => setTimeout(resolve, 1500));
        await sendPlatformMessage(user, followUpText);
        await appendToConversationHistory(supabase, user.id, 'assistant', `${messageText}\n\n${followUpText}`);
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
    console.error('[morning-check] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
