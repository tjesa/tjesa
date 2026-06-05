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

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [sessionExists, setSessionExists] = useState(false);
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password || !confirmPassword) return;

    if (password !== confirmPassword) {
      setError('The secret keys (passwords) do not match.');
      return;
    }

    if (password.length < 6) {
      setError('The secret key must be at least 6 glyphs (characters) long.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setSessionExists(data.sessionExists);
        setEmail('');
        setPassword('');
        setConfirmPassword('');
      } else {
        setError(data.error || 'Failed to record details in the cartouche.');
      }
    } catch (err) {
      setError('An ancient curse disrupted the connection. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = () => {
    if (!password) return { score: 0, label: '', color: 'transparent' };
    let score = 0;
    if (password.length >= 6) score += 1;
    if (password.length >= 10) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    if (score <= 2) return { score, label: 'Weak Glyph Strength', color: '#EF4444' };
    if (score <= 4) return { score, label: 'Fair Glyph Strength', color: '#F59E0B' };
    return { score, label: 'Strong Shield Active', color: '#10B981' };
  };

  const strength = getPasswordStrength();

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
          padding-right: 44px;
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
        .auth-toggle-visibility {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: var(--sand-dark);
          cursor: pointer;
          padding: 0;
          display: flex;
          alignItems: center;
          justifyContent: center;
          transition: color 0.2s ease;
        }
        .auth-toggle-visibility:hover {
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

            {/* Why join? */}
            <div style={{ textAlign: 'left' }}>
              <p style={{ fontSize: '10px', color: 'var(--gold)', fontFamily: 'var(--font-headings)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '16px' }}>
                What awaits inside
              </p>
              {[
                { icon: '⚡', title: 'Instant Setup', desc: 'Connect your Notion workspace and launch your first tool in under 5 minutes.' },
                { icon: '🔒', title: 'Secure by Design', desc: 'OAuth-protected connections. Your Notion data never leaves your workspace.' },
                { icon: '🎨', title: 'Full Customization', desc: 'Brand your forms, charts, and QR codes to match your style.' },
                { icon: '🌍', title: 'Public Sharing', desc: 'Share any output via a permanent public link — no login required for viewers.' },
              ].map(item => (
                <div key={item.title} style={{
                  display: 'flex',
                  gap: '12px',
                  marginBottom: '14px',
                  padding: '12px 14px',
                  background: 'rgba(212,175,55,0.04)',
                  border: '1px solid rgba(212,175,55,0.08)',
                  borderRadius: '8px',
                }}>
                  <span style={{ fontSize: '18px', flexShrink: 0 }}>{item.icon}</span>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--sand)', fontFamily: 'var(--font-headings)', letterSpacing: '0.04em', marginBottom: '2px' }}>{item.title}</div>
                    <div style={{ fontSize: '11px', color: 'var(--sand-dark)', lineHeight: 1.5 }}>{item.desc}</div>
                  </div>
                </div>
              ))}
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
          overflowY: 'auto',
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
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>📜</div>
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
                    {sessionExists ? 'Scroll Recorded' : 'Verification Sent'}
                  </h2>
                  <p style={{ fontSize: '13px', color: 'var(--sand-dim)', lineHeight: 1.7, marginBottom: '28px' }}>
                    {sessionExists 
                      ? 'Your credentials have been carved into the sacred archives. Sign in to access your sanctuary.' 
                      : 'A verification link has been dispatched to your email. Please check your scrolls and activate your account.'
                    }
                  </p>
                  <Link href="/login" className="kemet-btn" style={{ display: 'flex', justifyContent: 'center', padding: '13px 0', fontSize: '13px', textDecoration: 'none', width: '100%' }}>
                    {sessionExists ? 'Enter Sanctuary →' : 'Back to Sanctuary Gate →'}
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
                      Carve Account
                    </h2>
                    <p style={{ fontSize: '12px', color: 'var(--sand-dim)', margin: 0, letterSpacing: '0.03em' }}>
                      Register your name in the gateway scrolls
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

                  <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Email */}
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

                    {/* Password */}
                    <div>
                      <label className="kemet-label" htmlFor="password">SECRET KEY (PASSWORD)</label>
                      <div className="auth-input-wrap">
                        <span className="auth-input-icon">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                          </svg>
                        </span>
                        <input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          className="kemet-input"
                          placeholder="••••••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          disabled={loading}
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          className="auth-toggle-visibility"
                          onClick={() => setShowPassword(!showPassword)}
                          title={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? (
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                              <line x1="1" y1="1" x2="23" y2="23" />
                            </svg>
                          ) : (
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          )}
                        </button>
                      </div>

                      {/* Password Strength Indicator */}
                      {password && (
                        <div style={{ marginTop: '8px', animation: 'fadeIn 0.2s ease-out' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <span style={{ fontSize: '10px', color: 'var(--sand-dark)', letterSpacing: '0.04em' }}>{strength.label}</span>
                            <span style={{ fontSize: '10px', color: strength.color, fontWeight: 'bold' }}>{strength.score}/5</span>
                          </div>
                          <div style={{ height: '3px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{
                              height: '100%',
                              width: `${(strength.score / 5) * 100}%`,
                              background: strength.color,
                              transition: 'width 0.3s ease, background-color 0.3s ease'
                            }} />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="kemet-label" htmlFor="confirm-password">CONFIRM SECRET KEY</label>
                      <div className="auth-input-wrap">
                        <span className="auth-input-icon">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 12l2 2 4-4" />
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                          </svg>
                        </span>
                        <input
                          id="confirm-password"
                          type={showConfirmPassword ? "text" : "password"}
                          className="kemet-input"
                          placeholder="••••••••••••"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          disabled={loading}
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          className="auth-toggle-visibility"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          title={showConfirmPassword ? "Hide password" : "Show password"}
                        >
                          {showConfirmPassword ? (
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                              <line x1="1" y1="1" x2="23" y2="23" />
                            </svg>
                          ) : (
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          )}
                        </button>
                      </div>

                      {/* Confirm Password Match Indicator */}
                      {confirmPassword && (
                        <div style={{
                          marginTop: '6px',
                          fontSize: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          color: password === confirmPassword ? '#10B981' : '#EF4444',
                          animation: 'fadeIn 0.2s ease-out'
                        }}>
                          {password === confirmPassword ? '✓ Keys match perfectly' : '✗ Keys do not match yet'}
                        </div>
                      )}
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
                          Carving Scrolls...
                        </>
                      ) : (
                        <>
                          Register Credentials
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
                    <span style={{ fontSize: '12px', color: 'var(--sand-dark)' }}>
                      Already registered in the archives?
                    </span>
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
                      Sign In to Sanctuary →
                    </Link>
                    <Link href="/" style={{ fontSize: '11px', color: 'var(--sand-dark)', textDecoration: 'none', marginTop: '2px' }}
                      onMouseOver={e => e.currentTarget.style.color = 'var(--sand-dim)'}
                      onMouseOut={e => e.currentTarget.style.color = 'var(--sand-dark)'}
                    >
                      ← Back to Temple
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
