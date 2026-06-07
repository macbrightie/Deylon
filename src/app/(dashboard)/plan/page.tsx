import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Your plan — Daylon',
  description: 'View your full Daylon life plan and connection map.',
};

export default function PlanPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-foreground mb-8">
          Your life plan
        </h1>
        {/* PlanMap component will be mounted here */}
      </div>
    </main>
  );
}
