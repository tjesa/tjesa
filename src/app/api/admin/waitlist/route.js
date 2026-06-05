import { NextResponse } from 'next/server';
import { getWaitlist } from '@/lib/db';
import { getCurrentUser } from '@/lib/supabase/server';

export async function GET(request) {
  const user = await getCurrentUser();

  if (!user || !(user.email === 'developer@tjesa.com' || user.email?.endsWith('@tjesa.com'))) {
    return NextResponse.json({ error: 'Unauthorized: Admin portal closed' }, { status: 403 });
  }

  try {
    const emails = await getWaitlist();
    return NextResponse.json({
      success: true,
      emails
    });
  } catch (error) {
    console.error('Error fetching waitlist emails:', error);
    return NextResponse.json({ error: 'Failed to retrieve waitlist emails: ' + error.message }, { status: 500 });
  }
}
