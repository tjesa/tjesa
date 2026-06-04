import { cookies } from 'next/headers';
import DashboardHubClient from '@/components/DashboardHubClient';
import { getAnyAccountForWorkspace } from '@/lib/db';

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const workspaceId = cookieStore.get('tjesa_workspace_id')?.value;

  let account = null;
  if (workspaceId) {
    account = await getAnyAccountForWorkspace(workspaceId);
  }

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Ancient Egypt hieroglyphic watermark */}
      <div className="hieroglyph-bg" />
      <DashboardHubClient account={account} />
    </main>
  );
}
