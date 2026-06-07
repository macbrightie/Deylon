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
    const { conversationId } = body as { conversationId: string };

    if (!conversationId) {
      return NextResponse.json(
        { error: 'conversationId is required' },
        { status: 400 }
      );
    }

    // Fetch the conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .eq('user_id', user.id)
      .single();

    if (convError || !conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    const messages = conversation.messages;
    const transcript = messages
      .map((m: any) => `${m.role.toUpperCase()}: ${m.content}`)
      .join('\n\n');

    const profile = conversation.extracted_profile ?? {};

    // Generate plan with Gemini
    const planData = await PlannerService.generatePlan(profile, transcript);

    // Basic validation
    if (!planData || typeof planData.primary_goal !== 'string') {
      return NextResponse.json(
        { error: 'Plan generation failed — schema validation failed' },
        { status: 500 }
      );
    }

    // Save plan to database
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .insert({
        user_id: user.id,
        plan_data: planData,
        primary_goal: planData.primary_goal,
        timeline_years: Math.ceil((planData.timeline_months || 12) / 12),
        version: 1,
      })
      .select()
      .single();

    if (planError) {
      console.error('[generate-plan] DB error:', planError);
      return NextResponse.json(
        { error: 'Failed to save plan' },
        { status: 500 }
      );
    }

    // Seed the first 100 daily cards
    const dailyCards = planData.daily_tasks.slice(0, 100).map((task) => ({
      user_id: user.id,
      plan_id: plan.id,
      day_number: task.day_number,
      task: task.task,
      duration: task.duration,
      chain_to_sprint: task.chain_to_sprint,
      chain_to_goal: task.chain_to_goal,
      social_chat_messages: task.social_chat_messages || [],
      status: 'pending',
    }));

    await supabase.from('daily_cards').insert(dailyCards);

    return NextResponse.json({ planId: plan.id, plan: planData });
  } catch (error) {
    console.error('[generate-plan/route] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
