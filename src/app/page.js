import { redirect } from 'next/navigation';
import LandingClient from '@/components/LandingClient';
import { getCurrentUser } from '@/lib/supabase/server';

export default async function LandingPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect('/dashboard');
  }

  const clientId = process.env.NOTION_CLIENT_ID;
  const redirectUri = process.env.NOTION_REDIRECT_URI;
  const oauthUrl = `https://api.notion.com/v1/oauth/authorize?client_id=${clientId}&response_type=code&owner=user&redirect_uri=${encodeURIComponent(redirectUri)}`;

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Ancient Egypt hieroglyphic watermark */}
      <div className="hieroglyph-bg" />
      <LandingClient oauthUrl={oauthUrl} />
    </main>
  );
}
