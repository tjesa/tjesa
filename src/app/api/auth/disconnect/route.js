import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { deleteAccount, deleteWorkspaceAccounts } from '@/lib/db';

export async function POST(request) {
  const { searchParams } = new URL(request.url);
  const tool = searchParams.get('tool');

  const cookieStore = await cookies();
  const workspaceId = cookieStore.get('tjesa_workspace_id')?.value;

  if (workspaceId) {
    try {
      if (tool) {
        // Sever connection for specific tool
        await deleteAccount(`${workspaceId}_${tool}`);
      } else {
        // Sever connection globally
        await deleteWorkspaceAccounts(workspaceId);
      }
    } catch (err) {
      console.error('[Disconnect API] Database deletion error:', err);
      return NextResponse.json({ error: 'Failed to sever connection in database' }, { status: 500 });
    }
  }

  const response = NextResponse.json({ success: true });
  
  // Clear the cookie by setting it to empty with maxAge 0
  response.cookies.set('tjesa_workspace_id', '', {
    path: '/',
    maxAge: 0,
  });

  return response;
}
