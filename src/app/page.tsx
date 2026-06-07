import type { Metadata } from 'next';
import { Navbar } from '@/components/landing/Navbar';
import { Hero } from '@/components/landing/Hero';
import { ProblemSection } from '@/components/landing/ProblemSection';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { EmbeddedChat } from '@/components/landing/EmbeddedChat';
import { FounderSection } from '@/components/landing/FounderSection';
import { SiteFooter } from '@/components/landing/SiteFooter';

export const metadata: Metadata = {
  title: 'Daylon — Your AI Life Planner',
  description:
    'Daylon turns your biggest goals into a personalised, day-by-day action plan — powered by AI.',
};

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background selection:bg-[#104d3b]/10 selection:text-[#104d3b]">
      <Navbar />
      <Hero />
      <ProblemSection />
      <HowItWorks />
      <EmbeddedChat />
      <FounderSection />
      <SiteFooter />
    </main>
  );
}
