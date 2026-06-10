import { cookies } from 'next/headers';
import SphinxWorkspaceClient from '@/components/tools/SphinxWorkspaceClient';
import { getAccount, getConfigs } from '@/lib/db';

export default async function SphinxPage() {
  const cookieStore = await cookies();
  const workspaceId = cookieStore.get('tjesa_workspace_id')?.value;

  let account = null;
  if (workspaceId) {
    account = await getAccount(`${workspaceId}_sphinx`);
    if (!account) {
      account = await getAccount(workspaceId);
    }
  }

  const clientId = process.env.NOTION_SPHINX_CLIENT_ID || process.env.NOTION_CLIENT_ID;
  const redirectUri = process.env.NOTION_SPHINX_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/sphinx`;
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
            boxShadow: '0 0 30px rgba(212,175,55,0.1)'
          }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.5">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '480px' }}>
            <span style={{ fontSize: '11px', color: 'var(--gold)', letterSpacing: '0.2em', fontFamily: 'var(--font-headings)' }}>
              PORTAL SECURITY & VAULTS
            </span>
            <h2 style={{ fontSize: '28px', textTransform: 'uppercase', margin: 0 }}>
              Connect Your Shield Chambers
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--sand-dim)', lineHeight: '1.6' }}>
              Portal Security uses a dedicated Notion integration connection.
              Connect it to grant access to the database scrolls you wish to safeguard.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '360px' }}>
            <a
              id="sphinx-connect-notion-btn"
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
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.139c-.093-.514.28-.887.747-.933zM1.936 1.035l13.31-.98c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.934.653.934 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.447-1.632z"/>
              </svg>
              Connect with Notion
            </a>
            <p style={{ fontSize: '11px', color: 'var(--sand-dark)', margin: 0 }}>
              You will choose which page scrolls or databases to bind with the security integration.
            </p>
          </div>
        </div>
      </main>
    );
  }

  // Load configs across all tools in this workspace
  let configs = [];
  if (workspaceId) {
    const qrConfigs = await getConfigs(`${workspaceId}_qr`);
    const formsConfigs = await getConfigs(`${workspaceId}_forms`);
    const chartsConfigs = await getConfigs(`${workspaceId}_charts`);
    const publisherConfigs = await getConfigs(`${workspaceId}_publisher`);
    const baseConfigs = await getConfigs(workspaceId);

    const merged = [...qrConfigs, ...formsConfigs, ...chartsConfigs, ...publisherConfigs, ...baseConfigs];
    const uniqueMap = new Map();
    merged.forEach(c => {
      uniqueMap.set(c.id, c);
    });
    configs = Array.from(uniqueMap.values());
  }

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <div className="hieroglyph-bg" />
      <SphinxWorkspaceClient account={account} initialConfigs={configs} oauthUrl={oauthUrl} />
    </main>
  );
}
