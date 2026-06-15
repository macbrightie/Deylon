const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function run() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = createClient(url, serviceKey);

  console.log('\n--- Full User Data ---');
  const { data: users, error } = await supabase
    .from('users')
    .select('id, email, display_name, telegram_chat_id, timezone, preferred_greeting');
  
  if (error) {
    console.error('Error fetching users:', error.message);
  } else {
    users.forEach(u => {
      console.log(`User: ${u.email}`);
      console.log(` - ID: ${u.id}`);
      console.log(` - Name: ${u.display_name}`);
      console.log(` - Telegram ID: ${u.telegram_chat_id}`);
      console.log(` - Timezone: ${u.timezone}`);
      console.log(` - Greeting: ${u.preferred_greeting}`);
    });
  }

  console.log('\n--- Daily Cards and Reveal status ---');
  const { data: cards, error: cardError } = await supabase
    .from('daily_cards')
    .select('id, user_id, day_number, task, status, revealed_at')
    .limit(10);

  if (cardError) {
    console.error('Error fetching cards:', cardError.message);
  } else {
    cards.forEach(c => {
      console.log(`Card: Day ${c.day_number} for User ${c.user_id}`);
      console.log(` - Task: ${c.task.substring(0, 50)}`);
      console.log(` - Status: ${c.status}`);
      console.log(` - Revealed At: ${c.revealed_at}`);
      console.log(` - Created At: ${c.created_at}`);
    });
  }

  console.log('\n--- Plans ---');
  const { data: plans, error: plansError } = await supabase
    .from('plans')
    .select('id, user_id, start_date, created_at, plan_data');
  if (plansError) {
    console.error('Error fetching plans:', plansError.message);
  } else {
    plans.forEach(p => {
      console.log(`Plan: ID=${p.id}, User=${p.user_id}`);
      console.log(` - Start Date: ${p.start_date}`);
      console.log(` - Created At: ${p.created_at}`);
      console.log(` - Timeline Goal: ${p.plan_data?.timelineGoal}`);
    });
  }

  console.log('\n--- Sprint Progress ---');
  const { data: progress, error: progressError } = await supabase
    .from('sprint_progress')
    .select('*');
  if (progressError) {
    console.error('Error fetching progress:', progressError.message);
  } else {
    console.log(`Found ${progress.length} progress row(s):`);
    progress.forEach(p => {
      console.log(` - User=${p.user_id}, Day=${p.day_number}, Status=${p.status}, Date=${p.date}`);
    });
  }
}

run().catch(console.error);
