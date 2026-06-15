const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function run() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = createClient(url, serviceKey);

  console.log('\n--- Checking all users in DB ---');
  const { data: users, error } = await supabase
    .from('users')
    .select('*');

  if (error) {
    console.error('Error fetching users:', error.message);
    return;
  }

  console.log(`Total users found: ${users.length}`);
  users.forEach(u => {
    console.log(`User ID: ${u.id}`);
    console.log(` - Email: ${u.email}`);
    console.log(` - Display Name: ${u.display_name}`);
    console.log(` - Telegram Chat ID: ${u.telegram_chat_id}`);
    console.log(` - Telegram Linking State: ${u.telegram_linking_state}`);
    console.log(` - Timezone: ${u.timezone}`);
  });
}

run().catch(console.error);
