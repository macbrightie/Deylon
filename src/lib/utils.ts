import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface TaskItem {
  action: string;
  example?: string;
  clue?: string;
}

export function parseTasks(taskText: string): TaskItem[] {
  if (!taskText) return [];
  const sentences = taskText
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 2);

  const items: TaskItem[] = [];
  for (const sentence of sentences) {
    const cleanLower = sentence.toLowerCase();
    const isExample = cleanLower.startsWith('example:') || sentence.startsWith('(Example:') || cleanLower.startsWith('(example:');
    const isClue = cleanLower.startsWith('clue:') || sentence.startsWith('(Clue:') || cleanLower.startsWith('(clue:') || cleanLower.startsWith('hint:') || sentence.startsWith('(Hint:') || cleanLower.startsWith('(hint:') || cleanLower.startsWith('strategy:') || sentence.startsWith('(Strategy:') || cleanLower.startsWith('(strategy:');

    if (isExample && items.length > 0) {
      items[items.length - 1].example = sentence;
    } else if (isClue && items.length > 0) {
      items[items.length - 1].clue = sentence;
    } else {
      items.push({ action: sentence });
    }
  }
  return items;
}

export function formatTaskForTelegram(taskText: string): string {
  if (!taskText) return '';
  const parsed = parseTasks(taskText);
  let formatted = '';
  for (const item of parsed) {
    let action = item.action.replace(/^(Study|Daily Reps|Strategy|Hint):\s*/i, '');
    formatted += `• ${action}\n`;
    if (item.example) {
      formatted += `   <i>${item.example}</i>\n`;
    }
    if (item.clue) {
      formatted += `   <i>${item.clue}</i>\n`;
    }
    formatted += `\n`;
  }
  return formatted.trim();
}
