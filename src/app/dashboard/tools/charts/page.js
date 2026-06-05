import { cookies } from 'next/headers';
import ChartsWorkspaceClient from '@/components/tools/ChartsWorkspaceClient';
import { getAccount, getConfigs } from '@/lib/db';

export default async function ChartsPage() {
  const cookieStore = await cookies();
  const workspaceId = cookieStore.get('tjesa_workspace_id')?.value;

  let account = null;
  if (workspaceId) {
    account = await getAccount(`${workspaceId}_charts`);
    if (!account) {
      account = await getAccount(workspaceId);
    }
  }

  const clientId = process.env.NOTION_CHARTS_CLIENT_ID || process.env.NOTION_CLIENT_ID;
  const redirectUri = process.env.NOTION_CHARTS_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/charts`;
  const oauthUrl = `https://api.notion.com/v1/oauth/authorize?client_id=${clientId}&response_type=code&owner=user&redirect_uri=${encodeURIComponent(redirectUri)}`;

  if (!account) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <div className="hieroglyph-bg" />
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 24px',
          textAlign: 'center',
          gap: '24px'
        }}>
          {/* Tool Icon */}
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, rgba(212,175,55,0.15) 0%, rgba(212,175,55,0.05) 100%)',
            border: '1px solid rgba(212,175,55,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '36px',
            boxShadow: '0 0 30px rgba(212,175,55,0.1)'
          }}>
            ☀️
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '480px' }}>
            <span style={{ fontSize: '11px', color: 'var(--gold)', letterSpacing: '0.2em', fontFamily: 'var(--font-headings)' }}>
              ATEN GAZER — NOTION CONNECTION
            </span>
            <h2 style={{ fontSize: '28px', textTransform: 'uppercase', margin: 0 }}>
              Connect Your Charts Observatory
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--sand-dim)', lineHeight: '1.6' }}>
              The Charts Observatory uses its own dedicated Notion integration connection.
              Connect it to grant access to the database scrolls you want to visualize.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '360px' }}>
            <a
              id="charts-connect-notion-btn"
              href={oauthUrl}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                padding: '14px 24px',
                background: 'var(--gold-gradient)',
                color: '#0D0D0B',
                borderRadius: '8px',
                fontFamily: 'var(--font-headings)',
                fontWeight: '700',
                fontSize: '13px',
                letterSpacing: '0.08em',
                textDecoration: 'none',
                boxShadow: '0 4px 20px rgba(212,175,55,0.3)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 100 100" fill="currentColor">
                <path d="M6.017 4.313l55.333-4.087c6.797-.583 8.543-.194 12.829 2.912l17.68 12.437c2.912 2.037 3.889 2.524 3.889 4.657v68.237c0 3.694-1.359 5.834-6.017 6.22l-64.04 3.889c-3.5.193-5.248-.391-7.09-2.718L4.99 84.013C2.659 80.81 1.5 78.476 1.5 75.76V10.138c0-3.5 1.359-6.025 4.517-5.825z"/>
              </svg>
              Connect with Notion
            </a>
            <p style={{ fontSize: '11px', color: 'var(--sand-dark)', margin: 0 }}>
              You'll be redirected to Notion to authorize access. This is separate from other tool connections.
            </p>
          </div>
        </div>
      </main>
    );
  }

  // Get existing configurations for this workspace
  let configs = [];
  if (workspaceId) {
    // Check both potential workspace_id keys due to tool specific or manual connections
    const toolConfigs = await getConfigs(`${workspaceId}_charts`);
    const generalConfigs = await getConfigs(workspaceId);
    configs = [...toolConfigs, ...generalConfigs];
  }
  
  // Filter for charts configurations
  const chartsConfigs = configs.filter(c => c.tool === 'charts_observatory');

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Ancient Egypt hieroglyphic watermark */}
      <div className="hieroglyph-bg" />
      <ChartsWorkspaceClient account={account} initialConfigs={chartsConfigs} oauthUrl={oauthUrl} />
    </main>
  );
}
