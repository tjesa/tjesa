import { notFound } from 'next/navigation';
import PublicFormClient from '@/components/tools/PublicFormClient';
import { getConfig } from '@/lib/db';

export default async function PublicFormPage({ params }) {
  // Wait for dynamic params
  const { id } = await params;

  if (!id) {
    notFound();
  }

  // Retrieve form config
  const config = await getConfig(id);

  if (!config || !config.active || config.tool !== 'form_builder') {
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
            SCROLL NOT FOUND
          </h1>
          <p style={{ color: '#C2A67D', fontSize: '14px', lineHeight: 1.6 }}>
            The Nile Scribe cannot locate this document scroll. It may have been retracted by the scribe or the sanctuary gate has closed.
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
            onMouseOver={e => { e.target.style.background = 'rgba(212, 175, 55, 0.1)'; }}
            onMouseOut={e => { e.target.style.background = 'transparent'; }}
          >
            Return to Sanctuary
          </a>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Hieroglyphic background watermark */}
      <div className="hieroglyph-bg" />
      <PublicFormClient config={config} />
    </main>
  );
}
