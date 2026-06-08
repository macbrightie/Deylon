import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { sendMessage } from '@/lib/telegram/bot';
import {
  buildDailyReminder,
  buildGraceMessage,
} from '@/lib/telegram/message';
import { getDayNumber, getTodayISO } from '@/lib/utils/date';

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = await createServiceClient();

    // Fetch all users with a telegram_chat_id
    const { data: users, error } = await supabase
      .from('users')
      .select('id, telegram_chat_id, timezone')
      .not('telegram_chat_id', 'is', null);

    if (error) {
      console.error('[daily-reminder] Failed to fetch users:', error);
      return NextResponse.json({ error: 'DB error' }, { status: 500 });
    }

    const results = await Promise.allSettled(
      (users ?? []).map(async (user) => {
        // Get latest plan
        const { data: plan } = await supabase
          .from('plans')
          .select('id, created_at, start_date')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (!plan) return;

        const dayNumber = getDayNumber(
          plan.start_date || new Date(plan.created_at),
          user.timezone
        );

        if (dayNumber > 100) return; // Challenge complete

        // Get today's card
        const { data: card } = await supabase
          .from('daily_cards')
          .select('*')
          .eq('user_id', user.id)
          .eq('plan_id', plan.id)
          .eq('day_number', dayNumber)
          .single();

        if (!card) return;

        // Check yesterday's status for grace day logic
        const { data: yesterday } = await supabase
          .from('sprint_progress')
          .select('status')
          .eq('user_id', user.id)
          .eq('day_number', dayNumber - 1)
          .single();

        let messageText: string;

        if (yesterday?.status === 'grace') {
          messageText = buildGraceMessage(dayNumber, card.task);
        } else {
          messageText = buildDailyReminder({
            dayNumber,
            task: card.task,
            duration: card.duration ?? '30 minutes',
            chainToGoal: card.chain_to_goal ?? 'your goal',
            appUrl: process.env.NEXT_PUBLIC_APP_URL!,
          });
        }

        await sendMessage(user.telegram_chat_id!, messageText);

        // Mark card as revealed
        const todayISO = getTodayISO(user.timezone);
        await supabase
          .from('daily_cards')
          .update({ revealed_at: todayISO })
          .eq('id', card.id);
      })
    );

    const failed = results.filter((r) => r.status === 'rejected').length;
    return NextResponse.json({
      sent: results.length - failed,
      failed,
    });
  } catch (error) {
    console.error('[daily-reminder] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
