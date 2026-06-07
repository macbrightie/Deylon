import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PlannerService } from '@/lib/ai/services/planner.service';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { intensity, timeline_months, change_description } = body as {
      intensity: 'steady' | 'serious' | 'all-in';
      timeline_months: number;
      change_description: string;
    };

    if (!intensity || !timeline_months || !change_description) {
      return NextResponse.json(
        { error: 'intensity, timeline_months, and change_description are required' },
        { status: 400 }
      );
    }

    // 1. Fetch active coach plan
    const { data: activePlan, error: planError } = await supabase
      .from('plans')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (planError || !activePlan) {
      return NextResponse.json(
        { error: 'Active plan not found' },
        { status: 404 }
      );
    }

    // 2. Fetch all completed/done daily cards
    const { data: completedCards, error: cardsError } = await supabase
      .from('daily_cards')
      .select('*')
      .eq('user_id', user.id)
      .eq('plan_id', activePlan.id)
      .eq('status', 'done')
      .order('day_number', { ascending: true });

    if (cardsError) {
      console.error('[adjust-plan] Failed to fetch completed cards:', cardsError);
      return NextResponse.json(
        { error: 'Failed to fetch cards status' },
        { status: 500 }
      );
    }

    // Find the next day number to generate
    const maxCompletedDay = completedCards && completedCards.length > 0
      ? Math.max(...completedCards.map(c => c.day_number))
      : 0;

    const startDay = maxCompletedDay + 1;

    if (startDay > 21) {
      return NextResponse.json(
        { error: 'All 21 days of the sprint are already completed. Plan adjustment is not available.' },
        { status: 400 }
      );
    }

    // Prepare clean completed tasks description for AI prompt context
    const completedTasksContext = (completedCards || []).map(c => ({
      day_number: c.day_number,
      task: c.task,
      status: 'completed'
    }));

    // 3. Call AI adjustPlan service
    const adjustedData = await PlannerService.adjustPlan(
      activePlan.plan_data,
      completedTasksContext,
      intensity,
      timeline_months,
      change_description,
      startDay
    );

    if (!adjustedData || !Array.isArray(adjustedData.daily_tasks)) {
      return NextResponse.json(
        { error: 'Failed to generate adjusted plan details' },
        { status: 500 }
      );
    }

    // 4. Merge the new daily tasks with the old completed ones
    const originalPlanData = activePlan.plan_data || {};
    const originalDailyTasks = originalPlanData.daily_tasks || [];

    // Filter out old daily tasks starting from startDay
    const baseDailyTasks = originalDailyTasks.filter((t: any) => t.day_number < startDay);

    // Merge in the newly generated daily tasks
    const mergedDailyTasks = [...baseDailyTasks, ...adjustedData.daily_tasks].sort(
      (a: any, b: any) => a.day_number - b.day_number
    );

    // Build the final merged plan_data payload
    const mergedPlanData = {
      ...originalPlanData,
      sprint_theme: adjustedData.sprint_theme || originalPlanData.sprint_theme,
      summary: adjustedData.summary || originalPlanData.summary,
      motivational_anchor: adjustedData.motivational_anchor || originalPlanData.motivational_anchor,
      timeline_months: adjustedData.timeline_months || timeline_months,
      intensity: adjustedData.intensity || intensity,
      daily_tasks: mergedDailyTasks
    };

    // 5. Update plans table row
    const { error: updatePlanError } = await supabase
      .from('plans')
      .update({
        plan_data: mergedPlanData,
        primary_goal: adjustedData.primary_goal || activePlan.primary_goal,
        timeline_years: Math.ceil(timeline_months / 12),
        updated_at: new Date().toISOString()
      })
      .eq('id', activePlan.id);

    if (updatePlanError) {
      console.error('[adjust-plan] Failed to update plans table:', updatePlanError);
      return NextResponse.json(
        { error: 'Failed to update plan data in database' },
        { status: 500 }
      );
    }

    // 6. Delete all future pending daily cards (day_number >= startDay)
    const { error: deleteCardsError } = await supabase
      .from('daily_cards')
      .delete()
      .eq('plan_id', activePlan.id)
      .eq('user_id', user.id)
      .gte('day_number', startDay);

    if (deleteCardsError) {
      console.error('[adjust-plan] Failed to delete old cards:', deleteCardsError);
      return NextResponse.json(
        { error: 'Failed to update sprint tasks configuration' },
        { status: 500 }
      );
    }

    // 7. Insert the newly generated daily cards
    const newDailyCards = adjustedData.daily_tasks.map((task: any) => ({
      user_id: user.id,
      plan_id: activePlan.id,
      day_number: task.day_number,
      task: task.task,
      duration: task.duration || '30 mins',
      chain_to_sprint: task.chain_to_sprint || '',
      chain_to_goal: task.chain_to_goal || '',
      social_chat_messages: task.social_chat_messages || [],
      status: 'pending',
    }));

    const { error: insertCardsError } = await supabase
      .from('daily_cards')
      .insert(newDailyCards);

    if (insertCardsError) {
      console.error('[adjust-plan] Failed to insert adjusted daily cards:', insertCardsError);
      return NextResponse.json(
        { error: 'Failed to provision updated daily cards' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      plan_id: activePlan.id,
      plan_data: mergedPlanData
    });
  } catch (error) {
    console.error('[adjust-plan/route] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
