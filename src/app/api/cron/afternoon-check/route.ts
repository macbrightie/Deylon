import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { sendPlatformMessage } from '@/lib/messaging';
import { formatUserGreeting, appendToConversationHistory } from '@/lib/telegram/message';
import { getDayNumber } from '@/lib/utils/date';
import { parseTasks, formatTaskForTelegram } from '@/lib/utils';

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
          .select('id, created_at, start_date')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!plan) return;

        const dayNumber = getDayNumber(plan.start_date || new Date(plan.created_at), user.timezone || 'Africa/Lagos');
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
          await sendPlatformMessage(user, messageText);
          await appendToConversationHistory(supabase, user.id, 'assistant', messageText);
        } else if (card.status === 'pending') {
          // Check if it's been pending for 2+ days
          let inactiveDays = 0;
          if (dayNumber > 1) {
             const { data: pastCards } = await supabase
               .from('daily_cards')
               .select('day_number, status')
               .eq('user_id', user.id)
               .eq('plan_id', plan.id)
               .eq('status', 'pending')
               .gte('day_number', dayNumber - 2)
               .lte('day_number', dayNumber);
             
             inactiveDays = pastCards?.length || 0;
          }

          if (inactiveDays >= 2) {
             // Re-engagement
             const { data: fullPlan } = await supabase.from('plans').select('plan_data').eq('id', plan.id).single();
             const planData = fullPlan?.plan_data as any;
             const primaryGoal = planData?.primary_goal || 'your goals';
             const why = planData?.motivational_anchor || 'become the best version of yourself';

             const reengageText = `👀 <b>${greeting}</b>\n\nI noticed you haven't checked in for a few days. Remember why you started this journey: to achieve ${primaryGoal} and ${why}.\n\nDon't quit on yourself now! Let's get back on track. Simply reply "Done" if you've finished your tasks, or let me know if you need help!`;

             await sendPlatformMessage(user, reengageText);
             await appendToConversationHistory(supabase, user.id, 'assistant', reengageText);
          } else {
             const tasksList = formatTaskForTelegram(card.task);
             const messageText = `👋 <b>${greeting}</b>\n\nHow's your move going today? Here's what's on your list:\n\n📌 <b>Today's Move:</b>\n${tasksList}\n\nRemember to check them off on the dashboard once completed, or just reply 'Done' here when you finish!`;
             await sendPlatformMessage(user, messageText);
             await appendToConversationHistory(supabase, user.id, 'assistant', messageText);
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
    console.error('[afternoon-check] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
