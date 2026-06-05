import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import DashboardHub from '@/components/DashboardHub';
import { getAnyAccountForWorkspace, getAccountsForUser, getConfigs } from '@/lib/db';
import { getCurrentUser } from '@/lib/supabase/server';

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const cookieStore = await cookies();
  let workspaceId = cookieStore.get('tjesa_workspace_id')?.value;

  const userAccounts = await getAccountsForUser(user.id);

  // If cookie not set, try to get the first account connected for this user
  if (!workspaceId && userAccounts && userAccounts.length > 0) {
    const firstAccount = userAccounts[0];
    workspaceId = firstAccount.workspace_id.split('_')[0];
  }

  // Fetch configs for all connected accounts (tools)
  let initialConfigs = [];
  if (workspaceId) {
    try {
      const accountIds = [workspaceId, ...userAccounts.map(a => a.workspace_id)];
      const uniqueAccountIds = [...new Set(accountIds)];
      
      for (const accId of uniqueAccountIds) {
        const configs = await getConfigs(accId);
        initialConfigs = [...initialConfigs, ...configs];
      }
    } catch (err) {
      console.error('[DashboardPage] Error fetching configs:', err);
    }
  }

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Ancient Egypt hieroglyphic watermark */}
      <div className="hieroglyph-bg" />
      <DashboardHub userAccounts={userAccounts} user={user} initialConfigs={initialConfigs} />
    </main>
  );
}
