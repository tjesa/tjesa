import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const supabase = await createClient();
    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/api/auth/confirm?next=/auth/reset`,
    });

    if (error) {
      console.error('Forgot Password Supabase Error:', error);
      // We still return success: true to prevent user email harvesting/enumeration,
      // but log it internally. However, if there's a strict system error, we can return it.
      // But typically for safety we return success: true for all requests.
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Forgot Password Route Error:', err);
    return NextResponse.json({ error: 'Server error: ' + err.message }, { status: 500 });
  }
}
