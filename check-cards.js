const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const userId = 'bc6d3a25-56f9-4013-a0a5-c50cee6ed82f';
  
  // Get active plan
  const { data: plans, error: planErr } = await supabase
    .from('plans')
    .select('id, start_date, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
    
  console.log('Plans:', plans);
  if (plans && plans.length > 0) {
    const planId = plans[0].id;
    const { data: cards, error: cardsErr } = await supabase
      .from('daily_cards')
      .select('id, day_number, task, status, completed_at, revealed_at')
      .eq('user_id', userId)
      .eq('plan_id', planId)
      .order('day_number', { ascending: true });
      
    console.log('Daily Cards for active plan:', cards);
  }
}

main();
