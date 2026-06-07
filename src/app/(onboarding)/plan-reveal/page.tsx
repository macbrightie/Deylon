import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Your life plan — Daylon',
  description: 'Your personalised Daylon life plan is ready.',
};

/**
 * Plan reveal screen shown during onboarding (route: /plan-reveal).
 * This is distinct from the authenticated /plan dashboard view.
 */
export default function PlanRevealPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold text-foreground mb-4">
          Your plan is ready
        </h1>
        <p className="text-muted-foreground mb-12">
          Here&apos;s your personalised roadmap. Let&apos;s walk through it
          together.
        </p>
        {/* PlanReveal component will be mounted here */}
      </div>
    </main>
  );
}
