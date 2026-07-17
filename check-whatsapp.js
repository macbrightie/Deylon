const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, display_name, telegram_chat_id, whatsapp_number, preferred_platform')
    .not('whatsapp_number', 'is', null);

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Users with WhatsApp:', JSON.stringify(data, null, 2));
  }
}

main();
