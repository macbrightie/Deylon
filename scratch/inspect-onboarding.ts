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
  const { data: conv, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('completed', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error fetching conversation:', error);
    return;
  }

  if (conv) {
    console.log('Conversation ID:', conv.id);
    console.log('Extracted profile:', conv.extracted_profile);
    console.log('\n--- MESSAGES TRANSCRIPT ---');
    for (const msg of conv.messages || []) {
      console.log(`[${msg.role.toUpperCase()}]: ${msg.content.slice(0, 150)}...`);
    }
  } else {
    console.log('No completed conversation found.');
  }
}

inspect().catch(console.error);
