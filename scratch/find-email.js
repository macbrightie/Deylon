const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function run() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = createClient(url, serviceKey);

  console.log('Searching for okeyarmstrong16@gmail.com in public.users...');
  const { data: users, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', 'okeyarmstrong16@gmail.com');

  if (error) {
    console.error('Error querying public.users:', error.message);
  } else {
    console.log('public.users match:', users);
  }

  console.log('Searching for okeyarmstrong16@gmail.com in auth.users...');
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
  if (authError) {
    console.error('Error listing auth.users:', authError.message);
  } else {
    const match = authUsers.users.find(u => u.email === 'okeyarmstrong16@gmail.com');
    console.log('auth.users match:', match || 'NOT FOUND');
  }

  console.log('Searching for plans for okeyarmstrong16@gmail.com...');
  const { data: plans, error: plansError } = await supabase
    .from('plans')
    .select('*')
    .eq('user_id', '0c442782-e269-476b-aee3-6234c359cf1f');
  if (plansError) {
    console.error('Error querying plans:', plansError.message);
  } else {
    console.log('plans match count:', plans.length);
    plans.forEach(p => {
      console.log(`Plan ID: ${p.id}`);
      console.log(`Plan data:`, JSON.stringify(p.plan_data, null, 2));
    });
  }

  console.log('Searching for daily cards for okeyarmstrong16@gmail.com...');
  const { data: cards, error: cardsError } = await supabase
    .from('daily_cards')
    .select('*')
    .eq('user_id', '0c442782-e269-476b-aee3-6234c359cf1f')
    .order('day_number', { ascending: true });
  if (cardsError) {
    console.error('Error querying daily_cards:', cardsError.message);
  } else {
    console.log('daily_cards match count:', cards.length);
    cards.forEach(c => {
      console.log(`Day ${c.day_number}: ${c.task}`);
    });
  }
}

run().catch(console.error);
