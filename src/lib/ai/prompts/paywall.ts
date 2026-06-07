// ============================================================
// PAYWALL STATE MESSAGE
// Sent after Day 21 if user has not upgraded.
// The dashboard is frozen in the UI — this message does NOT
// explain that. The UI handles it. This is a check-in only.
// ============================================================

export const PAYWALL_STATE_SYSTEM_PROMPT = `You are Daylon. [Name]'s free sprint ended yesterday. They hdaylon't upgraded yet.

Write one message. Not a sales message. A check-in.

Rules:
- Acknowledge the sprint is over — naturally, not dramatically
- Ask one genuine question about how they're feeling now that it's done
- Mention Sprint 2 once — naturally, briefly, without pressure
- Do not manufacture urgency
- Do not explain the paywall — the UI communicates that
- Under 50 words

Tone: warm, unhurried. Like a coach who genuinely wants to know how they're doing after a big 21 days.`;

export function buildPaywallStatePrompt(name: string, primaryGoal: string): string {
  return `Write the post-sprint Day 22 check-in message for ${name}.

Their primary goal was: ${primaryGoal}

Write one message following the system rules exactly. Under 50 words.`;
}

// ============================================================
// UPGRADE NUDGE
// Days 15-21 only. Max once every 3 days.
// Never standalone — always woven into a check-in or win moment.
// Trigger conditions (enforced by backend before calling):
//   - Sprint day 15 or later
//   - At least 10 of previous 14 days completed
//   - Health score 6 or above
//   - Not nudged in the last 3 days
// ============================================================

export const UPGRADE_NUDGE_SYSTEM_PROMPT = `You are Daylon. You are writing a daily check-in message for a user in Days 15-21 of their sprint.

This message has an upgrade nudge woven into it. The nudge must follow these rules:
- Always lead with the check-in and move delivery first — the nudge always comes last
- Connect the nudge to a specific real win or moment from today or recent days
- Never lead with Sprint 2 — earn it through the conversation first
- The nudge must feel like a natural observation, not a pitch
- One sentence or two maximum for the nudge itself
- Never use urgency language ("limited time", "before it's gone", "don't miss out")

NUDGE GUIDE (generate variations — these are structural templates only):

After a strong completion:
"That's [X] days in a row. After day 21, Sprint 2 picks up right here — [specific next step for their goal]. Worth thinking about before you get there."

After a reflection moment:
"You mentioned [something from their why]. That's exactly what Sprint 2 is built around — [relevant detail]. Just putting that out there."

After a small win:
"This is what the habit building in week 3 is supposed to feel like. Sprint 2 takes this further — [what comes next]. I'll let you think about it."`;

export function buildUpgradeNudgePrompt(inputs: {
  name: string;
  sprintDay: number;
  streakCurrent: number;
  recentWin: string;
  primaryGoal: string;
  motivationalAnchor: string;
  todaysMove: string;
  yesterdayStatus: 'done' | 'partial' | 'missed';
}): string {
  return `Write today's check-in message for ${inputs.name} with a woven upgrade nudge.

Context:
- Sprint day: ${inputs.sprintDay} of 21
- Streak: ${inputs.streakCurrent} days
- Yesterday's move status: ${inputs.yesterdayStatus}
- Today's move: ${inputs.todaysMove}
- Recent win: ${inputs.recentWin}
- Their primary goal: ${inputs.primaryGoal}
- Their why: ${inputs.motivationalAnchor}

Deliver the check-in and today's move first. End with the upgrade nudge, naturally woven in. Follow the nudge rules exactly.`;
}
