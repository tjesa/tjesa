import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AdminClient from '@/components/AdminClient';
import { getAnyAccountForWorkspace } from '@/lib/db';

export default async function AdminPage() {
  const cookieStore = await cookies();
  const workspaceId = cookieStore.get('tjesa_workspace_id')?.value;

  if (!workspaceId) {
    redirect('/');
  }

  const account = await getAnyAccountForWorkspace(workspaceId);

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Ancient Egypt hieroglyphic watermark */}
      <div className="hieroglyph-bg" />
      <AdminClient account={account} />
    </main>
  );
}
