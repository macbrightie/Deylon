// Onboarding component stubs
// These will be implemented in the UI phase

'use client';

import type { PlanData } from '@/types/plan';

export function PlanReveal({ plan }: { plan: PlanData }) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">{plan.primary_goal}</h2>
      <p className="text-muted-foreground">{plan.summary}</p>
    </div>
  );
}

export function ChallengeGrid({ totalDays = 100 }: { totalDays?: number }) {
  return (
    <div className="grid grid-cols-10 gap-2">
      {Array.from({ length: totalDays }, (_, i) => (
        <div
          key={i}
          className="aspect-square rounded-[999px] bg-muted flex items-center justify-center text-xs text-muted-foreground"
        >
          {i + 1}
        </div>
      ))}
    </div>
  );
}

export function TelegramConnect({ userId }: { userId: string }) {
  const token = Buffer.from(userId).toString('base64url');
  const botUsername = 'DaylonBot'; // Replace with actual bot username
  const deepLink = `https://t.me/${botUsername}?start=${token}`;

  return (
    <a
      href={deepLink}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-3 px-8 py-4 rounded-[999px] bg-[#2AABEE] text-white font-semibold text-lg hover:opacity-90 transition"
    >
      <span>Open Telegram</span>
    </a>
  );
}
