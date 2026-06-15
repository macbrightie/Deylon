import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PlannerService } from '@/lib/ai/services/planner.service';

function extractMonthsFromTimelineGoal(goalStr: string | undefined | null): number | null {
  if (!goalStr) return null;
  const clean = goalStr.toLowerCase().trim();
  const numMatch = clean.match(/(\d+)/);
  if (!numMatch) {
    if (clean.includes('year')) {
      const yrMatch = clean.match(/(\d+)\s*year/);
      if (yrMatch) return parseInt(yrMatch[1], 10) * 12;
      return 12;
    }
    return null;
  }
  const num = parseInt(numMatch[1], 10);
  if (clean.includes('year') || clean.includes('yr')) {
    return num * 12;
  }
  return num;
}

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

    let profile = (conversation.extracted_profile ?? {}) as any;
    if (Object.keys(profile).length === 0) {
      const lastAssistantMsg = [...messages]
        .reverse()
        .find((m: any) => m.role === 'assistant' && m.content.includes('[PROFILE_READY]'));
      if (lastAssistantMsg) {
        const match = lastAssistantMsg.content.match(/\[PROFILE_READY\]([\s\S]*?)\[\/PROFILE_READY\]/);
        if (match) {
          try {
            profile = JSON.parse(match[1].trim());
            await supabase
              .from('conversations')
              .update({ extracted_profile: profile })
              .eq('id', conversationId);
          } catch (e) {
            console.error('[generate-plan] Failed to parse [PROFILE_READY] from messages:', e);
          }
        }
      }
    }

    // Sync onboarding details to users table
    const startingLevel = profile.startingLevel || 'beginner';
    const intensity = profile.intensity || 'serious';
    const timezone = profile.timezone || 'Africa/Lagos';

    await supabase
      .from('users')
      .update({
        starting_level: startingLevel,
        intensity: intensity,
        timezone: timezone
      })
      .eq('id', user.id);

    // Generate plan with Gemini
    const planData = await PlannerService.generatePlan(profile, transcript);

    // Basic validation
    if (!planData || typeof planData.primary_goal !== 'string') {
      return NextResponse.json(
        { error: 'Plan generation failed — schema validation failed' },
        { status: 500 }
      );
    }

    const parsedTimelineMonths = extractMonthsFromTimelineGoal(profile.timelineGoal);
    const finalTimelineMonths = parsedTimelineMonths || planData.timeline_months || 12;
    
    // Sync JSON object
    planData.timeline_months = finalTimelineMonths;

    // Save plan to database
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .insert({
        user_id: user.id,
        plan_data: planData,
        primary_goal: planData.primary_goal,
        timeline_months: finalTimelineMonths,
        timeline_years: Math.ceil(finalTimelineMonths / 12),
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
