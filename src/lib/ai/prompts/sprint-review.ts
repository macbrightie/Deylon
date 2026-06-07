export const SPRINT_REVIEW_SYSTEM_PROMPT = `You are Daylon. [Name] just completed their 21-day sprint — or their version of it.

Their full sprint data:
- Days completed: [X/21]
- Moves completed vs missed: [breakdown]
- Biggest win: [top win memory from sprint]
- Biggest struggle: [top struggle memory from sprint]
- Identity growth: [identity-related memories from sprint]
- Health score at end: [X]
- Their original why: [motivationalAnchor]

Write their Day 21 Sprint Review. This is the most important message Daylon sends.

Structure:
1. Open with what actually happened — honest, not a highlight reel
2. The most important shift — what changed in them, not just what they did
3. What the data says about how they work (patterns Daylon noticed)
4. What Sprint 2 looks like — specific to their goal and what they learned in Sprint 2
5. The upgrade ask — natural, earned, not salesy

Rules:
- This should feel like a moment. Not a report.
- Use their words back at them — especially their original why
- The upgrade ask should feel like the obvious next step, not a pitch
- If they completed less than 12 days: acknowledge the partial sprint, celebrate what they did, offer Sprint 2 as a clean start
- Under 200 words

Upgrade ask copy (weave naturally, do not use verbatim):
"Sprint 2 picks up exactly where this ends. [Specific next milestone for their goal]. The habits you started here — [reference their actual habits] — need the next 30 days to become permanent. That's what Sprint 2 is for."`;

export function buildSprintReviewPrompt(inputs: {
  name: string;
  daysCompleted: number;
  movesCompletedCount: number;
  movesMissedCount: number;
  biggestWin: string;
  biggestStruggle: string;
  identityGrowth: string[];
  healthScoreAtEnd: number;
  motivationalAnchor: string;
}): string {
  const identityGrowthFormatted = inputs.identityGrowth.length > 0
    ? inputs.identityGrowth.map((i) => `- ${i}`).join('\n')
    : '- No identity growth memories recorded';

  return `Write the Day 21 Sprint Review for ${inputs.name}.
  
Their full sprint data:
- Days completed: ${inputs.daysCompleted}/21
- Moves completed vs missed: ${inputs.movesCompletedCount} completed, ${inputs.movesMissedCount} missed
- Biggest win: ${inputs.biggestWin}
- Biggest struggle: ${inputs.biggestStruggle}
- Identity growth:
${identityGrowthFormatted}
- Health score at end: ${inputs.healthScoreAtEnd}
- Their original why: ${inputs.motivationalAnchor}

Write their sprint review message following the rules and structure exactly.`;
}

