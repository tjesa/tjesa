import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/supabase/server';
import { getFeedbackForUser } from '@/lib/db';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const tickets = await getFeedbackForUser(user.id);
    return NextResponse.json({ success: true, tickets });
  } catch (err) {
    console.error('[support/tickets]', err);
    return NextResponse.json({ error: 'Failed to retrieve tickets.' }, { status: 500 });
  }
}
