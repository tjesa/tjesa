import Link from 'next/link';

export const metadata = {
  title: "Cookie Policy",
  description: "Learn about the cookies, tracking identifiers, and browser storage preferences used across the Tjesa suite.",
};

export default function CookiesPage() {
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
            Tracking & Declared Cookies
          </span>
          <h1 style={{ fontSize: 'clamp(28px, 5vw, 42px)', fontFamily: 'var(--font-headings)', textTransform: 'uppercase', marginTop: '8px', marginBottom: '12px', letterSpacing: '0.05em' }}>
            Cookie Policy
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
              1. What are Cookies?
            </h2>
            <p style={{ margin: 0 }}>
              Cookies are small fragments of data stored on your browser when you visit websites. We use them to optimize page load speeds, retain your theme preferences, and track active sessions on the dashboard gateway.
            </p>
          </div>

          <div>
            <h2 style={{ fontSize: '18px', fontFamily: 'var(--font-headings)', color: 'var(--gold)', textTransform: 'uppercase', margin: '0 0 12px 0', letterSpacing: '0.05em' }}>
              2. Essential Cookies
            </h2>
            <p style={{ margin: 0 }}>
              These cookies are strictly required to operate our dashboard session gates and keep you authenticated. They include session cookies for developer bypass access (<code>tjesa_bypass_active</code>) and tracking your current Notion workspace bounds (<code>tjesa_workspace_id</code>). These cookies do not require consent as they are necessary for technical features to function.
            </p>
          </div>

          <div>
            <h2 style={{ fontSize: '18px', fontFamily: 'var(--font-headings)', color: 'var(--gold)', textTransform: 'uppercase', margin: '0 0 12px 0', letterSpacing: '0.05em' }}>
              3. Preference Cookies
            </h2>
            <p style={{ margin: 0 }}>
              We store local configuration files in your browser&apos;s local storage (such as <code>tjesa_theme</code> and <code>tjesa_brightness</code>) to remember your dark/light brightness modes and Egyptian color palette preferences (Obsidian Gold, Lapis Blue, Emerald Green).
            </p>
          </div>

          <div>
            <h2 style={{ fontSize: '18px', fontFamily: 'var(--font-headings)', color: 'var(--gold)', textTransform: 'uppercase', margin: '0 0 12px 0', letterSpacing: '0.05em' }}>
              4. Analytics Cookies
            </h2>
            <p style={{ margin: 0 }}>
              We utilize Google Analytics (gtag.js) to understand how visitors explore our sanctuary. This tracking records aggregated visitor analytics to guide us on which instruments to build next. These cookies can be disabled via your browser&apos;s security/privacy preferences.
            </p>
          </div>

          <div>
            <h2 style={{ fontSize: '18px', fontFamily: 'var(--font-headings)', color: 'var(--gold)', textTransform: 'uppercase', margin: '0 0 12px 0', letterSpacing: '0.05em' }}>
              5. Controlling Cookies
            </h2>
            <p style={{ margin: 0 }}>
              You can configure your browser to decline cookies, block analytics trackers, or wipe existing cookies. Doing so will sign you out of active session gateways and reset your Egyptian palette theme settings to Obsidian default.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
