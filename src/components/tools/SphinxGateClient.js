'use client';

import React, { useState } from 'react';

export default function SphinxGateClient({ configId, gateType, siteTitle }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');

  const handleUnlock = async (e) => {
    e.preventDefault();
    setIsVerifying(true);
    setError('');

    if (!password.trim()) {
      setError('You must enter the gate password.');
      setIsVerifying(false);
      return;
    }

    if (gateType === 'email_whitelist' && !email.trim()) {
      setError('You must specify an authorized email address.');
      setIsVerifying(false);
      return;
    }

    try {
      const response = await fetch('/api/tools/sphinx/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          configId,
          password: password.trim(),
          email: email.trim()
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Reload to let Next.js render the authenticated page
        window.location.reload();
      } else {
        setError(data.error || 'Failed to authenticate.');
      }
    } catch (err) {
      setError('Connection disrupted. Try again.');
      console.error(err);
    } finally {
      setIsVerifying(false);
    }
  };

  const isEmailRequired = gateType === 'email_whitelist';

  return (
    <div style={{
      width: '100%',
      maxWidth: '420px',
      padding: '24px',
      boxSizing: 'border-box',
      fontFamily: "var(--font-body), Outfit, sans-serif"
    }}>
      <div style={{
        background: 'rgba(20, 19, 17, 0.9)',
        border: '1px solid rgba(212, 175, 55, 0.35)',
        borderRadius: '12px',
        padding: '40px 32px',
        boxShadow: '0 15px 40px rgba(0,0,0,0.8), 0 0 25px rgba(212, 175, 55, 0.1)',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        
        {/* Hieroglyphic Background */}
        <div className="hieroglyph-bg" style={{ opacity: 0.03 }} />

        {/* Lock SVG */}
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          background: 'rgba(212, 175, 55, 0.05)',
          border: '1px solid rgba(212, 175, 55, 0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
          boxShadow: '0 0 20px rgba(212, 175, 55, 0.15)',
          animation: 'eyePulse 3s infinite ease-in-out'
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>

        {/* Title */}
        <div style={{ marginBottom: '24px' }}>
          <span style={{ fontSize: '11px', color: 'var(--gold)', letterSpacing: '0.2em', fontFamily: 'var(--font-headings)', textTransform: 'uppercase' }}>
            Sphinx Shield Gate
          </span>
          <h2 style={{ fontSize: '24px', textTransform: 'uppercase', color: 'var(--sand-light)', margin: '6px 0 0', fontFamily: 'var(--font-headings)' }}>
            Vault Gated
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--sand-dim)', marginTop: '8px', lineHeight: 1.5 }}>
            Access to <strong>{siteTitle}</strong> is secured. Enter the required keys to proceed.
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            color: '#F87171',
            padding: '10px 12px',
            borderRadius: '6px',
            marginBottom: '20px',
            fontSize: '12px',
            textAlign: 'left'
          }}>
            Error: {error}
          </div>
        )}

        <form onSubmit={handleUnlock} style={{ display: 'flex', flexDirection: 'column', gap: '18px', textAlign: 'left' }}>
          {isEmailRequired && (
            <div>
              <label className="kemet-label" style={{ fontSize: '11px' }}>Authorized Email Address</label>
              <input
                type="email"
                className="kemet-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="client@company.com"
                required
                style={{ fontSize: '14px', padding: '10px 12px' }}
              />
            </div>
          )}

          <div>
            <label className="kemet-label" style={{ fontSize: '11px' }}>Gate Password</label>
            <input
              type="password"
              className="kemet-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{ fontSize: '14px', padding: '10px 12px' }}
            />
          </div>

          <button
            type="submit"
            className="kemet-btn"
            disabled={isVerifying}
            style={{
              width: '100%',
              justifyContent: 'center',
              padding: '12px 20px',
              fontSize: '13px',
              marginTop: '8px',
              fontFamily: 'var(--font-headings)'
            }}
          >
            {isVerifying ? 'Decrypting...' : 'Unlock Gate'}
          </button>
        </form>

        <div style={{
          marginTop: '28px',
          fontSize: '9px',
          color: 'var(--sand-dark)',
          letterSpacing: '0.15em',
          fontFamily: 'var(--font-headings)'
        }}>
          POWERED BY SPHINX SHIELD
        </div>

      </div>
    </div>
  );
}
