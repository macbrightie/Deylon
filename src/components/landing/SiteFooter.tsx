'use client';

import Image from 'next/image';

export function SiteFooter() {
  return (
    <>
      {/* ── CTA section (white bg above the dark footer card) ───────────── */}
      <section className="bg-white px-6 py-8 md:py-12 text-center">
        <h2 className="text-[36px] md:text-[56px] lg:text-[64px] font-serif text-[#1a1a1a] leading-tight tracking-tight mb-5">
          Your plan is waiting.
        </h2>
        <p className="text-[15px] md:text-[17px] font-sans text-[#4e4e55] max-w-2xl mx-auto leading-relaxed mb-8">
          The version of your life you keep imagining doesn&apos;t require luck.
          It requires one clear plan and someone to walk with you every day.
          That&apos;s Aven.
        </p>
        <a
          href="#embedded-chat"
          className="inline-flex items-center justify-center rounded-[999px] px-10 py-3 text-base font-medium bg-black text-white hover:bg-black/90 shadow-xl shadow-black/20 border border-white transition-all"
        >
          Start my plan
        </a>
        <p className="mt-5 text-[13px] font-sans text-[#1a1a1a]/35 tracking-wide">
          No credit card. Takes 5 minutes. Built around your actual life.
        </p>
      </section>

      {/* ── Dark footer card with 10% margin, top rounded corners, color #1b1b1b ── */}
      <div className="w-full bg-white mt-auto">
        <footer className="w-[calc(100%-24px)] md:w-[80%] mx-auto bg-[#1b1b1b] text-white pt-16 pb-12 px-6 md:px-8 rounded-t-[32px] rounded-b-none mb-0 flex flex-col items-center">
          {/* Content wrapper */}
          <div className="w-full md:w-[70%] max-w-[1000px] mx-auto text-center flex flex-col items-center">
            {/* Wordmark */}
            <p className="text-white font-serif text-[32px] mb-8 tracking-tight">
              Aven
            </p>

            {/* Discord CTA container containing a separate Join button */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-8 border border-white/10 rounded-[24px] md:rounded-full md:pl-8 px-5 md:pr-3 py-5 md:py-2 bg-[#161616]/40 mb-12 w-[85%] md:w-auto">
              <span className="text-[14px] md:text-[15px] font-serif text-white tracking-tight text-center md:text-left">
                Get support from real people.
              </span>
              <a
                href="https://discord.gg/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-5 py-3 md:py-2 border border-white/20 rounded-full text-[13px] font-sans text-white hover:bg-white/5 transition-all w-full md:w-auto"
              >
                <span>Join Discord community</span>
                {/* Discord icon */}
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-4 h-4 text-white/80"
                  aria-hidden="true"
                >
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
              </a>
            </div>

            {/* Bottom bar */}
            <div className="w-full flex flex-col md:flex-row items-center justify-between gap-4 text-[13px] font-sans text-white/35 pt-4">
              <div className="flex items-center gap-4">
                <span>© Aven 2026</span>
                <span className="text-white/20">|</span>
                <a href="#" className="hover:text-white/60 transition-colors">
                  Privacy.
                </a>
              </div>

              {/* Social icons */}
              <div className="flex items-center gap-5">
                {/* Instagram */}
                <a href="#" aria-label="Instagram" className="text-white/50 hover:text-white transition-colors">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-5 h-5">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <circle cx="12" cy="12" r="4" />
                    <circle cx="17.5" cy="6.5" r="0.7" fill="currentColor" stroke="none" />
                  </svg>
                </a>
                {/* X / Twitter */}
                <a href="#" aria-label="X" className="text-white/50 hover:text-white transition-colors">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                {/* Telegram */}
                <a href="#" aria-label="Telegram" className="text-white/50 hover:text-white transition-colors">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
