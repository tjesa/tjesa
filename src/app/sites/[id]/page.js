import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import PublicSiteClient from '@/components/tools/PublicSiteClient';
import SphinxGateClient from '@/components/tools/SphinxGateClient';
import { getConfig } from '@/lib/db';
import { validateGateSession } from '@/lib/gate';

export default async function PublicSitePage({ params }) {
  const { id } = await params;

  if (!id) {
    notFound();
  }

  // Retrieve publisher config
  const config = await getConfig(id);

  if (!config || !config.active || config.tool !== 'papyrus_publisher') {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#0D0D0B', color: '#F2E3C9', padding: '24px' }}>
        <div style={{
          textAlign: 'center',
          maxWidth: '500px',
          border: '1px solid rgba(212, 175, 55, 0.25)',
          borderRadius: '12px',
          padding: '40px 24px',
          background: 'rgba(20, 19, 17, 0.75)',
          boxShadow: '0 0 20px rgba(212, 175, 55, 0.1)'
        }}>
          <h1 style={{ fontFamily: 'Cinzel, Times New Roman, serif', color: '#D4AF37', fontSize: '24px', marginBottom: '16px' }}>
            PUBLICATION RETRACTED
          </h1>
          <p style={{ color: '#C2A67D', fontSize: '14px', lineHeight: 1.6 }}>
            This papyrus scroll is no longer broadcasted. It may have been dissolved by the architect or access permissions have expired.
          </p>
          <a 
            href="/" 
            style={{ 
              display: 'inline-block', 
              marginTop: '24px', 
              color: '#D4AF37', 
              textDecoration: 'none', 
              fontWeight: 'bold', 
              fontSize: '13px',
              fontFamily: 'Cinzel, serif',
              letterSpacing: '0.05em',
              border: '1px solid #D4AF37',
              padding: '8px 24px',
              borderRadius: '4px',
              transition: 'all 0.3s ease'
            }}
          >
            Return to Sanctuary
          </a>
        </div>
      </main>
    );
  }

  // Gate Check
  if (config.settings?.gate_active) {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(`tjesa_gate_session_${id}`)?.value;
    if (!validateGateSession(sessionToken, config)) {
      return (
        <main style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#0D0D0B' }}>
          <SphinxGateClient configId={id} gateType={config.settings.gate_type} siteTitle={config.settings.site_title || config.database_name} />
        </main>
      );
    }
  }

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', backgroundColor: 'transparent' }}>
      <PublicSiteClient configId={id} />
    </main>
  );
}
