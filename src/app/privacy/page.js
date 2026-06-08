import Link from 'next/link';

export const metadata = {
  title: "Privacy Policy | TJESA Suite",
  description: "TJESA Suite privacy policy, data practices, and security measures.",
};

export default function PrivacyPage() {
  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', padding: '80px 24px' }}>
      <div className="hieroglyph-bg" />
      
      <div className="container" style={{ maxWidth: '800px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        {/* Return Button */}
        <style dangerouslySetInnerHTML={{ __html: `
          .return-link {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            color: var(--gold);
            text-decoration: none;
            font-size: 12px;
            font-family: var(--font-headings);
            letter-spacing: 0.1em;
            margin-bottom: 40px;
            transition: opacity 0.2s ease;
          }
          .return-link:hover {
            opacity: 0.8;
          }
        ` }} />
        <Link href="/" className="return-link">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Return to Sanctuary
        </Link>

        {/* Header Block */}
        <div style={{ marginBottom: '40px' }}>
          <span style={{ fontSize: '11px', color: 'var(--gold)', letterSpacing: '0.25em', fontFamily: 'var(--font-headings)', textTransform: 'uppercase' }}>
            Sacred Covenant
          </span>
          <h1 style={{ fontSize: 'clamp(28px, 5vw, 42px)', fontFamily: 'var(--font-headings)', textTransform: 'uppercase', marginTop: '8px', marginBottom: '12px', letterSpacing: '0.05em' }}>
            Privacy Policy
          </h1>
          <p style={{ color: 'var(--sand-dim)', fontSize: '13px', fontFamily: 'var(--font-body)', margin: 0 }}>
            Last engraved: June 8, 2026
          </p>
        </div>

        {/* Scroll Content Card */}
        <div style={{
          background: 'rgba(13, 13, 11, 0.65)',
          border: '1px solid rgba(212, 175, 55, 0.15)',
          borderRadius: '16px',
          padding: '40px 32px',
          backdropFilter: 'blur(12px)',
          fontFamily: 'var(--font-body)',
          color: 'var(--sand-light)',
          lineHeight: '1.75',
          fontSize: '15px',
          display: 'flex',
          flexDirection: 'column',
          gap: '28px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
        }}>
          <div>
            <h2 style={{ fontSize: '18px', fontFamily: 'var(--font-headings)', color: 'var(--gold)', textTransform: 'uppercase', margin: '0 0 12px 0', letterSpacing: '0.05em' }}>
              1. The Scrolls of Information We Collect
            </h2>
            <p style={{ margin: 0 }}>
              We collect information that you carve into our waitlist forms, including your email address, full name, and your preference for our tools. If you link your Notion workspace with our gateway, we store access credentials securely to perform database sync actions.
            </p>
          </div>

          <div>
            <h2 style={{ fontSize: '18px', fontFamily: 'var(--font-headings)', color: 'var(--gold)', textTransform: 'uppercase', margin: '0 0 12px 0', letterSpacing: '0.05em' }}>
              2. How We Safeguard Your Records
            </h2>
            <p style={{ margin: 0 }}>
              All database records and Notion integration tokens are encrypted in transit and at rest using banking-grade security mechanisms. The Sphinx Shield secures your chambers, whitelists, and client configurations, keeping access locked strictly to designated entities.
            </p>
          </div>

          <div>
            <h2 style={{ fontSize: '18px', fontFamily: 'var(--font-headings)', color: 'var(--gold)', textTransform: 'uppercase', margin: '0 0 12px 0', letterSpacing: '0.05em' }}>
              3. Share of Scrolls and Data
            </h2>
            <p style={{ margin: 0 }}>
              Your personal records are never rented, sold, or distributed to third-party marketplaces. We only process information internally to facilitate the features you opt-in to use, such as generating forms, charts, CMS content, and security gates.
            </p>
          </div>

          <div>
            <h2 style={{ fontSize: '18px', fontFamily: 'var(--font-headings)', color: 'var(--gold)', textTransform: 'uppercase', margin: '0 0 12px 0', letterSpacing: '0.05em' }}>
              4. Your Sovereign Rights
            </h2>
            <p style={{ margin: 0 }}>
              You hold full sovereignty over your database scrolls. You may disconnect your Notion integrations, modify your configurations, or ask us to permanently delete your registration records from the waitlist registry at any time.
            </p>
          </div>

          <div>
            <h2 style={{ fontSize: '18px', fontFamily: 'var(--font-headings)', color: 'var(--gold)', textTransform: 'uppercase', margin: '0 0 12px 0', letterSpacing: '0.05em' }}>
              5. Updates to the Covenant
            </h2>
            <p style={{ margin: 0 }}>
              As we carve new instruments and expand our sanctuary, we may update this covenant. Any revisions will be reflected here with an updated &quot;Last engraved&quot; timestamp at the top of the scroll.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
