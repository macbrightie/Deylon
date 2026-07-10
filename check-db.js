const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: plans, error } = await supabase.from('plans').select('*').limit(5);
  console.log('Plans:', plans);
  
  const { data: cards, error: cerr } = await supabase.from('daily_cards').select('*').eq('status', 'done').limit(5);
  console.log('Done cards:', cards);
}

main();
