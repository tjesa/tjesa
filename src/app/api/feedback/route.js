import { NextResponse } from 'next/server';
import { getFeedback, saveFeedback } from '@/lib/db';
import { getCurrentUser } from '@/lib/supabase/server';

export async function GET() {
  try {
    const allFeedback = await getFeedback();
    
    // Process items for public display
    // 1. Omit admin_notes unless they are completed/resolved (resolved admin_notes can act as changelog text)
    // 2. Redact email for privacy, showing it as e.g. "ha***11@gmail.com"
    const publicFeedback = allFeedback.map(item => {
      let redactedEmail = 'anonymous@tjesa.com';
      if (item.user_email) {
        const parts = item.user_email.split('@');
        if (parts.length === 2) {
          const name = parts[0];
          const domain = parts[1];
          if (name.length <= 3) {
            redactedEmail = `${name[0]}***@${domain}`;
          } else {
            redactedEmail = `${name.slice(0, 2)}***${name.slice(-1)}@${domain}`;
          }
        }
      }

      return {
        id: item.id,
        category: item.category,
        subject: item.subject,
        message: item.message,
        status: item.status || 'open',
        submitted_at: item.submitted_at,
        votes: item.votes || 0,
        user_email: redactedEmail,
        // Only return admin_notes if resolved (this forms the changelog update notes)
        admin_notes: item.status === 'resolved' ? (item.admin_notes || '') : '',
        resolved_at: item.resolved_at || null
      };
    });

    return NextResponse.json({ success: true, submissions: publicFeedback });
  } catch (err) {
    console.error('[api/feedback] GET error:', err);
    return NextResponse.json({ error: 'Failed to retrieve feedback submissions.' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const user = await getCurrentUser();
    const body = await req.json();
    const { category, subject, message, email } = body;

    if (!category || !subject?.trim() || !message?.trim()) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }
    if (message.trim().length < 10) {
      return NextResponse.json({ error: 'Message must be at least 10 characters.' }, { status: 400 });
    }

    let finalEmail = email?.trim();
    let userId = null;

    if (user) {
      finalEmail = user.email;
      userId = user.id;
    } else {
      if (!finalEmail || !finalEmail.includes('@')) {
        return NextResponse.json({ error: 'A valid email address is required for guest feedback.' }, { status: 400 });
      }
    }

    const entry = {
      user_id: userId,
      user_email: finalEmail,
      category: category.trim(),
      subject: subject.trim(),
      message: message.trim(),
      status: 'open',
      priority: 'medium',
      votes: 1, // Automatically has 1 vote (from the author)
      admin_notes: '',
      submitted_at: new Date().toISOString()
    };

    const saved = await saveFeedback(entry);
    return NextResponse.json({ success: true, entry: saved });
  } catch (err) {
    console.error('[api/feedback] POST error:', err);
    return NextResponse.json({ error: 'Failed to save feedback. Please try again.' }, { status: 500 });
  }
}
