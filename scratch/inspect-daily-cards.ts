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
  const { data: cards, error } = await supabase.from('daily_cards').select('*');
  if (error) {
    console.error('Error fetching daily_cards:', error);
    return;
  }
  console.log(`Fetched daily_cards length: ${cards?.length || 0}`);
  if (cards && cards.length > 0) {
    console.log('First 5 cards:', cards.slice(0, 5));
  }
}

inspect().catch(console.error);
