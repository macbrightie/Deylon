import * as dotenv from 'dotenv';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

// Resolve environment variables first before importing modules
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing env vars.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function heal() {
  console.log('--- STARTING HEAL SCRIPT ---');

  // Dynamically import PlannerService after dotenv config to avoid hoisting issues
  const { PlannerService } = await import('../src/lib/ai/services/planner.service');

  // 1. Fetch user by email
  const targetEmail = 'testingevil0@gmail.com';
  const { data: users, error: userErr } = await supabase
    .from('users')
    .select('*')
    .eq('email', targetEmail);

  if (userErr || !users || users.length === 0) {
    console.error('User not found in public.users:', userErr);
    return;
  }
  const user = users[0];
  console.log(`Found user: ${user.id} (${user.email})`);

  // 2. Fetch completed conversation for the user
  const { data: conv, error: convErr } = await supabase
    .from('conversations')
    .select('*')
    .eq('user_id', user.id)
    .eq('completed', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (convErr || !conv) {
    console.error('Completed onboarding conversation not found:', convErr);
    return;
  }
  console.log(`Found conversation: ${conv.id} with ${conv.messages?.length || 0} messages`);

  // Parse messages and profile
  const messages = conv.messages;
  const transcript = messages
    .map((m: any) => `${m.role.toUpperCase()}: ${m.content}`)
    .join('\n\n');

  const profile = conv.extracted_profile ?? {};
  console.log('Using profile:', profile);

  // 3. Generate plan with PlannerService (which uses prompt updates!)
  console.log('Generating new plan from updated prompt...');
  const planData = await PlannerService.generatePlan(profile, transcript);
  console.log('Generated planData keys:', Object.keys(planData));
  console.log('daily_tasks count:', planData.daily_tasks?.length);

  if (!planData.daily_tasks || planData.daily_tasks.length < 21) {
    console.error('Error: Generated plan does not have at least 21 daily tasks. Got:', planData.daily_tasks?.length);
    return;
  }

  // 4. Fetch the active plan for the user to update
  const { data: activePlan, error: planErr } = await supabase
    .from('plans')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (planErr || !activePlan) {
    console.error('Active plan not found for user:', planErr);
    return;
  }
  console.log(`Found active plan in DB: ${activePlan.id}`);

  // 5. Update plans table
  console.log('Updating plans table...');
  const { error: updatePlanErr } = await supabase
    .from('plans')
    .update({
      plan_data: planData,
      primary_goal: planData.primary_goal,
      timeline_years: Math.ceil((planData.timeline_months || 12) / 12),
      updated_at: new Date().toISOString()
    })
    .eq('id', activePlan.id);

  if (updatePlanErr) {
    console.error('Failed to update plans table:', updatePlanErr);
    return;
  }
  console.log('plans table updated successfully.');

  // 6. Delete old daily_cards
  console.log('Deleting old daily cards...');
  const { error: deleteCardsErr } = await supabase
    .from('daily_cards')
    .delete()
    .eq('plan_id', activePlan.id)
    .eq('user_id', user.id);

  if (deleteCardsErr) {
    console.error('Failed to delete old daily_cards:', deleteCardsErr);
    return;
  }
  console.log('Old daily cards deleted.');

  // 7. Seed new 21 daily cards
  console.log('Inserting 21 new daily cards...');
  const dailyCards = planData.daily_tasks.slice(0, 100).map((task: any) => ({
    user_id: user.id,
    plan_id: activePlan.id,
    day_number: task.day_number,
    task: task.task,
    duration: task.duration || '30 mins',
    chain_to_sprint: task.chain_to_sprint || '',
    chain_to_goal: task.chain_to_goal || '',
    status: 'pending',
  }));

  const { error: insertCardsErr } = await supabase
    .from('daily_cards')
    .insert(dailyCards);

  if (insertCardsErr) {
    console.error('Failed to insert new daily_cards:', insertCardsErr);
    return;
  }
  console.log('Successfully inserted new daily cards.');
  console.log('--- HEALING COMPLETED SUCCESSFULLY ---');
}

heal().catch(console.error);
