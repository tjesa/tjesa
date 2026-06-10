'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Zap } from 'lucide-react';

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  
  const [user, setUser] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [activeWorkspace, setActiveWorkspace] = useState(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [theme, setTheme] = useState('obsidian');
  const [brightness, setBrightness] = useState('dark');

  useEffect(() => {
    const savedTheme = localStorage.getItem('tjesa_theme') || 'obsidian';
    setTheme(savedTheme);
    document.body.setAttribute('data-theme', savedTheme);
    
    const savedBrightness = localStorage.getItem('tjesa_brightness') || 'dark';
    setBrightness(savedBrightness);
    document.body.setAttribute('data-brightness', savedBrightness);
  }, []);

  const toggleTheme = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('tjesa_theme', newTheme);
    document.body.setAttribute('data-theme', newTheme);
  };

  const toggleBrightness = () => {
    const newBrightness = brightness === 'dark' ? 'light' : 'dark';
    setBrightness(newBrightness);
    localStorage.setItem('tjesa_brightness', newBrightness);
    document.body.setAttribute('data-brightness', newBrightness);
  };

  useEffect(() => {
    async function fetchMe() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated) {
            setUser(data.user);
            setAccounts(data.accounts || []);
            setActiveWorkspace(data.account || null);
          }
        }
      } catch (err) {
        console.error('[DashboardLayout] fetchMe error:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchMe();
  }, [pathname]);

  const handleSignOut = async () => {
    try {
      const response = await fetch('/api/auth/signout', { method: 'POST' });
      if (response.ok) {
        router.push('/login');
        router.refresh();
      }
    } catch (err) {
      console.error('[DashboardLayout] SignOut error:', err);
    }
  };

  const isUserAdmin = user && (user.email === 'developer@tjesa.com' || user.email?.endsWith('@tjesa.com'));

  const instruments = [
    {
      id: 'qr',
      name: 'QR Code Generator',
      subtitle: 'The Glyph Carver',
      status: 'active',
      path: '/dashboard/qr',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
          <path d="M14 14h7v7h-7z" />
          <path d="M7 7h.01M17 7h.01M7 17h.01M17 17h.01" strokeWidth="3" />
        </svg>
      )
    },
    {
      id: 'charts',
      name: 'Charts & Observatories',
      subtitle: 'The Aten Gazer',
      status: 'locked',
      path: '/dashboard/charts',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      )
    },
    {
      id: 'forms',
      name: 'Notion Forms & Surveys',
      subtitle: 'The Nile Scribe',
      status: 'locked',
      path: '/dashboard/forms',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      )
    },
    {
      id: 'publisher',
      name: 'Notion CMS & Blogs',
      subtitle: 'The Papyrus Publisher',
      status: 'locked',
      path: '/dashboard/publisher',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      )
    },
    {
      id: 'sphinx',
      name: 'Portal Security & Vaults',
      subtitle: 'The Sphinx Shield',
      status: 'locked',
      path: '/dashboard/sphinx',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      )
    },
    {
      id: 'pdf',
      name: 'PDF & Document Exporter',
      subtitle: 'The Rosetta Press',
      status: 'locked',
      path: '/dashboard/pdf',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      )
    },
    {
      id: 'mail',
      name: 'Notion Mail Campaigns',
      subtitle: 'The Nile Dispatch',
      status: 'locked',
      path: '/dashboard/mail',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <polyline points="22,6 12,13 2,6" />
        </svg>
      )
    },
    {
      id: 'social',
      name: 'Automatic Social Dispatch',
      subtitle: 'The Royal Herald',
      status: 'locked',
      path: '/dashboard/social',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
        </svg>
      )
    }
  ];

  return (
    <div className="dashboard-container">
      {/* Floating Menu Toggle Button for Mobile */}
      <button 
        className="mobile-menu-toggle"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        aria-label="Toggle Navigation Menu"
      >
        {isMobileOpen ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        )}
      </button>

      {/* Backdrop overlay for mobile menu */}
      {isMobileOpen && (
        <div 
          className="sidebar-overlay"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`dashboard-sidebar ${isMobileOpen ? 'mobile-open' : ''}`}>
        {/* Sidebar Logo Header */}
        <div className="sidebar-logo-container">
          <Link href="/dashboard" className="sidebar-logo-link" onClick={() => setIsMobileOpen(false)}>
            <svg width="32" height="32" viewBox="0 0 52 52" fill="none" style={{ filter: 'drop-shadow(0 0 6px var(--gold-glow))' }}>
              <rect x="4" y="4" width="20" height="20" rx="3" fill="none" stroke="#C9A84C" strokeWidth="1.5" />
              <rect x="28" y="4" width="20" height="20" rx="3" fill="none" stroke="#C9A84C" strokeWidth="1.5" />
              <rect x="4" y="28" width="20" height="20" rx="3" fill="none" stroke="#8C6E2E" strokeWidth="1.5" />
              <rect x="28" y="28" width="20" height="20" rx="3" fill="none" stroke="#8C6E2E" strokeWidth="1.5" />
              <path d="M24 14 L28 14 M24 38 L28 38 M14 24 L14 28 M38 24 L38 28" stroke="#C9A84C" strokeWidth="2" strokeLinecap="round" />
              <circle cx="26" cy="26" r="3" fill="#C9A84C" />
              <circle cx="26" cy="26" r="1.5" fill="#0A0A0B" />
            </svg>
            <div className="sidebar-logo-text">
              <h2 className="sidebar-logo-title">TJESA</h2>
              <span className="sidebar-logo-sub">Sacred SaaS</span>
            </div>
          </Link>
        </div>

        {/* Sidebar Links Scrollable Wrapper */}
        <div className="sidebar-menu-wrapper">
          {/* Main Hub Link */}
          <Link 
            href="/dashboard"
            className={`sidebar-link ${pathname === '/dashboard' ? 'active' : ''}`}
            data-tooltip="Hall of Instruments"
            onClick={() => setIsMobileOpen(false)}
          >
            <span className="sidebar-icon-wrap">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </span>
            <div className="sidebar-link-text">
              <span className="sidebar-label">Temple Hub</span>
              <span className="sidebar-sub">Main Gateway</span>
            </div>
          </Link>

          <span className="sidebar-section-title">Sacred Instruments</span>

          {/* Instruments Links */}
          <nav className="sidebar-nav">
            {instruments.map(inst => {
              const isLinkActive = pathname === inst.path;
              const isConnected = accounts && accounts.some(a => a.tool === inst.id);
              const isLocked = inst.status === 'locked';

              return (
                <Link
                  key={inst.id}
                  href={isLocked ? '#' : inst.path}
                  className={`sidebar-link ${isLinkActive ? 'active' : ''}`}
                  data-tooltip={isLocked ? `${inst.name} — Coming Soon` : inst.name}
                  onClick={(e) => {
                    if (isLocked) { e.preventDefault(); return; }
                    setIsMobileOpen(false);
                  }}
                  style={isLocked ? { opacity: 0.4, cursor: 'not-allowed', pointerEvents: 'all' } : {}}
                >
                  <span className="sidebar-icon-wrap">
                    {inst.icon}
                  </span>

                  <div className="sidebar-link-text">
                    <span className="sidebar-label">{inst.name}</span>
                    <span className="sidebar-sub">{isLocked ? 'Coming Soon' : inst.subtitle}</span>
                  </div>

                  {/* Status Indicator */}
                  {isLocked ? (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(212,175,55,0.3)" strokeWidth="2" style={{ flexShrink: 0 }}>
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  ) : (
                    <span
                      className="sidebar-status-dot"
                      style={{
                        backgroundColor: isConnected ? '#34D399' : 'transparent',
                        border: isConnected ? '1px solid #34D399' : '1px solid rgba(212, 175, 55, 0.35)',
                        boxShadow: isConnected ? '0 0 8px #34D399' : 'none'
                      }}
                      title={isConnected ? 'Connection Bound' : 'Not Connected'}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Admin Section */}
          {isUserAdmin && (
            <>
              <span className="sidebar-section-title">Temple Vaults</span>
              <Link 
                href="/dashboard/admin" 
                className={`sidebar-link ${pathname === '/dashboard/admin' ? 'active' : ''}`}
                data-tooltip="Waitlist Ledger"
                onClick={() => setIsMobileOpen(false)}
              >
                <span className="sidebar-icon-wrap">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                </span>
                <div className="sidebar-link-text">
                  <span className="sidebar-label">Waitlist Ledger</span>
                  <span className="sidebar-sub">Admin Registry</span>
                </div>
              </Link>
            </>
          )}

          {/* Settings Section */}
          <span className="sidebar-section-title">Temple Config</span>
          <Link
            href="/dashboard/settings"
            className={`sidebar-link ${pathname === '/dashboard/settings' ? 'active' : ''}`}
            data-tooltip="Settings"
            onClick={() => setIsMobileOpen(false)}
          >
            <span className="sidebar-icon-wrap">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </span>
            <div className="sidebar-link-text">
              <span className="sidebar-label">Settings</span>
              <span className="sidebar-sub">Profile & Preferences</span>
            </div>
          </Link>
        </div>

        {/* Sidebar Footer User Details */}
        <div className="sidebar-footer">
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            borderBottom: '1px solid rgba(212, 175, 55, 0.08)',
            marginBottom: '8px'
          }}>
            <span style={{ fontSize: '10px', color: 'var(--sand-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'var(--font-headings)' }}>
              Sacred Theme
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={toggleBrightness}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--gold)',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'transform 0.2s ease',
                }}
                title={brightness === 'dark' ? "Ascend (Light Mode)" : "Descend (Dark Mode)"}
              >
                {brightness === 'dark' ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="5" />
                    <line x1="12" y1="1" x2="12" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="23" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                    <line x1="1" y1="12" x2="3" y2="12" />
                    <line x1="21" y1="12" x2="23" y2="12" />
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                )}
              </button>

              <div style={{ width: '1px', height: '12px', background: 'rgba(212, 175, 55, 0.2)' }} />

              <button
                onClick={() => toggleTheme('obsidian')}
                style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  background: '#D4AF37',
                  border: theme === 'obsidian' ? '2px solid var(--sand-light)' : '1px solid rgba(255,255,255,0.2)',
                  cursor: 'pointer',
                  boxShadow: theme === 'obsidian' ? '0 0 8px #D4AF37' : 'none',
                  transition: 'transform 0.2s ease',
                  padding: 0
                }}
                title="Obsidian Gold"
              />
              <button
                onClick={() => toggleTheme('lapis')}
                style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  background: '#38BDF8',
                  border: theme === 'lapis' ? '2px solid var(--sand-light)' : '1px solid rgba(255,255,255,0.2)',
                  cursor: 'pointer',
                  boxShadow: theme === 'lapis' ? '0 0 8px #38BDF8' : 'none',
                  transition: 'transform 0.2s ease',
                  padding: 0
                }}
                title="Lapis Blue"
              />
              <button
                onClick={() => toggleTheme('emerald')}
                style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  background: '#10B981',
                  border: theme === 'emerald' ? '2px solid var(--sand-light)' : '1px solid rgba(255,255,255,0.2)',
                  cursor: 'pointer',
                  boxShadow: theme === 'emerald' ? '0 0 8px #10B981' : 'none',
                  transition: 'transform 0.2s ease',
                  padding: 0
                }}
                title="Emerald Green"
              />
            </div>
          </div>
          {user && (
            <div className="sidebar-user-block">
              <div className="sidebar-user-info">
                <span className="sidebar-user-email" title={user.email}>{user.email}</span>
                {activeWorkspace ? (
                  <span className="sidebar-workspace-status" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Zap size={11} fill="currentColor" /> {activeWorkspace.workspace_name}
                  </span>
                ) : (
                  <span className="sidebar-workspace-status" style={{ color: 'var(--sand-dim)' }}>
                    Gateway Resting
                  </span>
                )}
              </div>
              <button 
                onClick={handleSignOut} 
                className="sidebar-signout-btn"
                title="Sign Out"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="dashboard-content">
        {children}
      </main>

      {/* Backdrop overlay for mobile */}
      {isMobileOpen && (
        <style dangerouslySetInnerHTML={{ __html: `
          body { overflow: hidden; }
        ` }} />
      )}
    </div>
  );
}
