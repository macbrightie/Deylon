import Link from 'next/link';
import { CheckCircle2, Sparkles, MessageSquare, Target } from 'lucide-react';

export default function ProSuccessPage() {
  return (
    <div className="min-h-screen bg-[#0E0E10] text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full animate-in fade-in zoom-in duration-500">
        <div className="bg-[#1E1E22] border border-white/10 rounded-[24px] p-8 text-center shadow-2xl relative overflow-hidden">
          {/* Background Glow */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-[#1559EF] rounded-full blur-[100px] opacity-20 pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-500 rounded-full blur-[100px] opacity-10 pointer-events-none" />

          {/* Success Icon */}
          <div className="w-20 h-20 mx-auto bg-green-500/10 rounded-full flex items-center justify-center mb-6 relative z-10">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>

          <h1 className="text-3xl font-sans font-bold text-white mb-2 relative z-10">
            Welcome to Pro
          </h1>
          <p className="text-white/60 font-sans text-[15px] mb-8 relative z-10">
            Your payment was successful. Deylon's advanced coaching engine is now fully unlocked for you.
          </p>

          <div className="bg-white/5 border border-white/10 rounded-[16px] p-5 text-left mb-8 relative z-10">
            <h3 className="font-sans font-semibold text-white mb-4 text-[14px] uppercase tracking-wider">
              What you just unlocked
            </h3>
            
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Target className="w-5 h-5 text-[#1559EF] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-[14px] font-medium text-white">21-Day Sprint & Beyond</h4>
                  <p className="text-[13px] text-white/50 mt-0.5">Full access to the complete 21-day program and ongoing continuous support.</p>
                </div>
              </li>
              
              <li className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-[14px] font-medium text-white">Top Tier Frameworks</h4>
                  <p className="text-[13px] text-white/50 mt-0.5">Advanced behavioral psychology and world-class habit frameworks applied to your specific goal.</p>
                </div>
              </li>
              
              <li className="flex items-start gap-3">
                <MessageSquare className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-[14px] font-medium text-white">Proactive AI Coaching on WhatsApp</h4>
                  <p className="text-[13px] text-white/50 mt-0.5">Highly personalized check-ins and strategy sessions directly on WhatsApp.</p>
                </div>
              </li>
            </ul>
          </div>

          <Link
            href="/dashboard"
            className="block w-full py-4 bg-[#1559EF] hover:bg-[#3b7aff] text-white rounded-[14px] font-sans font-semibold text-center transition-all text-[15px] shadow-[0_4px_14px_0_rgba(21,89,239,0.39)] relative z-10"
          >
            Enter your Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
