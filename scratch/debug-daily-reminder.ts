import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { sendMessage } from '../lib/telegram/bot';
import {
  buildDailyReminder,
  buildGraceMessage,
} from '../lib/telegram/message';
import { getDayNumber, getTodayISO } from '../lib/utils/date';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing env vars.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  console.log('--- Debugging daily-reminder ---');
  
  // Fetch all users with a telegram_chat_id
  const { data: users, error } = await supabase
    .from('users')
    .select('id, email, telegram_chat_id, timezone')
    .not('telegram_chat_id', 'is', null);

  if (error) {
    console.error('Failed to fetch users:', error);
    return;
  }

  console.log(`Found ${users?.length || 0} users with telegram_chat_id:`);
  console.log(users);

  for (const user of (users ?? [])) {
    console.log(`\nProcessing user: ${user.email} (${user.id})`);
    
    // Get latest plan
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('id, created_at, start_date')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (planError) {
      console.error(`Error fetching plan for user ${user.id}:`, planError);
      continue;
    }

    if (!plan) {
      console.log(`No plan found for user ${user.id}`);
      continue;
    }

    console.log(`Found plan: id=${plan.id}, start_date=${plan.start_date}, created_at=${plan.created_at}`);

    const dayNumber = getDayNumber(
      plan.start_date || new Date(plan.created_at),
      user.timezone
    );

    console.log(`Calculated dayNumber: ${dayNumber}`);

    if (dayNumber > 100) {
      console.log(`dayNumber (${dayNumber}) > 100, skipping.`);
      continue;
    }

    // Get today's card
    const { data: card, error: cardError } = await supabase
      .from('daily_cards')
      .select('*')
      .eq('user_id', user.id)
      .eq('plan_id', plan.id)
      .eq('day_number', dayNumber)
      .single();

    if (cardError) {
      console.error(`Error fetching daily card for day ${dayNumber}:`, cardError);
      continue;
    }

    if (!card) {
      console.log(`No daily card found for day ${dayNumber}`);
      continue;
    }

    console.log(`Found daily card: id=${card.id}, task=${card.task.substring(0, 40)}...`);

    // Check yesterday's status for grace day logic
    const { data: yesterday, error: yesterdayError } = await supabase
      .from('sprint_progress')
      .select('status')
      .eq('user_id', user.id)
      .eq('day_number', dayNumber - 1)
      .single();

    if (yesterdayError) {
      console.log(`Error/Notice fetching yesterday's progress (normal if not exists):`, yesterdayError.message);
    } else {
      console.log(`Yesterday's status:`, yesterday);
    }

    let messageText: string;

    if (yesterday?.status === 'grace') {
      messageText = buildGraceMessage(dayNumber, card.task);
      console.log(`Using Grace Message.`);
    } else {
      messageText = buildDailyReminder({
        dayNumber,
        task: card.task,
        duration: card.duration ?? '30 minutes',
        chainToGoal: card.chain_to_goal ?? 'your goal',
        appUrl: process.env.NEXT_PUBLIC_APP_URL!,
      });
      console.log(`Using Standard Daily Reminder.`);
    }

    console.log('Generated Message:\n', messageText);

    try {
      console.log(`Sending message to chat ID ${user.telegram_chat_id}...`);
      const res = await sendMessage(user.telegram_chat_id!, messageText);
      console.log(`✅ Message sent! Message ID: ${res.message_id}`);

      // Mark card as revealed (simulated)
      const todayISO = getTodayISO(user.timezone);
      console.log(`Would mark card as revealed at: ${todayISO}`);
    } catch (sendErr) {
      console.error(`❌ Failed to send Telegram message:`, sendErr);
    }
  }
}

run().catch(console.error);
