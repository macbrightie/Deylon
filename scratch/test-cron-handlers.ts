import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { sendMessage } from '../lib/telegram/bot';
import { formatUserGreeting } from '../lib/telegram/message';
import { getDayNumber } from '../lib/utils/date';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing env vars.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runTests() {
  console.log('=== Simulating Timezone-Aware Cron Workflows ===');

  // Fetch all users with a telegram_chat_id
  const { data: users, error } = await supabase
    .from('users')
    .select('id, email, display_name, telegram_chat_id, timezone, preferred_greeting, carry_over_count_this_week')
    .not('telegram_chat_id', 'is', null);

  if (error || !users || users.length === 0) {
    console.error('No users found with Telegram chat ID:', error);
    return;
  }

  const user = users[0];
  console.log(`Testing with user: ${user.email} (${user.id})`);
  console.log(`Timezone: ${user.timezone}`);
  
  // Calculate local time hour
  const userLocalTime = new Date(
    new Date().toLocaleString('en-US', { timeZone: user.timezone || 'Africa/Lagos' })
  );
  const currentHour = userLocalTime.getHours();
  console.log(`Current Local Hour for user: ${currentHour}`);

  // Fetch plan
  const { data: plan } = await supabase
    .from('plans')
    .select('id, created_at, start_date')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!plan) {
    console.error('No plan found for user.');
    return;
  }

  const dayNumber = getDayNumber(plan.start_date || new Date(plan.created_at), user.timezone || 'Africa/Lagos');
  console.log(`Calculated Day Number: ${dayNumber}`);

  if (dayNumber > 21) {
    console.log('Sprint already complete (Day number > 21).');
    return;
  }

  const greeting = formatUserGreeting(user.preferred_greeting, user.display_name, user.email);

  // 1. Morning Check Simulation
  console.log('\n--- [1] Morning Check Simulation ---');
  const { data: morningCard } = await supabase
    .from('daily_cards')
    .select('*')
    .eq('user_id', user.id)
    .eq('plan_id', plan.id)
    .eq('day_number', dayNumber)
    .eq('status', 'pending')
    .maybeSingle();

  if (morningCard) {
    const morningMsg = `🌅 <b>${greeting} (TEST)</b>\n\nHere's a quick reminder of your daily move today:\n\n📌 <b>${morningCard.task}</b>\n\n⏱ <i>${morningCard.duration || '30 mins'}</i>\n\nYou've got this! Let's get it done today.`;
    console.log('Generated Morning Msg:\n', morningMsg);
    console.log('Sending test message...');
    await sendMessage(user.telegram_chat_id!, morningMsg);
    console.log('✅ Morning test message sent!');
  } else {
    console.log('No pending daily card found for morning check (card might be completed/adjusted).');
  }

  // 2. Afternoon Check Simulation
  console.log('\n--- [2] Afternoon Check Simulation ---');
  const { data: afternoonCard } = await supabase
    .from('daily_cards')
    .select('*')
    .eq('user_id', user.id)
    .eq('plan_id', plan.id)
    .eq('day_number', dayNumber)
    .maybeSingle();

  if (afternoonCard) {
    if (afternoonCard.status === 'done') {
      const afternoonMsg = `🌟 <b>${greeting} (TEST)</b>\n\nI saw you checked off all tasks for today! Spectacular progress. Enjoy your evening!`;
      console.log('Generated Afternoon Msg (Done):\n', afternoonMsg);
      console.log('Sending test message...');
      await sendMessage(user.telegram_chat_id!, afternoonMsg);
      console.log('✅ Afternoon done test message sent!');
    } else if (afternoonCard.status === 'pending') {
      const sentences = afternoonCard.task
        ? afternoonCard.task
            .split(/(?<=[.!?])\s+/)
            .map((s: string) => s.trim())
            .filter((s: string) => s.length > 2)
        : [];
      const tasksList = sentences.map((s: string) => `⬜️ ${s}`).join('\n');
      const afternoonMsg = `👋 <b>${greeting} (TEST)</b>\n\nHow's your move going today? Here's what's on your list:\n\n${tasksList}\n\nRemember to check them off on the dashboard once completed! Tell me: how much time did you spend on this today?`;
      console.log('Generated Afternoon Msg (Pending):\n', afternoonMsg);
      console.log('Sending test message...');
      await sendMessage(user.telegram_chat_id!, afternoonMsg);
      console.log('✅ Afternoon pending test message sent!');
    }
  }

  // 3. Evening Delivery Simulation
  console.log('\n--- [3] Evening Delivery Simulation ---');
  const { data: eveningCard } = await supabase
    .from('daily_cards')
    .select('*')
    .eq('user_id', user.id)
    .eq('plan_id', plan.id)
    .eq('day_number', dayNumber)
    .maybeSingle();

  if (eveningCard) {
    if (eveningCard.status !== 'pending') {
      const nextDayNumber = dayNumber + 1;
      if (nextDayNumber > 21) {
        const finishedMsg = `🎉 <b>${greeting} (TEST)</b>\n\nYou have completed all daily cards for this sprint! Sensational job. Rest well.`;
        console.log('Generated Evening Msg (Sprint complete):\n', finishedMsg);
      } else {
        const { data: tomorrowCard } = await supabase
          .from('daily_cards')
          .select('*')
          .eq('user_id', user.id)
          .eq('plan_id', plan.id)
          .eq('day_number', nextDayNumber)
          .maybeSingle();

        if (tomorrowCard) {
          let bubbles = (tomorrowCard.social_chat_messages as string[]) || [];
          if (!Array.isArray(bubbles) || bubbles.length === 0) {
            bubbles = [
              `🌅 <b>Tomorrow's Move — Day ${nextDayNumber} (TEST)</b>`,
              `📌 <b>Task:</b> ${tomorrowCard.task}\n\n⏱ <i>Duration: ${tomorrowCard.duration || '30 mins'}</i>`,
            ];
          }
          bubbles[0] = `✨ <b>${greeting} (TEST)</b>\n\n${bubbles[0]}`;
          console.log('Generated Evening Msg (Tomorrow\'s delivery):\n', bubbles.join('\n\n'));
          console.log('Sending test message...');
          for (let i = 0; i < bubbles.length; i++) {
            await sendMessage(user.telegram_chat_id!, bubbles[i]);
          }
          console.log('✅ Evening test message sent!');
        }
      }
    } else {
      // Pending
      const carryOverCount = user.carry_over_count_this_week ?? 0;
      if (carryOverCount < 1) {
        const carryOverPrompt = `👀 <b>${greeting} (TEST)</b>\n\nIt looks like today's task is still pending on your dashboard.\n\nWould you like to carry it over to tomorrow? (You can only do this once per week).\n\nReply with <b>"carry over"</b> to confirm, or <b>"no"</b> if you'll finish it tonight!`;
        console.log('Generated Evening Msg (Carry over prompt):\n', carryOverPrompt);
        console.log('Sending test message...');
        await sendMessage(user.telegram_chat_id!, carryOverPrompt);
        console.log('✅ Evening test message sent!');
      } else {
        const cannotCarryMsg = `👀 <b>${greeting} (TEST)</b>\n\nIt looks like today's task is still pending, and you've already used your weekly carry-over limit.\n\nTry to finish it tonight! Here is tomorrow's task to keep you prepared:`;
        console.log('Generated Evening Msg (No carry over left):\n', cannotCarryMsg);
      }
    }
  }

  console.log('\n=== Simulation Complete ===');
}

runTests().catch(console.error);
