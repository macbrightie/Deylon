'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

export function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [authStep, setAuthStep] = useState<'email' | 'check'>('email');
  const [loading, setLoading] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();

  const isDev = process.env.NODE_ENV === 'development' || 
                (typeof window !== 'undefined' && (
                  window.location.hostname === 'localhost' || 
                  window.location.hostname === '127.0.0.1' ||
                  window.location.hostname.endsWith('vercel.app')
                ));

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    
    // Fast initial check using getSession
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
      }
      setAuthLoading(false);
    });

    // Listen to changes (fires when session is loaded or updated)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const code = searchParams.get('code');
      if (code) {
        router.push(`/verify?code=${code}`);
      }
    }
  }, [router]);

  const handleManageProgress = () => {
    if (authLoading) return;
    if (user) {
      router.push('/dashboard');
    } else {
      setIsModalOpen(true);
    }
  };

  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { sendMagicLinkOrBypass } = await import('@/lib/supabase/auth-helper');
      const { error, bypassed } = await sendMagicLinkOrBypass(email, `${window.location.origin}/verify`);
      if (error) throw error;
      
      if (!bypassed) {
        setAuthStep('check');
      }
    } catch (err) {
      console.error('[Magic Link Auth Error]:', err);
      alert('Failed to send magic link. Please check your email address and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDevBypassLogin = async () => {
    setLoading(true);
    try {
      const { sendMagicLinkOrBypass } = await import('@/lib/supabase/auth-helper');
      const { error } = await sendMagicLinkOrBypass('dev@example.com', `${window.location.origin}/verify`);
      if (error) throw error;
    } catch (err) {
      console.error('[Dev Bypass Error]:', err);
      alert('Failed to log in via Dev Bypass. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <header className={`sticky top-0 z-50 w-full transition-all duration-300 ${scrolled ? 'bg-[#1a1a1a] shadow-md' : 'bg-transparent mix-blend-difference'}`}>
        <nav className="flex items-center justify-between py-4 md:py-6 px-[12px] md:px-8 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-5 h-5 bg-[#104d3b] rounded-[999px]" />
              <span className="font-sans font-bold text-2xl tracking-tight text-white">deylon</span>
            </Link>

            <div className="hidden md:flex items-center gap-8 ml-4">
              <Link 
                href="#how-it-works" 
                className="text-sm font-medium text-white/90 hover:text-white transition-colors"
              >
                Hows deylon different?
              </Link>
              <Link 
                href="#pricing" 
                className="text-sm font-medium text-white/90 hover:text-white transition-colors"
              >
                Pro
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button 
              onClick={handleManageProgress}
              variant="ghost" 
              size="md" 
              className="rounded-[999px] border-none px-6 py-2 bg-white hover:bg-white/90 shadow-lg cursor-pointer"
              style={{ color: '#1b1b1b' }}
            >
              Manage progress
            </Button>
          </div>
        </nav>
      </header>

      {/* Magic Link Login Modal - Rendered outside of mix-blend-difference boundary */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop with elegant blur */}
          <div 
            onClick={() => setIsModalOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
          />
          
          {/* Card container with warm cream background */}
          <div className="relative bg-[#F4F0EB] text-[#1a1a1a] rounded-[24px] overflow-hidden p-8 w-full max-w-[420px] shadow-2xl flex flex-col items-center z-10 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Close Button */}
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center text-[#1a1a1a] transition-all hover:scale-105 active:scale-95 cursor-pointer"
              aria-label="Close modal"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            {authStep === 'email' ? (
              <div className="w-full text-center space-y-6">
                <div className="flex justify-center">
                  <div className="w-12 h-12 rounded-full bg-[#104d3b]/10 flex items-center justify-center text-[#104d3b]">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-sans font-medium text-[22px] tracking-tight text-[#1a1a1a]">
                    Manage progress
                  </h3>
                  <p className="text-[14px] text-foreground/60 font-sans leading-relaxed">
                    Enter your email to receive a secure, passcode-free magic link straight to your inbox.
                  </p>
                </div>

                <form onSubmit={handleSendMagicLink} className="space-y-4 text-left">
                  <div className="flex flex-col">
                    <label className="text-[12px] font-sans font-semibold text-[#6f6f77] mb-1.5 pl-1 select-none">
                      Email address
                    </label>
                    <input 
                      type="email" 
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full px-4 py-3 rounded-[12px] bg-[#ECE8E2] border border-transparent focus:border-black/10 focus:bg-[#FBFAFA] text-[#1a1a1a] text-[14px] font-sans outline-none placeholder-[#6f6f77]/40 transition-all shadow-inner"
                    />
                  </div>

                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 rounded-[12px] bg-[#1a1a1a] hover:bg-[#333] active:scale-95 disabled:opacity-50 disabled:pointer-events-none text-white text-[14px] font-sans font-medium transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {loading ? (
                      <svg className="animate-spin w-4 h-4 text-white" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                      </svg>
                    ) : (
                      'Send magic link'
                    )}
                  </button>
                </form>
                {isDev && (
                  <div className="w-full pt-4 border-t border-[#1a1a1a]/10 flex flex-col gap-2 mt-4">
                    <span className="text-[10px] font-mono text-[#6f6f77] text-center uppercase tracking-wider font-semibold select-none">
                      Development Tools
                    </span>
                    <button 
                      type="button"
                      onClick={handleDevBypassLogin}
                      disabled={loading}
                      className="w-full py-3 rounded-[12px] bg-[#104d3b] hover:bg-[#0d3f30] active:scale-95 disabled:opacity-50 disabled:pointer-events-none text-white text-[13.5px] font-sans font-medium transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer border-none"
                    >
                      Bypass & Log In Instantly (dev@example.com)
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full text-center space-y-6 py-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-[#104d3b]/10 flex items-center justify-center text-[#104d3b] animate-bounce">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M22 2L11 13" />
                      <path d="M22 2L15 22L11 13L2 9L22 2Z" />
                    </svg>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-sans font-medium text-[22px] tracking-tight text-[#1a1a1a]">
                    Check your inbox
                  </h3>
                  <p className="text-[14px] text-foreground/60 font-sans leading-relaxed px-2">
                    We&apos;ve sent a secure login link to <span className="font-semibold text-[#1a1a1a]">{email}</span>. Click the link in your email to get in.
                  </p>
                </div>

                <div className="pt-2">
                  <button 
                    onClick={() => setAuthStep('email')}
                    className="text-[13px] font-sans font-medium text-[#104d3b] hover:underline cursor-pointer bg-transparent border-none"
                  >
                    Use a different email
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
