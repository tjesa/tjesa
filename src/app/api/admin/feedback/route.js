import { NextResponse } from 'next/server';
import { getFeedback } from '@/lib/db';
import { getCurrentUser } from '@/lib/supabase/server';

function isAdmin(user) {
  return user && (user.email === 'developer@tjesa.com' || user.email?.endsWith('@tjesa.com'));
}

export async function GET() {
  const user = await getCurrentUser();
  if (!isAdmin(user)) {
    return NextResponse.json({ error: 'Unauthorized: Admin portal closed' }, { status: 403 });
  }

  try {
    const submissions = await getFeedback();
    return NextResponse.json({ success: true, submissions });
  } catch (err) {
    console.error('[admin/feedback] GET error:', err);
    return NextResponse.json({ error: 'Failed to retrieve feedback submissions.' }, { status: 500 });
  }
}
