export interface DailyReminderData {
  userName?: string;
  dayNumber: number;
  task: string;
  duration: string;
  chainToGoal: string;
  appUrl: string;
  sprintTheme?: string;
}

export interface WelcomeMessageData {
  userName?: string;
  primaryGoal: string;
  appUrl: string;
}

export function formatUserGreeting(preferredGreeting?: string | null, displayName?: string | null, email?: string | null): string {
  if (preferredGreeting && preferredGreeting.trim()) {
    const trimmed = preferredGreeting.trim();
    if (/^(greetings|hey|hi|yo|hello|dear|bonjour|salut)\b/i.test(trimmed)) {
      return trimmed;
    }
    return `Hey ${trimmed}`;
  }

  if (displayName && displayName.trim()) {
    return `Hey ${displayName.trim()}`;
  }

  if (email) {
    const prefix = email.split('@')[0];
    return `Hey ${prefix}`;
  }

  return 'Hey';
}

export function buildDailyReminder(data: DailyReminderData): string {
  const name = data.userName ? `Hey ${data.userName}` : 'Hey';
  const themeText = data.sprintTheme ? `: ${data.sprintTheme}` : '';
  return [
    `🌅 <b>${name} — Day ${data.dayNumber} of your 21-day sprint${themeText}</b>`,
    ``,
    `📌 <b>Today's task:</b>`,
    `${data.task}`,
    ``,
    `🎯 <i>Towards: ${data.chainToGoal}</i>`,
    ``,
    `<a href="${data.appUrl}/dashboard">→ Open Deylon dashboard</a>`,
  ].join('\n');
}

export function buildWelcomeMessage(data: WelcomeMessageData): string {
  const name = data.userName ? `, ${data.userName}` : '';
  return [
    `✅ <b>You're connected${name}!</b>`,
    ``,
    `Deylon will send your daily task reminders here, starting tomorrow morning.`,
    ``,
    `🎯 <b>Your goal:</b> ${data.primaryGoal}`,
    ``,
    `<a href="${data.appUrl}/dashboard">→ Open your dashboard</a>`,
  ].join('\n');
}

export function buildGraceMessage(dayNumber: number, task: string): string {
  return [
    `🟡 <b>Grace day reminder — Day ${dayNumber}</b>`,
    ``,
    `You marked yesterday as a grace day. Today's a new chance.`,
    ``,
    `📌 ${task}`,
    ``,
    `Every day counts. You've got this.`,
  ].join('\n');
}

export async function appendToConversationHistory(
  supabase: any,
  userId: string,
  role: 'assistant' | 'user',
  content: string
): Promise<void> {
  // Strip HTML tags from the content since conversation history is text/markdown for LLM context
  const cleanContent = content.replace(/<\/?[^>]+(>|$)/g, "");

  // Fetch the non-completed conversation
  let { data: conversation, error: fetchErr } = await supabase
    .from('conversations')
    .select('*')
    .eq('user_id', userId)
    .eq('completed', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (fetchErr) {
    console.error('[appendToConversationHistory] Error fetching conversation:', fetchErr);
    return;
  }

  if (!conversation) {
    // Fetch completed onboarding conversation to copy the extracted profile
    const { data: onboardingConv } = await supabase
      .from('conversations')
      .select('extracted_profile')
      .eq('user_id', userId)
      .eq('completed', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: newConv, error: insertErr } = await supabase
      .from('conversations')
      .insert({
        user_id: userId,
        messages: [],
        extracted_profile: onboardingConv?.extracted_profile || null
      })
      .select()
      .single();

    if (insertErr || !newConv) {
      console.error('[appendToConversationHistory] Error creating conversation:', insertErr);
      return;
    }
    conversation = newConv;
  }

  if (conversation) {
    const updatedMessages = [
      ...(conversation.messages || []),
      { role, content: cleanContent }
    ];
    const { error: updateErr } = await supabase
      .from('conversations')
      .update({ messages: updatedMessages })
      .eq('id', conversation.id);

    if (updateErr) {
      console.error('[appendToConversationHistory] Error updating messages:', updateErr);
    }
  }
}

