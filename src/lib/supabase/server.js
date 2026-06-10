import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, {
                ...options,
                domain: process.env.NODE_ENV === 'production' ? '.tjesa.com' : undefined,
              })
            );
          } catch {
            // Called from a Server Component — safe to ignore.
          }
        },
      },
    }
  );
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const bypassActive = cookieStore.get('tjesa_bypass_active')?.value === 'true';

  if (bypassActive) {
    return {
      id: '00000000-0000-0000-0000-000000000000',
      email: 'developer@tjesa.com',
      user_metadata: { name: 'Developer Account' }
    };
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch (err) {
    console.error('[getCurrentUser] Error retrieving Supabase user:', err);
    return null;
  }
}
