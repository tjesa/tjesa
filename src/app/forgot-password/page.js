'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

function TjesaLogo({ size = 48 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 52 52" fill="none" style={{ filter: 'drop-shadow(0 0 12px rgba(212,175,55,0.5))' }}>
      <rect x="4" y="4" width="20" height="20" rx="3" fill="none" stroke="#C9A84C" strokeWidth="1.5" />
      <rect x="28" y="4" width="20" height="20" rx="3" fill="none" stroke="#C9A84C" strokeWidth="1.5" />
      <rect x="4" y="28" width="20" height="20" rx="3" fill="none" stroke="#8C6E2E" strokeWidth="1.5" />
      <rect x="28" y="28" width="20" height="20" rx="3" fill="none" stroke="#8C6E2E" strokeWidth="1.5" />
      <path d="M24 14 L28 14 M24 38 L28 38 M14 24 L14 28 M38 24 L38 28" stroke="#C9A84C" strokeWidth="2" strokeLinecap="round" />
      <circle cx="26" cy="26" r="3" fill="#C9A84C" />
      <circle cx="26" cy="26" r="1.5" fill="#0A0A0B" />
    </svg>
  );
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
      } else {
        setError(data.error || 'Failed to dispatch the recovery scroll. Please check the email.');
      }
    } catch (err) {
      setError('An ancient curse disrupted the connection. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes authOrbFloat {
          0%, 100% { transform: translate(0, 0) scale(1); }
          40% { transform: translate(30px, -40px) scale(1.08); }
          70% { transform: translate(-20px, 20px) scale(0.95); }
        }
        @keyframes authPulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.04); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .auth-input-wrap {
          position: relative;
        }
        .auth-input-wrap .kemet-input {
          padding-left: 44px;
        }
        .auth-input-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--sand-dark);
          pointer-events: none;
          transition: color 0.2s ease;
        }
        .auth-input-wrap:focus-within .auth-input-icon {
          color: var(--gold);
        }
        .auth-split-left {
          display: none;
        }
        @media (min-width: 900px) {
          .auth-split-left {
            display: flex;
          }
          .auth-mobile-logo {
            display: none !important;
          }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      <main style={{
        minHeight: '100vh',
        display: 'flex',
        position: 'relative',
        overflow: 'hidden',
      }}>

        {/* ── LEFT BRAND PANEL ───────────────────────────────────────── */}
        <div
          className="auth-split-left"
          style={{
            width: '46%',
            flexShrink: 0,
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px 48px',
            background: 'linear-gradient(145deg, var(--obsidian-mid) 0%, var(--obsidian) 100%)',
            borderRight: '1px solid rgba(212,175,55,0.08)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Animated background orbs */}
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            <div style={{
              position: 'absolute', top: '15%', right: '10%',
              width: '340px', height: '340px', borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(212,175,55,0.09) 0%, transparent 70%)',
              animation: 'authOrbFloat 18s ease-in-out infinite',
            }} />
            <div style={{
              position: 'absolute', bottom: '20%', left: '5%',
              width: '280px', height: '280px', borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(30,70,138,0.1) 0%, transparent 70%)',
              animation: 'authOrbFloat 14s ease-in-out infinite reverse',
            }} />
          </div>

          <div className="hieroglyph-bg" style={{ opacity: 0.02 }} />

          {/* Content */}
          <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: '380px' }}>
            <div style={{ animation: 'authPulse 4s ease-in-out infinite', display: 'inline-block', marginBottom: '28px' }}>
              <TjesaLogo size={72} />
            </div>

            <h1 style={{
              fontSize: '42px',
              fontFamily: 'var(--font-headings)',
              background: 'linear-gradient(180deg, #FFDF73 0%, #D4AF37 50%, #AA8928 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '0.2em',
              marginBottom: '12px',
            }}>
              TJESA
            </h1>

            <p style={{
              fontSize: '13px',
              color: 'var(--sand)',
              fontFamily: 'var(--font-headings)',
              letterSpacing: '0.06em',
              lineHeight: 1.5,
              marginBottom: '40px',
            }}>
              The Pharaonic Notion Integration Suite
            </p>

            {/* Recovery context */}
            <div style={{ textAlign: 'left' }}>
              <p style={{ fontSize: '10px', color: 'var(--gold)', fontFamily: 'var(--font-headings)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '16px' }}>
                Sanctuary Lock Recovery
              </p>
              <div style={{
                display: 'flex',
                gap: '12px',
                marginBottom: '14px',
                padding: '12px 14px',
                background: 'rgba(212,175,55,0.04)',
                border: '1px solid rgba(212,175,55,0.08)',
                borderRadius: '8px',
              }}>
                <span style={{ fontSize: '18px', flexShrink: 0 }}>🔑</span>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--sand)', fontFamily: 'var(--font-headings)', letterSpacing: '0.04em', marginBottom: '2px' }}>Restore Key Access</div>
                  <div style={{ fontSize: '11px', color: 'var(--sand-dark)', lineHeight: 1.5 }}>Simply input your registered email address, and we will send you a link to reset your password.</div>
                </div>
              </div>
            </div>
          </div>

          <div style={{
            position: 'absolute', bottom: '24px', left: 0, right: 0,
            textAlign: 'center', fontSize: '10px', color: 'var(--sand-dark)',
            letterSpacing: '0.15em', fontFamily: 'var(--font-headings)',
          }}>
            CARVED IN EGYPT · © 2026
          </div>
        </div>

        {/* ── RIGHT FORM PANEL ──────────────────────────────────────── */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 32px',
          position: 'relative',
          background: 'var(--obsidian)',
          animation: 'slideInRight 0.5s ease both',
        }}>
          {/* Mobile logo */}
          <div style={{ marginBottom: '32px', textAlign: 'center' }} className="auth-mobile-logo">
            <Link href="/" style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
              <TjesaLogo size={44} />
              <span style={{ fontFamily: 'var(--font-headings)', fontSize: '14px', letterSpacing: '0.15em', color: 'var(--gold)' }}>TJESA</span>
            </Link>
          </div>

          <div style={{ width: '100%', maxWidth: '420px', position: 'relative' }}>
            {/* Top accent */}
            <div style={{ height: '3px', background: 'var(--gold-gradient)', borderRadius: '2px 2px 0 0' }} />

            <div style={{
              background: 'var(--obsidian-card)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(212,175,55,0.12)',
              borderTop: 'none',
              borderRadius: '0 0 12px 12px',
              padding: '36px 32px 32px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            }}>

              {success ? (
                /* ── Success State ────────────────────────────── */
                <div style={{ textAlign: 'center', padding: '16px 0', animation: 'fadeSlideUp 0.4s ease both' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>✉️</div>
                  <h2 style={{
                    fontFamily: 'var(--font-headings)',
                    fontSize: '22px',
                    background: 'var(--gold-gradient)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    marginBottom: '12px',
                  }}>
                    Scroll Dispatched
                  </h2>
                  <p style={{ fontSize: '13px', color: 'var(--sand-dim)', lineHeight: 1.7, marginBottom: '28px' }}>
                    If that email is registered in our archives, we have sent a secure recovery link to <strong style={{ color: 'var(--sand)' }}>{email}</strong>. Please check your inbox.
                  </p>
                  <Link href="/login" className="kemet-btn" style={{ display: 'flex', justifyContent: 'center', padding: '13px 0', fontSize: '13px', textDecoration: 'none', width: '100%' }}>
                    Return to Sanctuary Gate →
                  </Link>
                </div>
              ) : (
                /* ── Form ─────────────────────────────────────── */
                <>
                  <div style={{ marginBottom: '24px' }}>
                    <h2 style={{
                      fontSize: '24px',
                      fontFamily: 'var(--font-headings)',
                      background: 'var(--gold-gradient)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      margin: '0 0 6px',
                    }}>
                      Recover Access
                    </h2>
                    <p style={{ fontSize: '12px', color: 'var(--sand-dim)', margin: 0, letterSpacing: '0.03em' }}>
                      Request a token to restore your gateway credentials
                    </p>
                  </div>

                  {error && (
                    <div style={{
                      padding: '12px 14px',
                      background: 'rgba(168,36,36,0.08)',
                      border: '1px solid rgba(168,36,36,0.35)',
                      borderRadius: '8px',
                      color: '#FF7F7F',
                      fontSize: '12px',
                      lineHeight: 1.5,
                      marginBottom: '20px',
                      animation: 'fadeIn 0.2s ease-out',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                    }}>
                      <span style={{ flexShrink: 0 }}>⚠️</span>
                      <span>{error}</span>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    <div>
                      <label className="kemet-label" htmlFor="email">EMAIL ADDRESS</label>
                      <div className="auth-input-wrap">
                        <span className="auth-input-icon">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                            <polyline points="22,6 12,13 2,6" />
                          </svg>
                        </span>
                        <input
                          id="email"
                          type="email"
                          className="kemet-input"
                          placeholder="scribe@kemet.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          disabled={loading}
                          autoComplete="email"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="kemet-btn"
                      disabled={loading}
                      style={{ width: '100%', justifyContent: 'center', marginTop: '4px', padding: '13px 0', fontSize: '13px' }}
                    >
                      {loading ? (
                        <>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 1s linear infinite' }}>
                            <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" strokeOpacity="0.2" />
                            <path d="M21 12a9 9 0 0 0-9-9" strokeLinecap="round" />
                          </svg>
                          Summoning Link...
                        </>
                      ) : (
                        <>
                          Request Recovery Link
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                          </svg>
                        </>
                      )}
                    </button>
                  </form>

                  {/* Footer links */}
                  <div style={{
                    marginTop: '24px',
                    paddingTop: '20px',
                    borderTop: '1px solid rgba(212,175,55,0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '10px',
                  }}>
                    <Link href="/login" style={{
                      fontFamily: 'var(--font-headings)',
                      fontSize: '11px',
                      color: 'var(--gold)',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}>
                      ← Return to Login
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
