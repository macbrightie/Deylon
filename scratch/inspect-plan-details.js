const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function run() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = createClient(url, serviceKey);

  console.log('\n--- Inspecting Plans and JSON Details ---');
  const { data: plans, error } = await supabase
    .from('plans')
    .select('*');

  if (error) {
    console.error('Error fetching plans:', error.message);
    return;
  }

  console.log(`Found ${plans.length} plan(s):`);
  plans.forEach(p => {
    console.log(`Plan ID: ${p.id}`);
    console.log(`User ID: ${p.user_id}`);
    console.log(`Start Date: ${p.start_date}`);
    console.log(`Created At: ${p.created_at}`);
    console.log(`Plan Data:`, JSON.stringify(p.plan_data, null, 2));
  });

  console.log('\n--- Inspecting Daily Cards ---');
  const { data: cards, error: cardError } = await supabase
    .from('daily_cards')
    .select('*');

  if (cardError) {
    console.error('Error fetching cards:', cardError.message);
  } else {
    console.log(`Found ${cards.length} card(s):`);
    cards.forEach(c => {
      console.log(`Card ID: ${c.id}`);
      console.log(`User ID: ${c.user_id}`);
      console.log(`Plan ID: ${c.plan_id}`);
      console.log(`Day Number: ${c.day_number}`);
      console.log(`Task: ${c.task}`);
      console.log(`Revealed At: ${c.revealed_at}`);
    });
  }
}

run().catch(console.error);
