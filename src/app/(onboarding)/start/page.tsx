import type { Metadata } from 'next';
import Link from 'next/link';
import { Conversation } from '@/components/onboarding/Conversation';

export const metadata: Metadata = {
  title: 'Start your journey — Daylon',
  description: 'Tell Daylon about yourself to get your personalised life plan.',
};

export default function StartPage() {
  return (
    <main className="min-h-screen flex flex-col items-center bg-background px-6 pt-12 pb-24">
      <div className="w-full max-w-3xl">
        {/* Branding */}
        <div className="flex justify-center mb-12">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-5 h-5 bg-[#104d3b] rounded-[999px]" />
            <span className="font-sans font-bold text-2xl tracking-tight text-[#1a1a1a]">daylon</span>
          </Link>
        </div>

        <div className="space-y-6 text-center mb-12">
          <h1 className="text-[40px] md:text-[48px] font-sans font-medium text-[#1a1a1a] leading-tight">
            Let&apos;s build your plan
          </h1>
          <p className="text-[18px] text-foreground/60 font-sans max-w-lg mx-auto">
            Answer a few questions and Daylon will create your personalised life
            plan in minutes.
          </p>
        </div>

        {/* Conversation UI */}
        <Conversation />
      </div>
    </main>
  );
}
