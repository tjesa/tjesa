import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/supabase/server';
import { saveFeedback } from '@/lib/db';

export async function POST(req) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { category, subject, message } = await req.json();

    if (!category || !subject?.trim() || !message?.trim()) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }
    if (message.trim().length < 10) {
      return NextResponse.json({ error: 'Message must be at least 10 characters.' }, { status: 400 });
    }

    const entry = {
      user_id: user.id,
      user_email: user.email,
      category: category.trim(),
      subject: subject.trim(),
      message: message.trim(),
      status: 'open',
    };

    const saved = await saveFeedback(entry);
    return NextResponse.json({ success: true, id: saved.id });
  } catch (err) {
    console.error('[support/submit]', err);
    return NextResponse.json({ error: 'Failed to save. Please try again.' }, { status: 500 });
  }
}
