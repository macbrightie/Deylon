import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing env vars.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspect() {
  const { data: plans, error } = await supabase.from('plans').select('*');
  if (error) {
    console.error('Error fetching plans:', error);
    return;
  }
  for (const plan of (plans || [])) {
    console.log(`Plan ID: ${plan.id}`);
    console.log(`User ID: ${plan.user_id}`);
    console.log(`Primary Goal: ${plan.primary_goal}`);
    console.log('Plan data keys:', Object.keys(plan.plan_data || {}));
    if (plan.plan_data) {
      console.log('sprint_theme:', plan.plan_data.sprint_theme);
      console.log('daily_tasks count:', plan.plan_data.daily_tasks?.length);
      if (plan.plan_data.daily_tasks) {
        console.log('First 3 daily tasks:', plan.plan_data.daily_tasks.slice(0, 3));
      }
    }
  }
}

inspect().catch(console.error);
