import { NextResponse } from 'next/server';
import { getAccount } from '@/lib/db';
import { pollAndSync } from '@/lib/poller';

export async function GET(request) {
  // Fire background poll & sync loop (non-blocking)
  pollAndSync().catch(err => console.error('[Tjesa Poller Trigger Error]:', err));

  const workspaceId = request.cookies.get('tjesa_workspace_id')?.value;

  if (!workspaceId) {
    return NextResponse.json({ connected: false });
  }

  const account = await getAccount(workspaceId);

  if (!account) {
    return NextResponse.json({ connected: false });
  }

  // Send public details to client (omit secret access token)
  const clientAccount = {
    workspace_id: account.workspace_id,
    workspace_name: account.workspace_name,
    workspace_icon: account.workspace_icon,
    connected_at: account.connected_at,
    connected: true
  };

  return NextResponse.json(clientAccount);
}
