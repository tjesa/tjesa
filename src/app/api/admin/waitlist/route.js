import { NextResponse } from 'next/server';
import { getWaitlist } from '@/lib/db';

export async function GET(request) {
  // Verify active dashboard workspace session
  const workspaceId = request.cookies.get('tjesa_workspace_id')?.value;

  if (!workspaceId) {
    return NextResponse.json({ error: 'Unauthorized: Admin portal closed' }, { status: 401 });
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
