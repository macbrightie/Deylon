import { createClient } from '@/lib/supabase/client';

/**
 * Handles magic link authentication.
 * - In development or God Mode, requests the bypass action link and redirects instantly.
 * - In production, attempts to send the magic link using Resend via our custom API route (bypassing Supabase SMTP limits).
 * - Falls back to standard Supabase client signInWithOtp if the custom backend route is not configured or fails.
 */
export async function sendMagicLinkOrBypass(email: string, redirectTo: string, messages?: any[]) {
  const isDev = process.env.NODE_ENV === 'development' || 
                (typeof window !== 'undefined' && (
                  window.location.hostname === 'localhost' || 
                  window.location.hostname === '127.0.0.1' ||
                  window.location.hostname.endsWith('vercel.app')
                ));
  const isGodMode = process.env.NEXT_PUBLIC_ENABLE_GOD_MODE === 'true';

  if (isDev || isGodMode) {
    try {
      console.log('[Auth] Dev or God Mode environment detected. Requesting direct login link.');
      const res = await fetch('/api/auth/send-magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, redirectTo, messages }),
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Bypass request failed');
      }
      
      const data = await res.json();
      if (data.bypassed && data.action_link) {
        console.log('[Auth] Bypassing email. Redirecting browser to auto-login link...');
        window.location.href = data.action_link;
        return { error: null, bypassed: true, sent: false };
      }
      
      if (data.success && !data.bypassed) {
        return { error: null, bypassed: false, sent: true };
      }
    } catch (e) {
      console.warn('[Auth] Custom bypass endpoint failed. Falling back to standard OTP:', e);
    }
  }

  // Production or fallback to custom send-magic-link API (using Resend)
  try {
    const res = await fetch('/api/auth/send-magic-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, redirectTo, messages }),
    });

    if (res.ok) {
      await res.json();
      return { error: null, bypassed: false, sent: true };
    }
    
    const errData = await res.json();
    console.warn('[Auth] Backend send-magic-link route returned an error. Falling back to Supabase client OTP:', errData.error);
  } catch (err) {
    console.warn('[Auth] Backend send-magic-link request failed. Falling back to Supabase client OTP:', err);
  }

  // Final client-side fallback
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectTo,
    },
  });
  
  return { error, bypassed: false, sent: !error };
}
