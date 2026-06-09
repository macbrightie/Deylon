/**
 * Returns the current date in a given IANA timezone.
 */
export function getTodayInTimezone(timezone: string): Date {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const [year, month, day] = formatter.format(now).split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Returns a locale-aware date string, e.g. "Monday, 29 April 2026"
 */
export function formatDate(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

/**
 * Calculates how many days have elapsed since the plan start date.
 * Returns 1-indexed day number (day 1 = plan start day).
 */
export function getDayNumber(planStartDate: Date | string, timezone: string): number {
  const today = getTodayInTimezone(timezone);
  let start: Date;
  if (typeof planStartDate === 'string') {
    const [year, month, day] = planStartDate.split('-').map(Number);
    start = new Date(year, month - 1, day);
  } else {
    start = new Date(
      planStartDate.getFullYear(),
      planStartDate.getMonth(),
      planStartDate.getDate()
    );
  }
  const diffMs = today.getTime() - start.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays + 1);
}

/**
 * Returns an ISO date string (YYYY-MM-DD) for tomorrow in a given timezone.
 */
export function getTomorrowISO(timezone: string): string {
  const today = getTodayInTimezone(timezone);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const year = tomorrow.getFullYear();
  const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const day = String(tomorrow.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns true if the given ISO date string is today in the specified timezone.
 */
export function isToday(dateString: string, timezone: string): boolean {
  const today = getTodayInTimezone(timezone);
  const date = new Date(dateString);
  const dateTz = new Date(
    date.toLocaleString('en-CA', { timeZone: timezone })
  );
  return (
    today.getFullYear() === dateTz.getFullYear() &&
    today.getMonth() === dateTz.getMonth() &&
    today.getDate() === dateTz.getDate()
  );
}

/**
 * Returns an ISO date string (YYYY-MM-DD) for today in a given timezone.
 */
export function getTodayISO(timezone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

/**
 * Returns a timezone-aware formatted time string (e.g. "9:46 PM")
 */
export function formatTime(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}
