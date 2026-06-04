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
          {/* Logo SVG: Elegant Golden Pyramid + Ankh */}
          <svg width="36" height="36" viewBox="0 0 32 32" fill="none" style={{ filter: 'drop-shadow(0 0 8px var(--gold-glow))' }}>
            {/* Pyramid outline */}
            <path d="M16 3 L29 25 L3 25 Z" stroke="var(--gold)" strokeWidth="2.5" strokeLinejoin="round" />
            {/* Horizon sand line */}
            <path d="M1 28 L31 28" stroke="var(--sand-dim)" strokeWidth="1" strokeLinecap="round" />
            {/* Inner Ankh */}
            <path d="M16 11 A 2.5 2.5 0 0 0 16 16 L16 21 M13 18 L19 18" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" />
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
