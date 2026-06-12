'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export function VerifyClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const code = searchParams.get('code');
    const supabase = createClient();
    let isMounted = true;
    let successTriggered = false;

    // Helper to handle post-authentication database sync and redirects
    async function handleSuccess(session: any) {
      if (successTriggered) return;
      successTriggered = true;

      const user = session.user;
      const transcript = localStorage.getItem("deylon_onboarding_transcript");

      if (transcript && user) {
        try {
          const rawMessages = JSON.parse(transcript);
          const payloadMessages = rawMessages.map((m: any) => ({
            role: m.role === 'assistant' || m.role === 'deylon' ? 'assistant' as const : 'user' as const,
            content: m.content || m.text || '',
          }));

          const { data: conv, error: convError } = await supabase
            .from('conversations')
            .insert({
              user_id: user.id,
              messages: payloadMessages,
              completed: true
            })
            .select()
            .single();

          if (!convError && conv) {
            localStorage.removeItem("deylon_onboarding_transcript");
            if (isMounted) setStatus('success');
            setTimeout(() => {
              if (isMounted) router.push(`/building?conversationId=${conv.id}`);
            }, 1500);
            return;
          } else {
            console.error('[VerifyClient] Database insert error:', convError);
          }
        } catch (parseError) {
          console.error('[VerifyClient] Failed to parse or save transcript:', parseError);
        }
      }

      if (isMounted) setStatus('success');
      setTimeout(() => {
        if (isMounted) router.push('/dashboard');
      }, 1500);
    }

    // Subscribe to auth state changes to detect session from hash fragment redirects (#access_token)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[VerifyClient] Auth state changed:', event, session ? 'Session exists' : 'No session');
      if (session) {
        handleSuccess(session);
      }
    });

    // Check for active session or exchange code immediately
    async function checkOrExchange() {
      // 1. If we have a code query param (PKCE flow), exchange it
      if (code) {
        try {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            // Check if a session was already established (e.g. pre-fetched by browser)
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
              handleSuccess(session);
            } else {
              throw error;
            }
          }
        } catch (err: any) {
          console.error('[Verify Code Exchange Error]:', err);
          if (isMounted) {
            setStatus('error');
            setErrorMessage(err.message || 'Failed to exchange authentication code.');
          }
        }
        return;
      }

      // 2. If no code, check if we already have a session (e.g. parsed from hash fragment)
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        handleSuccess(session);
        return;
      }

      // 3. Fallback: Wait a brief moment for hash fragment parsing to finish
      setTimeout(async () => {
        if (!isMounted || successTriggered) return;
        const { data: { session: delayedSession } } = await supabase.auth.getSession();
        if (delayedSession) {
          handleSuccess(delayedSession);
        } else {
          setStatus('error');
          setErrorMessage('No authentication code or session found in URL. Please request a new magic link.');
        }
      }, 2000);
    }

    checkOrExchange();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [searchParams, router]);

  return (
    <div className="text-center space-y-6 px-6 animate-in fade-in duration-300">
      {status === 'verifying' && (
        <div className="space-y-4">
          <div className="flex justify-center mb-6">
            <svg className="animate-spin w-10 h-10 text-[#104d3b]" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          </div>
          <h1 className="text-2xl font-sans font-medium text-[#1a1a1a] tracking-tight">
            Verifying your link…
          </h1>
          <p className="text-[14px] text-foreground/60 font-sans max-w-sm mx-auto leading-relaxed">
            Please wait while we secure your session and get you in.
          </p>
        </div>
      )}

      {status === 'success' && (
        <div className="space-y-4">
          <div className="flex justify-center mb-6 text-[#104d3b]">
            <svg className="w-16 h-16 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-sans font-medium text-[#104d3b] tracking-tight">
            Successfully Authenticated
          </h1>
          <p className="text-[14px] text-foreground/60 font-sans max-w-sm mx-auto leading-relaxed">
            Redirecting you to your dashboard...
          </p>
        </div>
      )}

      {status === 'error' && (
        <div className="space-y-6">
          <div className="flex justify-center text-red-600">
            <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-sans font-medium text-red-600 tracking-tight">
              Verification Failed
            </h1>
            <p className="text-[14px] text-foreground/60 font-sans max-w-xs mx-auto leading-relaxed">
              {errorMessage || 'This magic link may have expired or already been used. Please try logging in again.'}
            </p>
          </div>
          <div className="pt-2">
            <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 rounded-[12px] bg-[#1a1a1a] text-white text-[13px] font-sans font-medium hover:bg-[#333] transition-all active:scale-95 shadow-sm">
              Return Home
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
