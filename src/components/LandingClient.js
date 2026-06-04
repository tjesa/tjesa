'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import GlowingCard from './GlowingCard';
import EyeOfHorusLoader from './EyeOfHorusLoader';

export default function LandingClient({ oauthUrl }) {
  const router = useRouter();
  
  // Waitlist States
  const [email, setEmail] = useState('');
  const [waitlistLoading, setWaitlistLoading] = useState(false);
  const [waitlistSuccess, setWaitlistSuccess] = useState(false);
  const [waitlistError, setWaitlistError] = useState('');

  // Portal Modal States
  const [portalOpen, setPortalOpen] = useState(false);
  const [token, setToken] = useState('');
  const [logoClicks, setLogoClicks] = useState(0); // Secret portal clicks counter

  const handleLogoClick = () => {
    setLogoClicks(prev => {
      const nextClicks = prev + 1;
      if (nextClicks >= 3) {
        triggerBypass();
        return 0; // reset
      }
      return nextClicks;
    });
  };

  const triggerBypass = async () => {
    try {
      const response = await fetch('/api/auth/bypass', { method: 'POST' });
      if (response.ok) {
        router.push('/dashboard');
      } else {
        setPortalOpen(true);
      }
    } catch (err) {
      console.error('[Tjesa Bypass Error]:', err);
      setPortalOpen(true);
    }
  };
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Handle Waitlist Submit
  const handleWaitlistSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setWaitlistLoading(true);
    setWaitlistError('');

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok) {
        setWaitlistSuccess(true);
        setEmail('');
      } else {
        setWaitlistError(data.error || 'Failed to join waitlist.');
      }
    } catch (err) {
      setWaitlistError('An ancient curse disrupted the connection. Try again.');
      console.error(err);
    } finally {
      setWaitlistLoading(false);
    }
  };

  // Handle Developer Token Submit
  const handleTokenSubmit = async (e) => {
    e.preventDefault();
    if (!token) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (response.ok) {
        setPortalOpen(false);
        router.push('/dashboard');
      } else {
        setError(data.error || 'Failed to bind token.');
      }
    } catch (err) {
      setError('Connection disrupted. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      minHeight: '100vh',
      padding: '80px 24px 40px 24px',
      position: 'relative',
      zIndex: 1
    }}>
      {/* Main Waitlist Hero */}
      <div style={{ textAlign: 'center', maxWidth: '650px', marginBottom: '48px' }}>
        <div 
          id="ankh-logo"
          onClick={handleLogoClick}
          style={{ display: 'inline-block', marginBottom: '16px', cursor: 'default' }}
        >
          {/* Logo SVG: Interlocking Notion-style blocks forming a tie/knot */}
          <svg width="64" height="64" viewBox="0 0 52 52" fill="none" style={{ filter: 'drop-shadow(0 0 12px var(--gold-glow))' }}>
            <rect x="4" y="4" width="20" height="20" rx="3" fill="none" stroke="#C9A84C" strokeWidth="1.5" />
            <rect x="28" y="4" width="20" height="20" rx="3" fill="none" stroke="#C9A84C" strokeWidth="1.5" />
            <rect x="4" y="28" width="20" height="20" rx="3" fill="none" stroke="#8C6E2E" strokeWidth="1.5" />
            <rect x="28" y="28" width="20" height="20" rx="3" fill="none" stroke="#8C6E2E" strokeWidth="1.5" />
            <path d="M24 14 L28 14 M24 38 L28 38 M14 24 L14 28 M38 24 L38 28" stroke="#C9A84C" strokeWidth="2" strokeLinecap="round" />
            <circle cx="26" cy="26" r="3" fill="#C9A84C" />
            <circle cx="26" cy="26" r="1.5" fill="#0A0A0B" />
          </svg>
        </div>
        
        <h1 className="animate-glow" style={{ 
          fontSize: '3.8rem', 
          fontFamily: 'var(--font-headings)', 
          background: 'linear-gradient(180deg, #FFDF73 0%, #D4AF37 50%, #AA8928 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          lineHeight: 1,
          letterSpacing: '0.15em',
          marginBottom: '16px'
        }}>
          TJESA
        </h1>
        
        <p style={{ 
          fontSize: '18px', 
          color: 'var(--sand)', 
          letterSpacing: '0.05em', 
          fontFamily: 'var(--font-headings)',
          lineHeight: 1.4,
          marginBottom: '16px'
        }}>
          The Ultimate Notion Integration Suite
        </p>

        <p style={{ fontSize: '14px', color: 'var(--sand-dim)', lineHeight: '1.6', marginBottom: '32px' }}>
          Generate custom public web forms, visual observatory chart dashboards, and dynamic styled QR codes mapped directly to your Notion database scrolls.
        </p>

        {/* Waitlist Sign-up Box */}
        <div style={{
          background: 'var(--obsidian-card)',
          border: '1px solid rgba(212,175,55,0.18)',
          borderRadius: '12px',
          padding: '28px 24px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 15px rgba(212, 175, 55, 0.05)',
          maxWidth: '500px',
          width: '100%',
          margin: '0 auto',
          position: 'relative'
        }}>
          {waitlistSuccess ? (
            <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>✨</div>
              <h3 style={{ fontFamily: 'var(--font-headings)', color: 'var(--gold)', fontSize: '18px', textTransform: 'uppercase', marginBottom: '8px' }}>
                Carved in the Cartouche
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--sand-dim)', lineHeight: 1.5 }}>
                Your email is safely recorded in our archives. You will receive an exclusive scroll notification the moment the gateway launches.
              </p>
            </div>
          ) : (
            <form onSubmit={handleWaitlistSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <input 
                  type="email"
                  className="kemet-input"
                  placeholder="Enter your email to join waitlist"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{ flex: 1, minWidth: '220px', padding: '10px 14px', fontSize: '14px' }}
                />
                <button 
                  type="submit" 
                  className="kemet-btn" 
                  disabled={waitlistLoading || !email}
                  style={{ padding: '10px 24px', fontSize: '12px', height: 'auto', minHeight: 'unset' }}
                >
                  {waitlistLoading ? 'Joining...' : 'Carve My Place'}
                </button>
              </div>

              {waitlistError && (
                <div style={{
                  padding: '10px',
                  background: 'rgba(168, 36, 36, 0.08)',
                  border: '1px solid var(--scarab-red)',
                  borderRadius: '6px',
                  color: '#FF7F7F',
                  fontSize: '12px',
                  textAlign: 'left'
                }}>
                  ⚠️ {waitlistError}
                </div>
              )}

              <span style={{ fontSize: '11px', color: 'var(--sand-dark)', letterSpacing: '0.05em' }}>
                ⚡ Join 420+ architects waiting for the launch.
              </span>
            </form>
          )}
        </div>
      </div>

      {/* Feature Showcase Grid */}
      <div style={{ maxWidth: '900px', width: '100%', marginTop: '32px' }}>
        <h3 style={{ 
          fontSize: '14px', 
          color: 'var(--gold)', 
          textAlign: 'center', 
          fontFamily: 'var(--font-headings)', 
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          marginBottom: '24px' 
        }}>
          Suite Instruments
        </h3>

        <div className="grid-cols-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', display: 'grid', gap: '24px' }}>
          {/* Feature 1 */}
          <GlowingCard title="The Nile Scribe" subtitle="FORM BUILDER">
            <p style={{ fontSize: '12px', lineHeight: 1.5, color: 'var(--sand-dim)' }}>
              Configure public-facing themed survey forms mapping directly to Notion columns. Form replies instantly create new rows/pages in your database.
            </p>
          </GlowingCard>

          {/* Feature 2 */}
          <GlowingCard title="The Glyph Carver" subtitle="QR CODE GENERATOR">
            <p style={{ fontSize: '12px', lineHeight: 1.5, color: 'var(--sand-dim)' }}>
              Translate URLs in Notion columns into custom-colored, brandable inline QR Code images. Supports instant button triggers or background automation.
            </p>
          </GlowingCard>

          {/* Feature 3 */}
          <GlowingCard title="The Aten Gazer" subtitle="CHARTS OBSERVATORY">
            <p style={{ fontSize: '12px', lineHeight: 1.5, color: 'var(--sand-dim)' }}>
              Transform dry Notion data columns into interactive charts (bar, pie, line) to track task status, finance metrics, or project progress.
            </p>
          </GlowingCard>
        </div>
      </div>

      {/* Secret Developer Portal Modal */}
      {portalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(7, 7, 6, 0.88)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          padding: '20px',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            background: 'var(--obsidian-mid)',
            border: '1px solid var(--gold)',
            borderRadius: '12px',
            maxWidth: '850px',
            width: '100%',
            boxShadow: '0 0 35px rgba(212, 175, 55, 0.3), 0 20px 40px rgba(0, 0, 0, 0.9)',
            position: 'relative',
            overflow: 'hidden',
            animation: 'scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}>
            {/* Top gold bar */}
            <div style={{ height: '4px', background: 'var(--gold-gradient)' }} />

            {/* Close Button */}
            <button 
              onClick={() => setPortalOpen(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'transparent',
                border: 'none',
                color: 'var(--sand-dim)',
                fontSize: '18px',
                cursor: 'pointer',
                transition: 'color 0.2s ease'
              }}
              onMouseOver={e => e.currentTarget.style.color = 'var(--gold)'}
              onMouseOut={e => e.currentTarget.style.color = 'var(--sand-dim)'}
            >
              ✕
            </button>

            {/* Portal Content */}
            <div style={{ padding: '32px 24px' }}>
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <h3 style={{ 
                  fontSize: '22px', 
                  color: 'var(--gold)', 
                  fontFamily: 'var(--font-headings)', 
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em'
                }}>
                  Architect Portal Gateway
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--sand-dark)', marginTop: '4px' }}>
                  Manage database bindings and integrations with Tjesa
                </p>
              </div>

              {isLoading ? (
                <div style={{ padding: '40px 0' }}>
                  <EyeOfHorusLoader text="Aligning the Stars..." />
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                  {/* OAuth Portal Card */}
                  <GlowingCard 
                    title="The Golden Portal" 
                    subtitle="Official OAuth 2.0 gateway linkage"
                    style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                  >
                    <p style={{ marginBottom: '24px', fontSize: '13px', lineHeight: 1.5, color: 'var(--sand-dim)' }}>
                      Connect your workspaces officially. This authorizes Tjesa to securely view data structures and sync columns under your permission.
                    </p>
                    <div style={{ marginTop: 'auto' }}>
                      <a href={oauthUrl} className="kemet-btn" style={{ width: '100%', justifyContent: 'center', padding: '10px 0', fontSize: '12px' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
                        </svg>
                        Open OAuth Gateway
                      </a>
                    </div>
                  </GlowingCard>

                  {/* Manual Token Card */}
                  <GlowingCard 
                    title="The Secret Key" 
                    subtitle="Direct bind via internal secret token"
                  >
                    <form onSubmit={handleTokenSubmit} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                      <p style={{ marginBottom: '16px', fontSize: '13px', lineHeight: 1.5, color: 'var(--sand-dim)' }}>
                        Paste your Notion internal integration token (e.g. <code style={{ color: 'var(--gold)', background: 'rgba(212,175,55,0.05)', padding: '2px 4px', borderRadius: '4px' }}>secret_...</code>) below.
                      </p>
                      
                      <div style={{ marginBottom: '16px' }}>
                        <label className="kemet-label" htmlFor="secret-token" style={{ fontSize: '11px' }}>SECRET INTEGRATION KEY</label>
                        <input 
                          id="secret-token"
                          className="kemet-input" 
                          type="password" 
                          placeholder="secret_HzLx..." 
                          value={token} 
                          onChange={(e) => setToken(e.target.value)}
                          style={{ padding: '8px 12px', fontSize: '13px', letterSpacing: token ? '0.25em' : 'normal' }}
                        />
                      </div>

                      {error && (
                        <div style={{
                          padding: '10px',
                          background: 'rgba(168, 36, 36, 0.08)',
                          border: '1px solid var(--scarab-red)',
                          borderRadius: '6px',
                          color: '#FF7F7F',
                          fontSize: '12px',
                          marginBottom: '16px'
                        }}>
                          {error}
                        </div>
                      )}

                      <button 
                        type="submit" 
                        className="kemet-btn-secondary" 
                        style={{ width: '100%', justifyContent: 'center', marginTop: 'auto', padding: '9px 0', fontSize: '12px' }}
                        disabled={!token}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <polyline points="14 2 14 8 20 8"/>
                          <line x1="16" y1="13" x2="8" y2="13"/>
                          <line x1="16" y1="17" x2="8" y2="17"/>
                        </svg>
                        Bind Secret Key
                      </button>
                    </form>
                  </GlowingCard>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ 
        marginTop: '60px', 
        fontSize: '11px', 
        color: 'var(--sand-dark)', 
        letterSpacing: '0.15em', 
        fontFamily: 'var(--font-headings)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <span>TJESA SUITE</span>
        <span>•</span>
        <span>CARVED IN EGYPT</span>
        <span>•</span>
        <span>© 2026</span>
      </div>
    </div>
  );
}
