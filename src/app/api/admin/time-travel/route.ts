import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  // Prevent execution in production unless specifically enabled
  if (process.env.NODE_ENV !== 'development' && process.env.NEXT_PUBLIC_ENABLE_GOD_MODE !== 'true') {
    return NextResponse.json({ error: 'Unauthorized environment' }, { status: 403 });
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Extra safety: require +test email in production environments
    if (process.env.NODE_ENV !== 'development' && !user.email?.includes('+test@')) {
      return NextResponse.json({ error: 'Not a test account' }, { status: 403 });
    }

    // 1. Get active plan
    const { data: plan } = await supabase
      .from('plans')
      .select('id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!plan) {
      return NextResponse.json({ error: 'No active plan found' }, { status: 404 });
    }

    // 2. Get current pending card
    const { data: pendingCard } = await supabase
      .from('daily_cards')
      .select('*')
      .eq('user_id', user.id)
      .eq('plan_id', plan.id)
      .eq('status', 'pending')
      .order('day_number', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (pendingCard) {
      // Mark as done
      await supabase
        .from('daily_cards')
        .update({ status: 'done', completed_at: new Date().toISOString() })
        .eq('id', pendingCard.id);
        
      return NextResponse.json({ success: true, message: `Completed Day ${pendingCard.day_number}, advanced to Day ${pendingCard.day_number + 1}` });
    }

    return NextResponse.json({ success: false, message: 'No pending cards left' });

  } catch (err: any) {
    console.error('[TimeTravel Error]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
