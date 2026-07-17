const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const userId = 'bc6d3a25-56f9-4013-a0a5-c50cee6ed82f';
  const { data: cards, error } = await supabase
    .from('daily_cards')
    .update({
      status: 'done',
      completed_at: new Date().toISOString(),
      checked_states: [true, true] // Day 1 has 2 tasks
    })
    .eq('user_id', userId)
    .eq('day_number', 1);

  if (error) {
    console.error('Error updating card:', error);
  } else {
    console.log('Successfully marked Day 1 as done in database.');
  }
}

main();
