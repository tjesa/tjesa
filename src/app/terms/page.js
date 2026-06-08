import Link from 'next/link';

export const metadata = {
  title: "Terms of Service | TJESA Suite",
  description: "TJESA Suite terms of service, usage guidelines, and service agreement.",
};

export default function TermsPage() {
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
            Rules of Engagement
          </span>
          <h1 style={{ fontSize: 'clamp(28px, 5vw, 42px)', fontFamily: 'var(--font-headings)', textTransform: 'uppercase', marginTop: '8px', marginBottom: '12px', letterSpacing: '0.05em' }}>
            Terms of Service
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
              1. Acceptance of Terms
            </h2>
            <p style={{ margin: 0 }}>
              By entering our sanctuary and invoking the TJESA SaaS instruments, you agree to comply with and be bound by these Terms of Service. If you do not agree to these terms, you must step back from our portal gateway.
            </p>
          </div>

          <div>
            <h2 style={{ fontSize: '18px', fontFamily: 'var(--font-headings)', color: 'var(--gold)', textTransform: 'uppercase', margin: '0 0 12px 0', letterSpacing: '0.05em' }}>
              2. Permitted Use of Instruments
            </h2>
            <p style={{ margin: 0 }}>
              You may use our forms, QR generator, charts, CMS publisher, and other instruments solely to process data from databases you have legal authority to access. Any usage to disrupt, hijack, or scrape public Notion databases is strictly forbidden and will result in gateway exclusion.
            </p>
          </div>

          <div>
            <h2 style={{ fontSize: '18px', fontFamily: 'var(--font-headings)', color: 'var(--gold)', textTransform: 'uppercase', margin: '0 0 12px 0', letterSpacing: '0.05em' }}>
              3. Gateway Accounts & Notion Connections
            </h2>
            <p style={{ margin: 0 }}>
              You are responsible for safeguarding your Notion integration keys, passwords, and security tokens. TJESA is not responsible for data modifications, deletions, or configuration errors that occur within your linked Notion workspaces.
            </p>
          </div>

          <div>
            <h2 style={{ fontSize: '18px', fontFamily: 'var(--font-headings)', color: 'var(--gold)', textTransform: 'uppercase', margin: '0 0 12px 0', letterSpacing: '0.05em' }}>
              4. Disclaimer of Warranty
            </h2>
            <p style={{ margin: 0 }}>
              Our instruments are provided &quot;as is&quot; and &quot;as available&quot;. We do not guarantee uninterrupted gateway synchronization, nor do we assume responsibility for Notion API disruptions, connection timeouts, or service downtime.
            </p>
          </div>

          <div>
            <h2 style={{ fontSize: '18px', fontFamily: 'var(--font-headings)', color: 'var(--gold)', textTransform: 'uppercase', margin: '0 0 12px 0', letterSpacing: '0.05em' }}>
              5. Terminations
            </h2>
            <p style={{ margin: 0 }}>
              We reserve the right to sever gateway connections and deactivate database configuration records for users who breach these terms or abuse API request limits.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
