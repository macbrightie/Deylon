import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { sendMessage } from '@/lib/telegram/bot';
import { formatUserGreeting } from '@/lib/telegram/message';
import { getDayNumber } from '@/lib/utils/date';

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const force = request.nextUrl.searchParams.get('force') === 'true';

  try {
    const supabase = await createServiceClient();

    // Fetch all users with a telegram_chat_id
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, display_name, telegram_chat_id, timezone, preferred_greeting')
      .not('telegram_chat_id', 'is', null);

    if (error) {
      console.error('[afternoon-check] Failed to fetch users:', error);
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

        if (!force && currentHour !== 16) {
          skippedCount++;
          return;
        }

        // 2. Fetch latest active plan
        const { data: plan } = await supabase
          .from('plans')
          .select('id, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!plan) return;

        const dayNumber = getDayNumber(new Date(plan.created_at), user.timezone || 'Africa/Lagos');
        if (dayNumber > 21) return; // Sprint complete

        // 3. Fetch today's card status
        const { data: card } = await supabase
          .from('daily_cards')
          .select('*')
          .eq('user_id', user.id)
          .eq('plan_id', plan.id)
          .eq('day_number', dayNumber)
          .maybeSingle();

        if (!card) return;

        const greeting = formatUserGreeting(user.preferred_greeting, user.display_name, user.email);

        if (card.status === 'done') {
          // Already completed
          const messageText = `🌟 <b>${greeting}</b>\n\nI saw you checked off all tasks for today! Spectacular progress. Enjoy your evening!`;
          await sendMessage(user.telegram_chat_id!, messageText);
        } else if (card.status === 'pending') {
          // Extract checklist sentences
          const sentences = card.task
            ? card.task
                .split(/(?<=[.!?])\s+/)
                .map((s: string) => s.trim())
                .filter((s: string) => s.length > 2)
            : [];

          const tasksList = sentences.map((s: string) => `⬜️ ${s}`).join('\n');
          const messageText = `👋 <b>${greeting}</b>\n\nHow's your move going today? Here's what's on your list:\n\n${tasksList}\n\nRemember to check them off on the dashboard once completed! Tell me: how much time did you spend on this today?`;

          await sendMessage(user.telegram_chat_id!, messageText);
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
    console.error('[afternoon-check] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
