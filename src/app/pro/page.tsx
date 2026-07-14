'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// ─── Pricing data per region ──────────────────────────────────────────────────
const PRICING = {
  NG: {
    free: { display: '₦0', sub: '/month' },
    monthly: { display: '₦3,000', sub: '/month' },
    yearly: { display: '₦25,200', sub: '/year', perMonth: '₦2,100/mo' },
  },
  BR: {
    free: { display: 'R$0', sub: '/month' },
    monthly: { display: 'R$14.90', sub: '/month' },
    yearly: { display: 'R$124.90', sub: '/year', perMonth: 'R$10.40/mo' },
  },
  DEFAULT: {
    free: { display: '$0', sub: '/month' },
    monthly: { display: '$3.99', sub: '/month' },
    yearly: { display: '$33.99', sub: '/year', perMonth: '$2.83/mo' },
  },
};

type PricingKey = keyof typeof PRICING;

// ─── Features ────────────────────────────────────────────────────────────────
const FREE_FEATURES = [
  '14-day free sprint (Days 1–14)',
  'Core daily move cards',
  'Habit activity tracker',
  'Basic AI conversation',
  'Telegram coaching check-ins',
];

const PRO_EXTRA_FEATURES = [
  '21-Day Sprint & all days beyond',
  'Top-tier behavioral frameworks',
  'Proactive AI coaching on WhatsApp & Telegram',
  'Highly personalized daily conversations',
  'Live strategy & plan adjustments',
  'Priority support from Deylon',
];

export default function PricingPage() {
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('yearly');
  const [country, setCountry] = useState<PricingKey>('DEFAULT');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetch('https://ipapi.co/json/')
      .then((res) => res.json())
      .then((data) => {
        const code = data?.country_code as string;
        if (code === 'NG') setCountry('NG');
        else if (code === 'BR') setCountry('BR');
        else setCountry('DEFAULT');
      })
      .catch(() => setCountry('DEFAULT'));
  }, []);

  const pricing = PRICING[country];

  const handleCheckout = async (tier: 'monthly' | 'yearly') => {
    const priceId =
      tier === 'monthly'
        ? process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY
        : process.env.NEXT_PUBLIC_STRIPE_PRICE_YEARLY;

    if (!priceId) {
      alert('Pricing not configured correctly. Please try again shortly.');
      return;
    }

    try {
      setIsLoading(true);
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Could not start checkout. Please try again.');
      }
    } catch {
      alert('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F4F0] flex flex-col items-center px-4 py-16 font-sans">

      {/* Header */}
      <div className="text-center max-w-xl mx-auto mb-10">
        <p className="text-[11px] font-sans font-semibold tracking-[0.15em] text-[#1559EF] uppercase mb-4">
          ✦ Pricing
        </p>
        <h1 className="font-recoleta text-[38px] md:text-[48px] font-medium text-[#1a1a1a] leading-tight tracking-tight mb-4">
          Your AI coach.<br />Fully unleashed.
        </h1>
        <p className="text-[14px] text-[#6F6F77] leading-relaxed">
          Start free. When you&apos;re ready to go further, unlock everything<br className="hidden md:block" />
          Deylon has to offer for less than a cup of coffee a week.
        </p>
      </div>

      {/* Billing Toggle */}
      <div className="flex items-center bg-white border border-black/10 rounded-full p-1 mb-10 shadow-sm gap-1">
        <button
          onClick={() => setBilling('monthly')}
          className={`px-5 py-2 rounded-full text-[13px] font-sans font-medium transition-all ${
            billing === 'monthly'
              ? 'bg-[#1a1a1a] text-white shadow-sm'
              : 'text-[#6F6F77] hover:text-[#1a1a1a]'
          }`}
        >
          Monthly
        </button>
        <button
          onClick={() => setBilling('yearly')}
          className={`px-5 py-2 rounded-full text-[13px] font-sans font-medium transition-all flex items-center gap-2 ${
            billing === 'yearly'
              ? 'bg-[#1a1a1a] text-white shadow-sm'
              : 'text-[#6F6F77] hover:text-[#1a1a1a]'
          }`}
        >
          Annually
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${billing === 'yearly' ? 'bg-green-500 text-white' : 'bg-green-100 text-green-700'}`}>
            Save 30%
          </span>
        </button>
      </div>

      {/* Cards */}
      <div className="flex flex-col md:flex-row gap-5 w-full max-w-3xl">

        {/* Free Card */}
        <div className="flex-1 bg-white border border-black/10 rounded-[20px] p-7 flex flex-col shadow-sm">
          <div>
            <p className="text-[10px] font-sans font-semibold tracking-[0.15em] text-[#9ca3af] uppercase mb-4">
              DEYLON FREE
            </p>
            <div className="flex items-end gap-1 mb-1">
              <span className="font-recoleta text-[40px] text-[#1a1a1a] leading-none">
                {pricing.free.display}
              </span>
              <span className="text-[14px] text-[#9ca3af] mb-1">{pricing.free.sub}</span>
            </div>
            <p className="text-[14px] text-[#6F6F77] mt-2 mb-6 leading-relaxed">
              Start your habit journey with 14 days of guided daily moves and basic AI coaching.
            </p>
            <Link
              href="/dashboard"
              className="block w-full py-3 rounded-[10px] bg-[#F5F4F0] hover:bg-[#eceae4] text-[#1a1a1a] text-[13px] font-sans font-semibold text-center transition-colors border border-black/10"
            >
              Go to Dashboard
            </Link>
          </div>

          <div className="border-t border-black/5 mt-7 pt-6">
            <ul className="space-y-3">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-[14px] text-[#6F6F77]">
                  <svg className="w-4 h-4 mt-0.5 text-[#c4c4c4] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Pro Card */}
        <div className="flex-1 bg-[#1a1a1a] border border-white/5 rounded-[20px] p-7 flex flex-col shadow-xl relative overflow-hidden">
          {/* Subtle glow */}
          <div className="absolute -top-16 -right-16 w-40 h-40 bg-[#1559EF] rounded-full blur-[80px] opacity-20 pointer-events-none" />

          <div className="relative z-10">
            <p className="text-[10px] font-sans font-semibold tracking-[0.15em] text-[#1559EF] uppercase mb-4">
              DEYLON PRO
            </p>
            <div className="flex items-end gap-1 mb-1">
              <span className="font-recoleta text-[40px] text-white leading-none">
                {billing === 'monthly' ? pricing.monthly.display : pricing.yearly.display}
              </span>
              <span className="text-[14px] text-white/40 mb-1">
                {billing === 'monthly' ? pricing.monthly.sub : pricing.yearly.sub}
              </span>
            </div>
            {billing === 'yearly' && (
              <p className="text-[14px] text-green-400 mb-1">
                That&apos;s {pricing.yearly.perMonth} — billed annually
              </p>
            )}
            <p className="text-[14px] text-white/50 mt-2 mb-6 leading-relaxed">
              Everything in Deylon Free, plus the full 21-day sprint, advanced frameworks, and proactive AI coaching.
            </p>
            <button
              disabled={isLoading}
              onClick={() => handleCheckout(billing)}
              className="w-full py-3 rounded-[10px] bg-white hover:bg-white/90 text-[#1a1a1a] text-[13px] font-sans font-semibold text-center transition-all shadow-sm disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-4 h-4 rounded-full border-2 border-black/20 border-t-black animate-spin" />
              ) : (
                'Get Started'
              )}
            </button>
          </div>

          <div className="border-t border-white/10 mt-7 pt-6 relative z-10">
            {/* Free features included */}
            <p className="text-[11px] font-sans font-semibold tracking-wider text-white/30 uppercase mb-3">Everything in Free, plus:</p>
            <ul className="space-y-3">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-[14px] text-white/40">
                  <svg className="w-4 h-4 mt-0.5 text-white/20 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
            {/* Pro-only extras */}
            <div className="border-t border-white/10 mt-4 pt-4">
              <ul className="space-y-3">
                {PRO_EXTRA_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-[14px] text-white/80">
                    <svg className="w-4 h-4 mt-0.5 text-[#1559EF] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Footer note */}
      <p className="text-[14px] text-[#9ca3af] text-center mt-8 max-w-sm">
        Prices shown in your local currency. Cancel anytime. No questions asked.
      </p>

      <Link href="/dashboard" className="mt-4 text-[16px] text-[#4a4a4a] hover:text-[#1a1a1a] font-medium transition-colors underline underline-offset-2">
        ← Back to Dashboard
      </Link>
    </div>
  );
}
