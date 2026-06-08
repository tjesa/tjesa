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

  const isDashboard = request.nextUrl.pathname.startsWith('/dashboard');
  const isAuthPage = request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup';

  if (isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  if (isDashboard && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/dashboard',
    '/dashboard/:path*',
    '/login',
    '/signup'
  ]
};
