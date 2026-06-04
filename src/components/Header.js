import React from 'react';
import Link from 'next/link';

export default function Header({ account, onDisconnect }) {
  return (
    <header style={{
      borderBottom: '1px solid rgba(212, 175, 55, 0.2)',
      background: 'rgba(13, 13, 11, 0.8)',
      backdropFilter: 'blur(8px)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      padding: '16px 0',
      transition: 'var(--transition-smooth)'
    }}>
      <div className="container" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        {/* Logo */}
        <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}>
          {/* Logo SVG: Interlocking Notion-style blocks forming a tie/knot */}
          <svg width="36" height="36" viewBox="0 0 52 52" fill="none" style={{ filter: 'drop-shadow(0 0 8px var(--gold-glow))' }}>
            <rect x="4" y="4" width="20" height="20" rx="3" fill="none" stroke="#C9A84C" strokeWidth="1.5" />
            <rect x="28" y="4" width="20" height="20" rx="3" fill="none" stroke="#C9A84C" strokeWidth="1.5" />
            <rect x="4" y="28" width="20" height="20" rx="3" fill="none" stroke="#8C6E2E" strokeWidth="1.5" />
            <rect x="28" y="28" width="20" height="20" rx="3" fill="none" stroke="#8C6E2E" strokeWidth="1.5" />
            <path d="M24 14 L28 14 M24 38 L28 38 M14 24 L14 28 M38 24 L38 28" stroke="#C9A84C" strokeWidth="2" strokeLinecap="round" />
            <circle cx="26" cy="26" r="3" fill="#C9A84C" />
            <circle cx="26" cy="26" r="1.5" fill="#0A0A0B" />
          </svg>
          <div>
            <h1 style={{ fontSize: '20px', margin: 0, lineHeight: 1, letterSpacing: '0.15em' }}>TJESA</h1>
            <span style={{ fontSize: '9px', letterSpacing: '0.28em', color: 'var(--sand-dim)', textTransform: 'uppercase', display: 'block', marginTop: '2px' }}>
              Sacred SaaS Suite
            </span>
          </div>
        </Link>

        {/* Navigation & Connection Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {account ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                  <span style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: 'var(--scarab-green)',
                    boxShadow: '0 0 8px var(--scarab-green)'
                  }} />
                  <span style={{ fontSize: '11px', fontFamily: 'var(--font-headings)', color: 'var(--gold)', letterSpacing: '0.05em' }}>
                    ANKH GATEWAY ACTIVE
                  </span>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--sand-dim)', fontFamily: 'var(--font-body)' }}>
                  {account.workspace_name || 'Notion Workspace'}
                </span>
              </div>
              <button 
                onClick={onDisconnect}
                className="kemet-btn-secondary" 
                style={{ padding: '6px 14px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
              >
                Sever Connection
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: 'var(--scarab-red)',
                boxShadow: '0 0 8px var(--scarab-red)'
              }} />
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-headings)', color: 'var(--sand-dim)', letterSpacing: '0.05em' }}>
                GATEWAY RESTING
              </span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
