import { NextResponse } from 'next/server';
import { getAccounts, deleteWorkspaceAccounts } from '@/lib/db';
import { getCurrentUser } from '@/lib/supabase/server';

// Helper to verify admin privileges
async function verifyAdmin() {
  const user = await getCurrentUser();
  if (!user || !(user.email === 'developer@tjesa.com' || user.email?.endsWith('@tjesa.com'))) {
    return false;
  }
  return true;
}

export async function GET(request) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized: Admin portal closed' }, { status: 403 });
  }

  try {
    const workspaces = await getAccounts();
    return NextResponse.json({
      success: true,
      workspaces
    });
  } catch (error) {
    console.error('Error fetching connected workspaces:', error);
    return NextResponse.json({ error: 'Failed to retrieve workspaces: ' + error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized: Admin portal closed' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspace_id');

    if (!workspaceId) {
      return NextResponse.json({ error: 'Missing workspace_id parameter.' }, { status: 400 });
    }

    await deleteWorkspaceAccounts(workspaceId);
    return NextResponse.json({
      success: true,
      message: 'Workspace successfully disconnected.'
    });
  } catch (error) {
    console.error('Error disconnecting workspace:', error);
    return NextResponse.json({ error: 'Failed to disconnect workspace: ' + error.message }, { status: 500 });
  }
}
