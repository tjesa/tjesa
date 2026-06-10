import { NextResponse } from 'next/server';
import { getAccount, getAccountsForUser } from '@/lib/db';
import { pollAndSync } from '@/lib/poller';
import { getCurrentUser } from '@/lib/supabase/server';

export async function GET(request) {
  // Fire background poll & sync loop (non-blocking)
  pollAndSync().catch(err => console.error('[Tjesa Poller Trigger Error]:', err));

  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ authenticated: false, connected: false });
  }

  // Get workspace cookie
  let workspaceId = request.cookies.get('tjesa_workspace_id')?.value;

  const userAccounts = await getAccountsForUser(user.id);

  // If cookie not set, try to get the first account connected for this user
  if (!workspaceId) {
    if (userAccounts && userAccounts.length > 0) {
      // Find one that doesn't have a tool suffix (the main connection)
      const mainAccount = userAccounts.find(a => !a.tool) || userAccounts[0];
      // Normalize workspace ID (remove tool suffix if present)
      workspaceId = mainAccount.workspace_id.split('_')[0];
    }
  }

  // Merge in tool-specific accounts by workspace_id so the sidebar green dot
  // lights up even when the account was saved with a different/null user_id.
  if (workspaceId) {
    const toolSuffixes = ['qr', 'forms', 'charts', 'publisher', 'sphinx', 'pdf', 'mail', 'social'];
    const toolAccounts = await Promise.all(
      toolSuffixes.map(t => getAccount(`${workspaceId}_${t}`))
    );
    toolAccounts.forEach(ta => {
      if (ta && !userAccounts.some(a => a.workspace_id === ta.workspace_id)) {
        userAccounts.push(ta);
      }
    });
  }

  let account = null;
  if (workspaceId) {
    account = await getAccount(workspaceId);
  }

  const responseData = {
    authenticated: true,
    user: {
      id: user.id,
      email: user.email,
    },
    connected: !!account,
    accounts: userAccounts || [],
  };

  if (account) {
    responseData.account = {
      workspace_id: account.workspace_id,
      workspace_name: account.workspace_name,
      workspace_icon: account.workspace_icon,
      connected_at: account.connected_at,
    };
  }

  const response = NextResponse.json(responseData);

  // Auto-set workspace cookie if we resolved a workspace but the cookie was missing
  if (workspaceId && !request.cookies.get('tjesa_workspace_id')?.value) {
    response.cookies.set('tjesa_workspace_id', workspaceId, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
  }

  return response;
}
