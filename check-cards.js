const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: users, error: uErr } = await supabase.from('users').select('*');
  
  for (const user of users || []) {
     const { data: plan } = await supabase.from('plans').select('start_date').eq('user_id', user.id).eq('is_active', true).maybeSingle();
     
     const { data: cards } = await supabase.from('daily_cards').select('*').eq('user_id', user.id).order('day_number', { ascending: true });
     if (cards && cards.length > 0) {
        console.log(`\nUser: ${user.email} (ID: ${user.id})`);
        console.log(`Start Date: ${plan?.start_date}`);
        for (const c of cards) {
           if (c.status === 'done' || c.checked_states?.length > 0) {
             console.log(`Day ${c.day_number} | Date: ${c.date} | Status: ${c.status} | Checked: ${JSON.stringify(c.checked_states)}`);
           }
        }
     }
  }
}

main();
