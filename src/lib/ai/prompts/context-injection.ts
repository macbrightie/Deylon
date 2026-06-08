// ============================================================
// CONTEXT INJECTION TEMPLATE
// Assembled by the backend before every Gemini/AI call.
// This builder creates the USER CONTEXT block that is prepended
// to all active chat system prompts.
// ============================================================

export interface ContextInjectionInputs {
  name: string;
  currentDate: string;
  sprintDay: number;
  streakCurrent: number;
  healthScore: number; // internal only — never revealed to user
  tonePreference: 'casual' | 'warm' | 'direct' | 'reflective';
  summaryUpdate: string; // 2-sentence user summary from last extraction

  yesterdayMove: string;
  yesterdayStatus: 'done' | 'partial' | 'missed' | 'none';
  todayMove: string;
  todayMoveDuration: string;
  weeklyMovesCompleted: number; // e.g. 4 (out of 7)

  coreMemories: string[]; // importance 4-5, max 5 items
  relevantMemories?: string[]; // importance 2-3, context-matched, max 3 items
  lastThreeMessages: Array<{ role: 'user' | 'deylon'; content: string }>;
}

/**
 * Builds the USER CONTEXT block injected before every Gemini call.
 * Prepend this to the active system prompt with the `---` divider.
 */
export function buildContextInjection(inputs: ContextInjectionInputs): string {
  const coreMemoriesFormatted = inputs.coreMemories
    .slice(0, 5)
    .map((m) => `- ${m}`)
    .join('\n');

  const relevantMemoriesFormatted =
    inputs.relevantMemories && inputs.relevantMemories.length > 0
      ? inputs.relevantMemories
          .slice(0, 3)
          .map((m) => `- ${m}`)
          .join('\n')
      : '- None contextually relevant today';

  const lastMessagesFormatted = inputs.lastThreeMessages
    .map((m) => `${m.role === 'deylon' ? 'Deylon' : 'User'}: ${m.content}`)
    .join('\n');

  return `---
USER CONTEXT:
Name: ${inputs.name}
Today's date: ${inputs.currentDate}
Sprint day: ${inputs.sprintDay} of 21
Streak: ${inputs.streakCurrent} days
Health score: ${inputs.healthScore} (internal — never mention to user)
Tone preference: ${inputs.tonePreference}
Summary: ${inputs.summaryUpdate}

TODAY:
Yesterday's move: ${inputs.yesterdayMove} | Status: ${inputs.yesterdayStatus}
Today's move: ${inputs.todayMove} | Duration: ${inputs.todayMoveDuration}
Weekly moves completed: ${inputs.weeklyMovesCompleted}/7

CORE MEMORIES (importance 4-5):
${coreMemoriesFormatted}

RELEVANT MEMORIES (context-matched):
${relevantMemoriesFormatted}

LAST 3 MESSAGES:
${lastMessagesFormatted}
---`;
}
