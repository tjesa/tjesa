import { NextResponse } from 'next/server';
import { voteFeedback } from '@/lib/db';

export async function POST(req) {
  try {
    const { id, value } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Feedback ID is required.' }, { status: 400 });
    }

    const val = parseInt(value, 10);
    if (isNaN(val) || (val !== 1 && val !== -1)) {
      return NextResponse.json({ error: 'Invalid vote value. Must be 1 or -1.' }, { status: 400 });
    }

    const updated = await voteFeedback(id, val);
    return NextResponse.json({ success: true, votes: updated.votes || 0 });
  } catch (err) {
    console.error('[api/feedback/vote] POST error:', err);
    return NextResponse.json({ error: err.message || 'Failed to record vote.' }, { status: 500 });
  }
}
