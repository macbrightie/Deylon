import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { Resend } from 'resend';

export async function POST(request: Request) {
  try {
    const { email, redirectTo } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const host = request.headers.get('host') || '';
    const isDev = process.env.NODE_ENV === 'development' || host.includes('localhost') || host.includes('127.0.0.1');
    const isGodMode = process.env.NEXT_PUBLIC_ENABLE_GOD_MODE === 'true';

    const supabase = await createServiceClient();

    // 1. Get all users to see if user exists (admin list API)
    const { data: userList, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
      console.error('[Send Magic Link] Failed to list users:', listError);
      return NextResponse.json({ error: listError.message }, { status: 500 });
    }
    
    let user = userList?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());

    if (!user) {
      // Create user if they don't exist
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        email_confirm: true,
      });

      if (createError) {
        console.error('[Send Magic Link] Failed to create user:', createError);
        return NextResponse.json({ error: createError.message }, { status: 500 });
      }
      user = newUser.user;
    }

    // 2. Generate the magic link
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: {
        redirectTo: redirectTo || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify`,
      },
    });

    if (linkError) {
      console.error('[Send Magic Link] Failed to generate link:', linkError);
      return NextResponse.json({ error: linkError.message }, { status: 500 });
    }

    const actionLink = linkData.properties.action_link;

    // 3. Dev / God Mode bypass logic (no emails sent, direct auto-login)
    if (isDev || isGodMode) {
      console.log(`[Auth Bypass] Direct login link generated for ${email}: ${actionLink}`);
      return NextResponse.json({ 
        success: true, 
        bypassed: true, 
        action_link: actionLink 
      });
    }

    // 4. Send via Resend if API key is set
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      try {
        const resend = new Resend(resendApiKey);
        const { error: resendError } = await resend.emails.send({
          from: 'Deylon <login@deylon.app>',
          to: email,
          subject: 'Sign in to Deylon',
          html: `
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 20px; background-color: #F7F5EE; border-radius: 16px;">
              <h2 style="color: #1a1a1a; margin-bottom: 8px;">Welcome back to Deylon</h2>
              <p style="color: #6f6f77; font-size: 14px; line-height: 1.5; margin-bottom: 24px;">Click the button below to instantly log in and resume your life planner progress.</p>
              <a href="${actionLink}" style="display: inline-block; padding: 12px 24px; background-color: #104d3b; color: white; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 14px;">Log in to Deylon</a>
              <p style="color: #6f6f77; font-size: 11px; margin-top: 32px; line-height: 1.4;">If you did not request this email, you can safely ignore it. This link is secure and will expire soon.</p>
            </div>
          `,
        });

        if (resendError) {
          console.error('[Resend Error]:', resendError);
          return NextResponse.json({ 
            error: `Failed to send email via Resend: ${resendError.message}` 
          }, { status: 500 });
        }

        return NextResponse.json({ success: true, bypassed: false });
      } catch (err) {
        console.error('[Resend Exception]:', err);
        const errorMessage = err instanceof Error ? err.message : String(err);
        return NextResponse.json({ error: `Failed to send email: ${errorMessage}` }, { status: 500 });
      }
    }

    // 5. No Resend API key set in production
    return NextResponse.json({ 
      error: 'Resend API key is not configured in production environment. Please set RESEND_API_KEY.' 
    }, { status: 500 });

  } catch (err) {
    console.error('[Send Magic Link Exception]:', err);
    const errorMessage = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
