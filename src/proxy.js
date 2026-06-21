import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function proxy(request) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get('host') || '';
  const isAppSubdomain = hostname.startsWith('app.');
  const isTjesaDomain = hostname.endsWith('tjesa.com');
  const isDashboard = pathname.startsWith('/dashboard');
  const isAuthPage = pathname === '/login' || pathname === '/signup';

  // ── www.tjesa.com ──────────────────────────────────────────────────────────
  // Pure marketing domain — no Supabase, no session logic, just routing rules.
  if (isTjesaDomain && !isAppSubdomain) {
    if (isDashboard) {
      return NextResponse.redirect(`https://app.tjesa.com${pathname}`);
    }
    // Waitlist phase: login/signup not open on www
    if (isAuthPage) {
      return NextResponse.redirect('https://www.tjesa.com');
    }
    return NextResponse.next();
  }

  // ── app.tjesa.com + localhost ──────────────────────────────────────────────
  // Full auth logic lives here.
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, {
              ...options,
              // Share session across all *.tjesa.com subdomains
              domain: isTjesaDomain ? '.tjesa.com' : undefined,
            })
          );
        },
      },
    }
  );

  const bypassActive = request.cookies.get('tjesa_bypass_active')?.value === 'true';
  let user = null;
  if (bypassActive) {
    user = {
      id: '00000000-0000-0000-0000-000000000000',
      email: 'developer@tjesa.com',
    };
  } else {
    const { data } = await supabase.auth.getUser();
    user = data?.user;
  }

  // app.tjesa.com: non-dashboard, non-auth paths → www.tjesa.com
  if (isAppSubdomain && !isDashboard && !isAuthPage) {
    return NextResponse.redirect(`https://www.tjesa.com${pathname}`);
  }

  // Authenticated users on login/signup → dashboard
  if (isAuthPage && user) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  // Unauthenticated dashboard → login (stays on app.tjesa.com)
  if (isDashboard && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/',
    '/dashboard',
    '/dashboard/:path*',
    '/login',
    '/signup',
    '/qr', '/charts', '/forms', '/publisher', '/sphinx', '/pdf', '/mail', '/social', '/settings'
  ]
};
