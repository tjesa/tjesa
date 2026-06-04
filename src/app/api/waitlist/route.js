import { NextResponse } from 'next/server';
import { saveWaitlist } from '@/lib/db';

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json({ error: 'Invalid email address format.' }, { status: 400 });
    }

    await saveWaitlist(email.trim());

    return NextResponse.json({
      success: true,
      message: 'Email successfully registered to the waitlist.'
    });
  } catch (error) {
    if (error.message === 'Email already registered') {
      return NextResponse.json({ error: 'This email is already registered in the archives.' }, { status: 400 });
    }
    console.error('Waitlist submission error:', error);
    return NextResponse.json({ error: 'Failed to join waitlist: ' + error.message }, { status: 500 });
  }
}
