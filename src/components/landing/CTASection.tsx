import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export function CTASection() {
  return (
    <section className="py-24 px-8 max-w-7xl mx-auto w-full">
      <div className="bg-[#1a1a1a] rounded-[2.5rem] p-12 md:p-24 text-center space-y-10 overflow-hidden relative">
        {/* Subtle decorative elements */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-[999px] -translate-x-1/2 -translate-y-1/2 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-[#104d3b]/20 rounded-[999px] translate-x-1/2 translate-y-1/2 blur-3xl" />

        <div className="relative z-10 space-y-6 max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-serif text-white leading-tight">
            Ready to see how your life could be different?
          </h2>
          <p className="text-white/60 text-lg md:text-xl font-sans">
            Join the hundreds of people who are already building a clearer, more intentional path with Daylon.
          </p>
        </div>

        <div className="relative z-10 flex flex-col items-center gap-6 pt-4">
          <Link href="/start">
            <Button 
              variant="primary" 
              size="lg" 
              className="rounded-[999px] px-12 py-4 text-base font-medium bg-white text-black hover:bg-white/90 shadow-2xl shadow-white/10"
            >
              Start my plan
            </Button>
          </Link>
          <p className="text-white/40 text-sm font-medium">
            No credit card required. Free to start.
          </p>
        </div>
      </div>
    </section>
  );
}
