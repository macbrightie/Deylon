export interface DailyReminderData {
  userName?: string;
  dayNumber: number;
  task: string;
  duration: string;
  chainToGoal: string;
  appUrl: string;
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
  return [
    `🌅 <b>${name} — Day ${data.dayNumber} of your 100-day challenge</b>`,
    ``,
    `📌 <b>Today's task:</b>`,
    `${data.task}`,
    ``,
    `⏱ <i>${data.duration}</i>`,
    `🎯 <i>Towards: ${data.chainToGoal}</i>`,
    ``,
    `<a href="${data.appUrl}/dashboard">→ Open Daylon dashboard</a>`,
  ].join('\n');
}

export function buildWelcomeMessage(data: WelcomeMessageData): string {
  const name = data.userName ? `, ${data.userName}` : '';
  return [
    `✅ <b>You're connected${name}!</b>`,
    ``,
    `Daylon will send your daily task reminders here, starting tomorrow morning.`,
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
