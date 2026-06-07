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

async function checkColumns() {
  const { data, error } = await supabase
    .from('plans')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error fetching plan:', error);
  } else {
    console.log('Fetched plan row keys:', data && data.length > 0 ? Object.keys(data[0]) : 'no data');
  }
}

checkColumns().catch(console.error);
