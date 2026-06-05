import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/supabase/server';
import SettingsClient from '@/components/SettingsClient';

export const metadata = {
  title: 'Temple Config | TJESA',
  description: 'Manage your TJESA account, Notion connections, appearance, and preferences.',
};

export default async function SettingsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <div className="hieroglyph-bg" />
      <SettingsClient user={user} />
    </main>
  );
}
