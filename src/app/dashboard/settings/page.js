import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/supabase/server';
import SettingsClient from '@/components/SettingsClient';

export const metadata = {
  title: 'Temple Config',
  description: 'Manage your Tjesa account, bind Notion connections, set app appearance, and customize preference parameters.',
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
