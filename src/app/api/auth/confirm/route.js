import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  const next = searchParams.get('next') ?? '/dashboard';

  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const redirectTo = new URL(next, siteUrl);

  const code = searchParams.get('code');

  if (token_hash && type) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.verifyOtp({
        type,
        token_hash,
      });

      if (!error) {
        if (type === 'recovery') {
          // Redirect to password reset page
          return NextResponse.redirect(new URL('/auth/reset', siteUrl));
        }
        if (type === 'signup') {
          // Redirect to login page with verified parameter
          return NextResponse.redirect(new URL('/login?verified=1', siteUrl));
        }
        // Redirect to whatever next was specified
        return NextResponse.redirect(redirectTo);
      } else {
        console.error('verifyOtp error:', error);
        return NextResponse.redirect(
          new URL(`/login?error=${encodeURIComponent(error.message)}`, siteUrl)
        );
      }
    } catch (err) {
      console.error('Confirm route error:', err);
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(err.message)}`, siteUrl)
      );
    }
  } else if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(redirectTo);
      } else {
        console.error('exchangeCodeForSession error:', error);
        return NextResponse.redirect(
          new URL(`/login?error=${encodeURIComponent(error.message)}`, siteUrl)
        );
      }
    } catch (err) {
      console.error('Confirm route exchange code error:', err);
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(err.message)}`, siteUrl)
      );
    }
  }

  return NextResponse.redirect(
    new URL('/login?error=Invalid+or+missing+verification+token', siteUrl)
  );
}
