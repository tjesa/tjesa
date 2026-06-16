'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  playHoverSound,
  playClickSound,
  playSuccessSound,
  playPortalSound
} from '@/lib/audio';
import { 
  Landmark, 
  QrCode, 
  BarChart3, 
  ClipboardList, 
  BookOpen, 
  Lock, 
  FileDown, 
  Mail, 
  Share2, 
  ShieldAlert, 
  Settings, 
  Sun, 
  Moon, 
  LogOut, 
  Zap 
} from 'lucide-react';

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  
  const [user, setUser] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [activeWorkspace, setActiveWorkspace] = useState(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [, setIsLoading] = useState(true);
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
    playSuccessSound();
  };

  const toggleBrightness = () => {
    const newBrightness = brightness === 'dark' ? 'light' : 'dark';
    setBrightness(newBrightness);
    localStorage.setItem('tjesa_brightness', newBrightness);
    document.body.setAttribute('data-brightness', newBrightness);
    playClickSound();
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
      playClickSound();
      const response = await fetch('/api/auth/signout', { method: 'POST' });
      if (response.ok) {
        router.push('/');
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
      icon: <QrCode size={18} strokeWidth={1.5} />
    },
    {
      id: 'charts',
      name: 'Charts & Observatories',
      subtitle: 'The Aten Gazer',
      status: 'locked',
      path: '/dashboard/charts',
      icon: <BarChart3 size={18} strokeWidth={1.5} />
    },
    {
      id: 'forms',
      name: 'Notion Forms & Surveys',
      subtitle: 'The Nile Scribe',
      status: 'locked',
      path: '/dashboard/forms',
      icon: <ClipboardList size={18} strokeWidth={1.5} />
    },
    {
      id: 'publisher',
      name: 'Notion CMS & Blogs',
      subtitle: 'The Papyrus Publisher',
      status: 'locked',
      path: '/dashboard/publisher',
      icon: <BookOpen size={18} strokeWidth={1.5} />
    },
    {
      id: 'sphinx',
      name: 'Portal Security & Vaults',
      subtitle: 'The Sphinx Shield',
      status: 'locked',
      path: '/dashboard/sphinx',
      icon: <Lock size={18} strokeWidth={1.5} />
    },
    {
      id: 'pdf',
      name: 'PDF & Document Exporter',
      subtitle: 'The Rosetta Press',
      status: 'locked',
      path: '/dashboard/pdf',
      icon: <FileDown size={18} strokeWidth={1.5} />
    },
    {
      id: 'mail',
      name: 'Notion Mail Campaigns',
      subtitle: 'The Nile Dispatch',
      status: 'locked',
      path: '/dashboard/mail',
      icon: <Mail size={18} strokeWidth={1.5} />
    },
    {
      id: 'social',
      name: 'Automatic Social Dispatch',
      subtitle: 'The Royal Herald',
      status: 'locked',
      path: '/dashboard/social',
      icon: <Share2 size={18} strokeWidth={1.5} />
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
          <Link href="/dashboard" className="sidebar-logo-link" onClick={() => { playClickSound(); setIsMobileOpen(false); }} onMouseEnter={playHoverSound}>
            <svg width="32" height="32" viewBox="0 0 52 52" fill="none" style={{ filter: 'drop-shadow(0 0 6px var(--gold-glow))' }}>
              <rect x="4" y="4" width="20" height="20" rx="3" fill="none" stroke="var(--gold)" strokeWidth="1.5" />
              <rect x="28" y="4" width="20" height="20" rx="3" fill="none" stroke="var(--gold)" strokeWidth="1.5" />
              <rect x="4" y="28" width="20" height="20" rx="3" fill="none" stroke="var(--gold-dim)" strokeWidth="1.5" />
              <rect x="28" y="28" width="20" height="20" rx="3" fill="none" stroke="var(--gold-dim)" strokeWidth="1.5" />
              <path d="M24 14 L28 14 M24 38 L28 38 M14 24 L14 28 M38 24 L38 28" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" />
              <circle cx="26" cy="26" r="3" fill="var(--gold)" />
              <circle cx="26" cy="26" r="1.5" fill="var(--obsidian-mid)" />
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
            onClick={() => { playClickSound(); setIsMobileOpen(false); }}
            onMouseEnter={playHoverSound}
          >
            <span className="sidebar-icon-wrap">
              <Landmark size={18} strokeWidth={1.5} />
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
                    if (isLocked) { e.preventDefault(); playErrorSound(); return; }
                    playClickSound();
                    setIsMobileOpen(false);
                  }}
                  onMouseEnter={playHoverSound}
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
                    <Lock size={11} strokeWidth={2} style={{ flexShrink: 0, opacity: 0.5, color: 'rgba(212,175,55,0.4)' }} />
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
                data-tooltip="Admin Sanctum"
                onClick={() => { playClickSound(); setIsMobileOpen(false); }}
                onMouseEnter={playHoverSound}
              >
                <span className="sidebar-icon-wrap">
                  <ShieldAlert size={18} strokeWidth={1.5} />
                </span>
                <div className="sidebar-link-text">
                  <span className="sidebar-label">Admin Sanctum</span>
                  <span className="sidebar-sub">Temple Management</span>
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
            onClick={() => { playClickSound(); setIsMobileOpen(false); }}
            onMouseEnter={playHoverSound}
          >
            <span className="sidebar-icon-wrap">
              <Settings size={18} strokeWidth={1.5} />
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
                onMouseEnter={playHoverSound}
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
                  <Sun size={14} strokeWidth={2.5} />
                ) : (
                  <Moon size={14} strokeWidth={2.5} />
                )}
              </button>

              <div style={{ width: '1px', height: '12px', background: 'rgba(212, 175, 55, 0.2)' }} />

              <button
                onClick={() => toggleTheme('obsidian')}
                onMouseEnter={playHoverSound}
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
                onMouseEnter={playHoverSound}
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
                onMouseEnter={playHoverSound}
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
                <LogOut size={16} strokeWidth={2} />
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
