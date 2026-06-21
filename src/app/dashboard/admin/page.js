import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AdminClient from '@/components/AdminClient';
import { getAnyAccountForWorkspace } from '@/lib/db';
import { getCurrentUser } from '@/lib/supabase/server';

export default async function AdminPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const isAdmin = user.email === 'developer@tjesa.com' || user.email === 'hazemyasser911@gmail.com' || user.email?.endsWith('@tjesa.com');
  if (!isAdmin) {
    redirect('/dashboard');
  }

  const cookieStore = await cookies();
  const workspaceId = cookieStore.get('tjesa_workspace_id')?.value;

  const account = workspaceId ? await getAnyAccountForWorkspace(workspaceId) : null;

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Ancient Egypt hieroglyphic watermark */}
      <div className="hieroglyph-bg" />
      <AdminClient account={account} />
    </main>
  );
}
