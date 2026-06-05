import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request) {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();

    const response = NextResponse.json({ success: true });
    
    // Clear workspace cookie as well
    response.cookies.set('tjesa_workspace_id', '', {
      path: '/',
      maxAge: 0,
    });

    // Clear bypass cookie
    response.cookies.set('tjesa_bypass_active', '', {
      path: '/',
      maxAge: 0,
    });

    return response;
  } catch (err) {
    console.error('Signout API Error:', err);
    return NextResponse.json({ error: 'Server error: ' + err.message }, { status: 500 });
  }
}
