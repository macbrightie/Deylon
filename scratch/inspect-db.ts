import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing env vars. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspect() {
  console.log('--- DATABASE INSPECTOR ---');
  
  // 1. Check users in public.users table
  const { data: users, error: usersErr } = await supabase.from('users').select('*');
  if (usersErr) {
    console.error('Error fetching users:', usersErr);
  } else {
    console.log(`\nUsers count: ${users?.length || 0}`);
    console.log(users);
  }

  // 1b. Check auth.users metadata
  const { data: authUsers, error: authUsersErr } = await supabase.auth.admin.listUsers();
  if (authUsersErr) {
    console.error('Error listing auth users:', authUsersErr);
  } else {
    console.log(`\nAuth Users count: ${authUsers?.users?.length || 0}`);
    console.log(authUsers?.users.map(u => ({
      id: u.id,
      email: u.email,
      user_metadata: u.user_metadata
    })));
  }

  // 2. Check conversations
  const { data: conversations, error: convsErr } = await supabase.from('conversations').select('*');
  if (convsErr) {
    console.error('Error fetching conversations:', convsErr);
  } else {
    console.log(`\nConversations count: ${conversations?.length || 0}`);
    console.log(conversations?.map(c => ({
      id: c.id,
      user_id: c.user_id,
      completed: c.completed,
      messages_count: c.messages?.length || 0
    })));
  }

  // 3. Check plans
  const { data: plans, error: plansErr } = await supabase.from('plans').select('*');
  if (plansErr) {
    console.error('Error fetching plans:', plansErr);
  } else {
    console.log(`\nPlans count: ${plans?.length || 0}`);
    console.log(plans?.map(p => ({
      id: p.id,
      user_id: p.user_id,
      primary_goal: p.primary_goal,
      timeline_years: p.timeline_years
    })));
  }

  // 4. Check daily_cards
  const { data: dailyCards, error: cardsErr } = await supabase.from('daily_cards').select('count', { count: 'exact', head: true });
  if (cardsErr) {
    console.error('Error fetching daily_cards count:', cardsErr);
  } else {
    console.log(`\nTotal Daily Cards count: ${dailyCards?.[0]?.count || 0}`);
  }
}

inspect().catch(console.error);

