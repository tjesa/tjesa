import { NextResponse } from 'next/server';
import { inviteWaitlistScribe } from '@/lib/db';
import { getCurrentUser } from '@/lib/supabase/server';

// Helper to verify admin privileges
async function verifyAdmin() {
  const user = await getCurrentUser();
  if (!user || !(user.email === 'developer@tjesa.com' || user.email?.endsWith('@tjesa.com'))) {
    return false;
  }
  return true;
}

export async function POST(request) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized: Admin portal closed' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing waitlist registrant ID.' }, { status: 400 });
    }

    const updatedScribe = await inviteWaitlistScribe(id);
    return NextResponse.json({
      success: true,
      scribe: updatedScribe
    });
  } catch (error) {
    console.error('Error inviting waitlist registrant:', error);
    return NextResponse.json({ error: 'Failed to invite waitlist registrant: ' + error.message }, { status: 500 });
  }
}
