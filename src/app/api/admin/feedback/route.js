import { NextResponse } from 'next/server';
import { getFeedback, updateFeedback } from '@/lib/db';
import { getCurrentUser } from '@/lib/supabase/server';

function isAdmin(user) {
  return user && (user.email === 'developer@tjesa.com' || user.email === 'hazemyasser911@gmail.com' || user.email?.endsWith('@tjesa.com'));
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

export async function PATCH(req) {
  const user = await getCurrentUser();
  if (!isAdmin(user)) {
    return NextResponse.json({ error: 'Unauthorized: Admin portal closed' }, { status: 403 });
  }

  try {
    const { id, status, priority, admin_notes } = await req.json();
    if (!id) return NextResponse.json({ error: 'Ticket ID required.' }, { status: 400 });

    const allowed = ['open', 'in_progress', 'resolved'];
    if (status && !allowed.includes(status)) {
      return NextResponse.json({ error: 'Invalid status value.' }, { status: 400 });
    }

    const updates = {};
    if (status !== undefined) updates.status = status;
    if (priority !== undefined) updates.priority = priority;
    if (admin_notes !== undefined) updates.admin_notes = admin_notes;

    const updated = await updateFeedback(id, updates);
    return NextResponse.json({ success: true, ticket: updated });
  } catch (err) {
    console.error('[admin/feedback] PATCH error:', err);
    return NextResponse.json({ error: 'Failed to update ticket.' }, { status: 500 });
  }
}
