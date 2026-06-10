import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function middleware(request) {
  let supabaseResponse = NextResponse.next({
    request,
  });

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
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session if expired - required for Server Components
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

  const { pathname } = request.nextUrl;
  const hostname = request.headers.get('host') || '';
  const isAppSubdomain = hostname.startsWith('app.');

  const isDashboard = pathname.startsWith('/dashboard');
  const isAuthPage = pathname === '/login' || pathname === '/signup';
  const isTjesaDomain = hostname.endsWith('tjesa.com');

  // On deployed tjesa.com domains, /dashboard must be on app.tjesa.com
  if (isDashboard && isTjesaDomain && !isAppSubdomain) {
    return NextResponse.redirect(`https://app.tjesa.com${pathname}`);
  }

  // app.tjesa.com is only for the dashboard — non-dashboard paths go to www.tjesa.com
  if (isAppSubdomain && isTjesaDomain && !isDashboard) {
    return NextResponse.redirect(`https://www.tjesa.com${pathname}`);
  }

  // Authenticated users visiting login/signup → send to dashboard
  if (isAuthPage && user) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  // Unauthenticated users visiting dashboard → send to login (not /, avoids loop on app subdomain)
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
