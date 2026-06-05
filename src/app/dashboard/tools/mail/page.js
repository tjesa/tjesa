import { cookies } from 'next/headers';
import MailWorkspaceClient from '@/components/tools/MailWorkspaceClient';
import { getAccount, getConfigs } from '@/lib/db';

export default async function MailPage() {
  const cookieStore = await cookies();
  const workspaceId = cookieStore.get('tjesa_workspace_id')?.value;

  let account = null;
  if (workspaceId) {
    account = await getAccount(`${workspaceId}_mail`);
    if (!account) {
      account = await getAccount(workspaceId);
    }
  }

  const clientId = process.env.NOTION_MAIL_CLIENT_ID || process.env.NOTION_CLIENT_ID;
  const redirectUri = process.env.NOTION_MAIL_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/mail`;
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
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '480px' }}>
            <span style={{ fontSize: '11px', color: 'var(--gold)', letterSpacing: '0.2em', fontFamily: 'var(--font-headings)' }}>
              THE NILE DISPATCH — MAIL MANAGER
            </span>
            <h2 style={{ fontSize: '28px', textTransform: 'uppercase', margin: 0 }}>
              Connect Your Mail Dispatch
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--sand-dim)', lineHeight: '1.6' }}>
              The Nile Dispatch uses a dedicated Notion integration connection.
              Connect it to grant access to the database contact list scrolls you wish to email.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '360px' }}>
            <a
              id="mail-connect-notion-btn"
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
              You will choose which contact page scrolls or databases to connect with the email integration.
            </p>
          </div>
        </div>
      </main>
    );
  }

  // Get configs for this workspace
  let configs = [];
  if (workspaceId) {
    const toolConfigs = await getConfigs(`${workspaceId}_mail`);
    const generalConfigs = await getConfigs(workspaceId);
    configs = [...toolConfigs, ...generalConfigs];
  }
  
  // Filter for mail configurations
  const mailConfigs = configs.filter(c => c.tool === 'mail_dispatcher');

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <div className="hieroglyph-bg" />
      <MailWorkspaceClient account={account} initialConfigs={mailConfigs} oauthUrl={oauthUrl} />
    </main>
  );
}
