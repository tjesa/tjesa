'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import NextLink from 'next/link';
import { useToast } from '@/hooks/useToast';
import { createClient } from '@/lib/supabase/client';
import {
  playHoverSound,
  playClickSound,
  playSuccessSound,
  playErrorSound,
  playPortalSound,
  playSanctumSound,
  setSfxEnabled,
  setSfxVolume
} from '@/lib/audio';
import { 
  QrCode, 
  BarChart3, 
  Scroll, 
  BookOpen, 
  FileDown, 
  Send, 
  Megaphone, 
  Shield, 
  Link, 
  AlertTriangle 
} from 'lucide-react';

function ToolIcon({ id, size = 18 }) {
  switch (id) {
    case 'qr': return <QrCode size={size} style={{ color: 'var(--gold)' }} />;
    case 'charts': return <BarChart3 size={size} style={{ color: 'var(--gold)' }} />;
    case 'forms': return <Scroll size={size} style={{ color: 'var(--gold)' }} />;
    case 'publisher': return <BookOpen size={size} style={{ color: 'var(--gold)' }} />;
    case 'pdf': return <FileDown size={size} style={{ color: 'var(--gold)' }} />;
    case 'mail': return <Send size={size} style={{ color: 'var(--gold)' }} />;
    case 'social': return <Megaphone size={size} style={{ color: 'var(--gold)' }} />;
    case 'sphinx': return <Shield size={size} style={{ color: 'var(--gold)' }} />;
    default: return <Link size={size} style={{ color: 'var(--gold)' }} />;
  }
}

// ─── Constants ────────────────────────────────────────────────────────────────
const TABS = [
  {
    id: 'profile',
    label: 'Profile',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    id: 'connections',
    label: 'Connections',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
    ),
  },
  {
    id: 'appearance',
    label: 'Appearance & Sounds',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
      </svg>
    ),
  },
  {
    id: 'support',
    label: 'Support & Feedback',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    id: 'danger',
    label: 'Danger Zone',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
];

const TOOL_LABELS = {
  qr: { name: 'QR Code Generator', subtitle: 'The Glyph Carver' },
  charts: { name: 'Charts Observatory', subtitle: 'The Aten Gazer' },
  forms: { name: 'Forms & Surveys', subtitle: 'The Nile Scribe' },
  publisher: { name: 'CMS & Blogs', subtitle: 'The Papyrus Publisher' },
  pdf: { name: 'PDF Exporter', subtitle: 'The Rosetta Press' },
  mail: { name: 'Email Campaigns', subtitle: 'The Nile Dispatch' },
  social: { name: 'Social Dispatch', subtitle: 'The Royal Herald' },
  sphinx: { name: 'Portal Security', subtitle: 'The Sphinx Shield' },
};

const THEMES = [
  {
    id: 'obsidian',
    name: 'Obsidian Gold',
    subtitle: 'Sacred default · Dark pharaonic',
    accent: '#D4AF37',
    bg: '#0D0D0B',
    preview: ['#0D0D0B', '#141311', '#D4AF37'],
  },
  {
    id: 'lapis',
    name: 'Lapis Blue',
    subtitle: 'Night sky · Deep azure',
    accent: '#38BDF8',
    bg: '#070B19',
    preview: ['#070B19', '#0D1326', '#38BDF8'],
  },
  {
    id: 'emerald',
    name: 'Emerald Green',
    subtitle: 'Nile malachite · Forest depths',
    accent: '#10B981',
    bg: '#05100B',
    preview: ['#05100B', '#0A1C14', '#10B981'],
  },
  {
    id: 'carnelian',
    name: 'Carnelian Red',
    subtitle: 'Royal amulet · Carnelian & Ochre',
    accent: '#E05A47',
    bg: '#140505',
    preview: ['#140505', '#1F0A0A', '#E05A47'],
  },
];

// ─── Helper Components ─────────────────────────────────────────────────────────
function SectionCard({ title, subtitle, children, accentColor }) {
  return (
    <div style={{
      background: 'var(--obsidian-card)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      border: 'var(--border-gold)',
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      marginBottom: '20px',
    }}>
      {/* Card top bar */}
      <div style={{
        height: '3px',
        background: accentColor || 'var(--gold-gradient)',
      }} />
      <div style={{ padding: '24px 28px' }}>
        {(title || subtitle) && (
          <div style={{ marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid rgba(212,175,55,0.08)' }}>
            {title && (
              <h3 style={{ fontSize: '14px', letterSpacing: '0.1em', margin: '0 0 4px', color: 'var(--gold)', textTransform: 'uppercase' }}>
                {title}
              </h3>
            )}
            {subtitle && (
              <p style={{ fontSize: '12px', color: 'var(--sand-dark)', margin: 0, fontFamily: 'var(--font-body)' }}>
                {subtitle}
              </p>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

function InfoRow({ label, value, mono }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '10px 0',
      borderBottom: '1px solid rgba(212,175,55,0.05)',
      gap: '16px',
      flexWrap: 'wrap',
    }}>
      <span style={{ fontSize: '11px', color: 'var(--sand-dark)', fontFamily: 'var(--font-headings)', letterSpacing: '0.08em', textTransform: 'uppercase', flexShrink: 0 }}>
        {label}
      </span>
      <span style={{
        fontSize: '13px',
        color: 'var(--sand-dim)',
        fontFamily: mono ? 'monospace' : 'var(--font-body)',
        letterSpacing: mono ? '0.04em' : 'normal',
        wordBreak: 'break-all',
        textAlign: 'right',
      }}>
        {value}
      </span>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function SettingsClient({ user }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('profile');
  const [accounts, setAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [disconnecting, setDisconnecting] = useState(null);
  const [theme, setTheme] = useState('obsidian');
  const [brightness, setBrightness] = useState('dark');
  const [sfxEnabledState, setSfxEnabledState] = useState(true);
  const [sfxVolumeState, setSfxVolumeState] = useState(0.5);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [signOutLoading, setSignOutLoading] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [feedbackCategory, setFeedbackCategory] = useState('');
  const [feedbackSubject, setFeedbackSubject] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackDone, setFeedbackDone] = useState(false);
  const [myTickets, setMyTickets] = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [supportView, setSupportView] = useState('new'); // 'new' | 'history'

  const getPasswordStrength = () => {
    if (!newPassword) return { score: 0, label: '', color: 'transparent' };
    let score = 0;
    if (newPassword.length >= 6) score += 1;
    if (newPassword.length >= 10) score += 1;
    if (/[A-Z]/.test(newPassword)) score += 1;
    if (/[0-9]/.test(newPassword)) score += 1;
    if (/[^A-Za-z0-9]/.test(newPassword)) score += 1;

    if (score <= 2) return { score, label: 'Weak Glyph Strength', color: '#EF4444' };
    if (score <= 4) return { score, label: 'Fair Glyph Strength', color: '#F59E0B' };
    return { score, label: 'Strong Shield Active', color: '#10B981' };
  };

  const strength = getPasswordStrength();

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) return;
    if (newPassword !== confirmPassword) {
      showToast('The secret keys do not match.', 'error');
      return;
    }
    if (newPassword.length < 6) {
      showToast('Password must be at least 6 glyphs long.', 'error');
      return;
    }

    setPasswordLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        showToast(error.message || 'Failed to update password.', 'error');
      } else {
        showToast('Secret key successfully updated in the archives.', 'success');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      showToast('An ancient error disrupted the update. Try again.', 'error');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    try {
      const res = await fetch('/api/auth/delete', { method: 'DELETE' });
      if (res.ok) {
        showToast('Your account and records have been severed from the archives.', 'success');
        setDeleteModalOpen(false);
        localStorage.removeItem('tjesa_theme');
        localStorage.removeItem('tjesa_brightness');
        router.push('/');
        router.refresh();
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to sever connection.', 'error');
      }
    } catch {
      showToast('Network error during deletion.', 'error');
    } finally {
      setDeleteLoading(false);
      setDeleteConfirm('');
    }
  };

  // Load theme and sound settings from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('tjesa_theme') || 'obsidian';
    const savedBrightness = localStorage.getItem('tjesa_brightness') || 'dark';
    const savedSfx = localStorage.getItem('tjesa_sfx_enabled') !== 'false';
    const savedVol = localStorage.getItem('tjesa_sfx_volume');

    setTimeout(() => {
      setTheme(savedTheme);
      setBrightness(savedBrightness);
      setSfxEnabledState(savedSfx);
      setSfxVolumeState(savedVol !== null ? parseFloat(savedVol) : 0.5);
    }, 0);
  }, []);

  // Fetch accounts
  useEffect(() => {
    async function fetchAccounts() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setAccounts(data.accounts || []);
        }
      } catch (err) {
        console.error('[Settings] fetchAccounts error:', err);
      } finally {
        setLoadingAccounts(false);
      }
    }
    fetchAccounts();
  }, []);

  const { showToast } = useToast();

  const applyTheme = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('tjesa_theme', newTheme);
    document.body.setAttribute('data-theme', newTheme);
    showToast(`Theme set to ${THEMES.find(t => t.id === newTheme)?.name}`, 'success');
  };

  const applyBrightness = (newBrightness) => {
    setBrightness(newBrightness);
    localStorage.setItem('tjesa_brightness', newBrightness);
    document.body.setAttribute('data-brightness', newBrightness);
    showToast(`Switched to ${newBrightness} mode`, 'success');
  };

  const handleToggleSfx = (e) => {
    const enabled = e.target.checked;
    setSfxEnabledState(enabled);
    setSfxEnabled(enabled);
    if (enabled) {
      setTimeout(() => playClickSound(), 50);
    }
  };

  const handleVolumeChange = (e) => {
    const vol = parseFloat(e.target.value);
    setSfxVolumeState(vol);
    setSfxVolume(vol);
  };

  const handleDisconnect = async (tool) => {
    setDisconnecting(tool || 'all');
    try {
      const url = tool ? `/api/auth/disconnect?tool=${tool}` : '/api/auth/disconnect';
      const res = await fetch(url, { method: 'POST' });
      if (res.ok) {
        setAccounts(prev =>
          tool
            ? prev.filter(a => !a.workspace_id.endsWith(`_${tool}`))
            : []
        );
        showToast(tool ? `${TOOL_LABELS[tool]?.name || tool} disconnected` : 'All connections severed', 'success');
      } else {
        showToast('Failed to disconnect. Try again.', 'error');
      }
    } catch {
      showToast('Network error. Please try again.', 'error');
    } finally {
      setDisconnecting(null);
    }
  };

  const handleSignOut = async () => {
    setSignOutLoading(true);
    try {
      const res = await fetch('/api/auth/signout', { method: 'POST' });
      if (res.ok) {
        router.push('/login');
        router.refresh();
      } else {
        showToast('Sign out failed. Try again.', 'error');
        setSignOutLoading(false);
      }
    } catch {
      showToast('Network error during sign out.', 'error');
      setSignOutLoading(false);
    }
  };

  const fetchMyTickets = useCallback(async () => {
    setTicketsLoading(true);
    try {
      const res = await fetch('/api/support/tickets');
      if (res.ok) {
        const data = await res.json();
        setMyTickets(data.tickets || []);
      }
    } catch (err) {
      console.error('[Settings] fetchMyTickets error:', err);
    } finally {
      setTicketsLoading(false);
    }
  }, []);

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!feedbackCategory || !feedbackSubject.trim() || !feedbackMessage.trim()) {
      showToast('Please fill in all fields.', 'error');
      return;
    }
    setFeedbackLoading(true);
    try {
      const res = await fetch('/api/support/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: feedbackCategory, subject: feedbackSubject, message: feedbackMessage }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        playSuccessSound();
        setFeedbackDone(true);
        setFeedbackCategory('');
        setFeedbackSubject('');
        setFeedbackMessage('');
        fetchMyTickets();
      } else {
        showToast(data.error || 'Submission failed. Try again.', 'error');
      }
    } catch {
      showToast('Network error. Please try again.', 'error');
    } finally {
      setFeedbackLoading(false);
    }
  };

  // Derive tool from workspace_id (e.g. "abc_qr" → "qr")
  const getToolFromWorkspace = (workspaceId) => {
    const parts = workspaceId.split('_');
    return parts.length > 1 ? parts[parts.length - 1] : null;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : '??';

  return (
    <>
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes tabSlide {
          from { opacity: 0; transform: translateX(8px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .settings-tab-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 16px;
          border-radius: 8px;
          border: 1px solid transparent;
          background: transparent;
          color: var(--sand-dim);
          font-family: var(--font-headings);
          font-size: 12px;
          letter-spacing: 0.08em;
          cursor: pointer;
          transition: all 0.2s ease;
          width: 100%;
          text-align: left;
        }
        .settings-tab-btn:hover {
          background: rgba(212,175,55,0.05);
          color: var(--sand-light);
        }
        .settings-tab-btn.active {
          background: rgba(212,175,55,0.08);
          border-color: rgba(212,175,55,0.2);
          color: var(--gold-bright);
        }
        .settings-tab-btn.active svg {
          filter: drop-shadow(0 0 4px var(--gold-glow));
        }
        .settings-tab-btn.danger-tab:hover,
        .settings-tab-btn.danger-tab.active {
          background: rgba(168,36,36,0.08);
          border-color: rgba(168,36,36,0.25);
          color: #FF7F7F;
        }
        .settings-content {
          animation: tabSlide 0.25s ease both;
        }
        .disconnect-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 6px;
          border: 1px solid rgba(168,36,36,0.3);
          background: rgba(168,36,36,0.05);
          color: #FF9F9F;
          font-size: 11px;
          font-family: var(--font-headings);
          letter-spacing: 0.06em;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .disconnect-btn:hover {
          background: rgba(168,36,36,0.12);
          border-color: rgba(168,36,36,0.5);
          color: #FF7F7F;
        }
        .disconnect-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .theme-swatch {
          border-radius: 10px;
          border: 2px solid transparent;
          cursor: pointer;
          transition: all 0.2s ease;
          overflow: hidden;
          flex: 1;
          min-width: 140px;
        }
        .theme-swatch:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.4);
        }
        .theme-swatch.active {
          box-shadow: 0 0 0 2px var(--gold), 0 8px 24px rgba(0,0,0,0.5);
        }
        .connection-card {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 16px;
          background: rgba(212,175,55,0.03);
          border: 1px solid rgba(212,175,55,0.08);
          border-radius: 8px;
          margin-bottom: 10px;
          transition: all 0.2s ease;
          flex-wrap: wrap;
        }
        .connection-card:hover {
          border-color: rgba(212,175,55,0.15);
          background: rgba(212,175,55,0.05);
        }
        .danger-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border-radius: 8px;
          font-family: var(--font-headings);
          font-size: 12px;
          letter-spacing: 0.08em;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .brightness-toggle {
          display: flex;
          align-items: center;
          gap: 0;
          background: rgba(0,0,0,0.3);
          border: 1px solid rgba(212,175,55,0.15);
          border-radius: 8px;
          overflow: hidden;
          width: fit-content;
        }
        .brightness-option {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          cursor: pointer;
          font-size: 12px;
          font-family: var(--font-headings);
          letter-spacing: 0.06em;
          border: none;
          transition: all 0.2s ease;
        }
        .brightness-option.active {
          background: var(--gold-gradient);
          color: #0D0D0B;
        }
        .brightness-option:not(.active) {
          background: transparent;
          color: var(--sand-dim);
        }
        .brightness-option:not(.active):hover {
          background: rgba(212,175,55,0.06);
          color: var(--sand-light);
        }
      `}</style>

      <div style={{
        display: 'flex',
        minHeight: '100vh',
        padding: '32px',
        gap: '28px',
        maxWidth: '1100px',
        margin: '0 auto',
        width: '100%',
        position: 'relative',
        zIndex: 1,
        alignItems: 'flex-start',
      }}>

        {/* ── SIDEBAR TABS ──────────────────────────────────────── */}
        <aside style={{
          width: '220px',
          flexShrink: 0,
          position: 'sticky',
          top: '32px',
        }}>
          {/* Page header */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '10px', color: 'var(--gold)', letterSpacing: '0.2em', fontFamily: 'var(--font-headings)', textTransform: 'uppercase', marginBottom: '6px' }}>
              Temple Config
            </div>
            <h1 style={{ fontSize: '20px', letterSpacing: '0.1em', margin: 0, color: 'var(--gold)' }}>
              Settings
            </h1>
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {TABS.map(tab => (
              <button
                key={tab.id}
                className={`settings-tab-btn${activeTab === tab.id ? ' active' : ''}${tab.id === 'danger' ? ' danger-tab' : ''}`}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id === 'support') { fetchMyTickets(); }
                  else { setFeedbackDone(false); setSupportView('new'); }
                }}
                id={`settings-tab-${tab.id}`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Back to dashboard */}
          <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid rgba(212,175,55,0.08)' }}>
            <button
              onClick={() => router.push('/dashboard')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'none',
                border: 'none',
                color: 'var(--sand-dark)',
                cursor: 'pointer',
                fontSize: '11px',
                fontFamily: 'var(--font-headings)',
                letterSpacing: '0.08em',
                padding: 0,
                transition: 'color 0.2s ease',
              }}
              onMouseOver={e => e.currentTarget.style.color = 'var(--sand-dim)'}
              onMouseOut={e => e.currentTarget.style.color = 'var(--sand-dark)'}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
              </svg>
              Back to Dashboard
            </button>
          </div>
        </aside>

        {/* ── MAIN CONTENT ──────────────────────────────────────── */}
        <div className="settings-content" key={activeTab} style={{ flex: 1, minWidth: 0 }}>

          {/* ══ PROFILE TAB ══════════════════════════════════════ */}
          {activeTab === 'profile' && (
            <div>
              <SectionCard title="Identity Scroll" subtitle="Your account details and identity in the sacred registry.">
                {/* Avatar + email header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, #D4AF37, #AA8928)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '22px',
                    fontFamily: 'var(--font-headings)',
                    fontWeight: 700,
                    color: '#0D0D0B',
                    letterSpacing: '0.05em',
                    boxShadow: '0 4px 20px rgba(212,175,55,0.3)',
                    flexShrink: 0,
                  }}>
                    {initials}
                  </div>
                  <div>
                    <div style={{ fontSize: '16px', color: 'var(--sand-light)', fontFamily: 'var(--font-body)', marginBottom: '4px' }}>
                      {user?.email}
                    </div>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '3px 10px',
                      background: 'rgba(52,211,153,0.08)',
                      border: '1px solid rgba(52,211,153,0.25)',
                      borderRadius: '20px',
                      fontSize: '10px',
                      color: '#34D399',
                      fontFamily: 'var(--font-headings)',
                      letterSpacing: '0.1em',
                    }}>
                      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#34D399', display: 'inline-block' }} />
                      AUTHENTICATED
                    </div>
                  </div>
                </div>

                {/* Details */}
                <InfoRow label="Email" value={user?.email} />
                <InfoRow label="Account ID" value={user?.id} mono />
                <InfoRow label="Auth Provider" value="Supabase Auth (Email)" />
              </SectionCard>

              <SectionCard title="Password & Security" subtitle="Manage your authentication credentials.">
                {user?.id === '00000000-0000-0000-0000-000000000000' ? (
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '14px',
                    padding: '14px',
                    background: 'rgba(212,175,55,0.04)',
                    border: '1px solid rgba(212,175,55,0.1)',
                    borderRadius: '8px',
                  }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '1px' }}>
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <div>
                      <p style={{ fontSize: '13px', color: 'var(--sand-dim)', lineHeight: 1.6, margin: 0 }}>
                        <strong>Developer Bypass Active:</strong> Password updates are disabled because authentication is currently simulated locally.
                      </p>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handlePasswordUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label className="kemet-label" htmlFor="new-password" style={{ display: 'block', fontSize: '11px', color: 'var(--sand-dim)', marginBottom: '6px' }}>NEW SECRET KEY (PASSWORD)</label>
                      <input
                        id="new-password"
                        type="password"
                        className="kemet-input"
                        placeholder="••••••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        disabled={passwordLoading}
                        style={{ background: 'rgba(var(--obsidian-rgb), 0.5)' }}
                      />
                      
                      {newPassword && (
                        <div style={{ marginTop: '8px' }}>
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

                    <div>
                      <label className="kemet-label" htmlFor="confirm-new-password" style={{ display: 'block', fontSize: '11px', color: 'var(--sand-dim)', marginBottom: '6px' }}>CONFIRM SECRET KEY</label>
                      <input
                        id="confirm-new-password"
                        type="password"
                        className="kemet-input"
                        placeholder="••••••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        disabled={passwordLoading}
                        style={{ background: 'rgba(var(--obsidian-rgb), 0.5)' }}
                      />
                      {confirmPassword && (
                        <div style={{
                          marginTop: '6px',
                          fontSize: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          color: newPassword === confirmPassword ? '#10B981' : '#EF4444'
                        }}>
                          {newPassword === confirmPassword ? '✓ Keys match perfectly' : '✗ Keys do not match yet'}
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      className="kemet-btn"
                      disabled={passwordLoading || !newPassword || newPassword !== confirmPassword}
                      style={{ padding: '8px 18px', fontSize: '11px', alignSelf: 'flex-start', height: 'auto', minHeight: 'unset' }}
                    >
                      {passwordLoading ? 'Carving New Key...' : 'Update Secret Key'}
                    </button>
                  </form>
                )}
              </SectionCard>
            </div>
          )}

          {/* ══ CONNECTIONS TAB ══════════════════════════════════ */}
          {activeTab === 'connections' && (
            <div>
              <SectionCard
                title="Notion Connections"
                subtitle={`${accounts.length} workspace${accounts.length !== 1 ? 's' : ''} bound to your account.`}
              >
                {loadingAccounts ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '20px 0', color: 'var(--sand-dark)', fontSize: '13px' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                      <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" strokeOpacity="0.2" />
                      <path d="M21 12a9 9 0 0 0-9-9" strokeLinecap="round" />
                    </svg>
                    Reading the scrolls...
                  </div>
                ) : accounts.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px', color: 'var(--gold)' }}>
                      <Link size={32} />
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--sand-dark)', lineHeight: 1.6 }}>
                      No Notion connections found. Visit a tool page to connect your first workspace.
                    </p>
                    <button
                      onClick={() => router.push('/dashboard')}
                      style={{
                        marginTop: '16px',
                        background: 'var(--gold-gradient)',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#0D0D0B',
                        padding: '9px 20px',
                        fontSize: '12px',
                        fontFamily: 'var(--font-headings)',
                        letterSpacing: '0.08em',
                        cursor: 'pointer',
                      }}
                    >
                      Browse Instruments
                    </button>
                  </div>
                ) : (
                  <>
                    {accounts.map(account => {
                      const tool = getToolFromWorkspace(account.workspace_id);
                      const toolInfo = TOOL_LABELS[tool] || { name: 'Main Workspace', subtitle: 'General connection' };
                      const isDisconnecting = disconnecting === (tool || 'all');

                      return (
                        <div key={account.workspace_id} className="connection-card">
                          {/* Tool emoji */}
                          <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            background: 'rgba(212,175,55,0.08)',
                            border: '1px solid rgba(212,175,55,0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}>
                            <ToolIcon id={tool} size={18} />
                          </div>

                          {/* Info */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '13px', color: 'var(--sand-light)', fontFamily: 'var(--font-headings)', letterSpacing: '0.04em' }}>
                                {account.workspace_name || toolInfo.name}
                              </span>
                              <span style={{
                                padding: '2px 8px',
                                background: 'rgba(212,175,55,0.08)',
                                border: '1px solid rgba(212,175,55,0.15)',
                                borderRadius: '20px',
                                fontSize: '9px',
                                color: 'var(--gold-dim)',
                                fontFamily: 'var(--font-headings)',
                                letterSpacing: '0.1em',
                                textTransform: 'uppercase',
                              }}>
                                {toolInfo.subtitle}
                              </span>
                            </div>
                            {account.connected_at && (
                              <div style={{ fontSize: '11px', color: 'var(--sand-dark)', marginTop: '3px' }}>
                                Connected {formatDate(account.connected_at)}
                              </div>
                            )}
                          </div>

                          {/* Status */}
                          <div style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: '#34D399',
                            boxShadow: '0 0 6px #34D399',
                            flexShrink: 0,
                          }} />

                          {/* Disconnect button */}
                          <button
                            className="disconnect-btn"
                            onClick={() => handleDisconnect(tool)}
                            disabled={isDisconnecting}
                          >
                            {isDisconnecting ? (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 1s linear infinite' }}>
                                <path d="M21 12a9 9 0 0 0-9-9" strokeLinecap="round" />
                              </svg>
                            ) : (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                              </svg>
                            )}
                            Sever
                          </button>
                        </div>
                      );
                    })}

                    {/* Disconnect all */}
                    {accounts.length > 1 && (
                      <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(212,175,55,0.06)' }}>
                        <button
                          className="disconnect-btn"
                          onClick={() => handleDisconnect(null)}
                          disabled={!!disconnecting}
                          style={{ width: '100%', justifyContent: 'center' }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                            <path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                          </svg>
                          Sever All Connections
                        </button>
                      </div>
                    )}
                  </>
                )}
              </SectionCard>
            </div>
          )}

          {/* ══ APPEARANCE TAB ════════════════════════════════════ */}
          {activeTab === 'appearance' && (
            <div>
              <SectionCard title="Theme Palette" subtitle="Choose the sacred gemstone palette for your entire workspace.">
                <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                  {THEMES.map(t => (
                    <button
                      key={t.id}
                      className={`theme-swatch${theme === t.id ? ' active' : ''}`}
                      onClick={() => applyTheme(t.id)}
                      style={{ border: `2px solid ${theme === t.id ? t.accent : 'rgba(255,255,255,0.08)'}` }}
                    >
                      {/* Preview swatch */}
                      <div style={{
                        height: '64px',
                        background: `linear-gradient(135deg, ${t.preview[0]} 0%, ${t.preview[1]} 60%, ${t.preview[2]}44 100%)`,
                        position: 'relative',
                        overflow: 'hidden',
                      }}>
                        <div style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          width: '28px',
                          height: '28px',
                          borderRadius: '8px',
                          background: t.preview[2],
                          boxShadow: `0 0 12px ${t.preview[2]}66`,
                        }} />
                        {theme === t.id && (
                          <div style={{
                            position: 'absolute',
                            top: '6px',
                            right: '8px',
                            fontSize: '12px',
                            color: t.accent,
                            filter: `drop-shadow(0 0 4px ${t.accent})`,
                          }}>
                            ✓
                          </div>
                        )}
                      </div>
                      {/* Label */}
                      <div style={{ padding: '10px 12px', textAlign: 'left', background: t.bg }}>
                        <div style={{ fontSize: '12px', color: t.accent, fontFamily: 'var(--font-headings)', letterSpacing: '0.06em', marginBottom: '2px' }}>
                          {t.name}
                        </div>
                        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-body)' }}>
                          {t.subtitle}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </SectionCard>

              <SectionCard title="Brightness" subtitle="Choose between sacred night (dark) or daylight (light) mode.">
                <div className="brightness-toggle">
                  <button
                    className={`brightness-option${brightness === 'dark' ? ' active' : ''}`}
                    onClick={() => applyBrightness('dark')}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                    </svg>
                    Dark Mode
                  </button>
                  <button
                    className={`brightness-option${brightness === 'light' ? ' active' : ''}`}
                    onClick={() => applyBrightness('light')}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="5" />
                      <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                      <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                    </svg>
                    Light Mode
                  </button>
                </div>

                <p style={{ fontSize: '11px', color: 'var(--sand-dark)', marginTop: '12px', fontFamily: 'var(--font-body)' }}>
                  Your preference is saved automatically and persists across sessions.
                </p>
              </SectionCard>

              <SectionCard title="Sound Effects (SFX)" subtitle="Enable and configure synthesized Pharaonic workspace audio.">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Enable sound checkbox */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input
                      id="sfx-enabled-toggle"
                      type="checkbox"
                      checked={sfxEnabledState}
                      onChange={handleToggleSfx}
                      style={{
                        width: '18px',
                        height: '18px',
                        accentColor: 'var(--gold)',
                        cursor: 'pointer',
                      }}
                    />
                    <label
                      htmlFor="sfx-enabled-toggle"
                      style={{
                        fontSize: '13px',
                        color: 'var(--sand-light)',
                        fontFamily: 'var(--font-headings)',
                        letterSpacing: '0.04em',
                        cursor: 'pointer',
                        textTransform: 'uppercase',
                      }}
                    >
                      Enable Sacred SFX
                    </label>
                  </div>

                  {/* Volume Slider */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', opacity: sfxEnabledState ? 1 : 0.4, transition: 'opacity 0.2s ease' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', color: 'var(--sand-dim)', fontFamily: 'var(--font-headings)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                        SFX Volume
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--gold)', fontFamily: 'monospace', fontWeight: 'bold' }}>
                        {Math.round(sfxVolumeState * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={sfxVolumeState}
                      onChange={handleVolumeChange}
                      onMouseUp={() => { if (sfxEnabledState) playClickSound(); }}
                      onTouchEnd={() => { if (sfxEnabledState) playClickSound(); }}
                      disabled={!sfxEnabledState}
                      style={{
                        width: '100%',
                        accentColor: 'var(--gold)',
                        cursor: sfxEnabledState ? 'pointer' : 'not-allowed',
                      }}
                    />
                  </div>

                  {/* Live Preview / Test Chimes */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px', opacity: sfxEnabledState ? 1 : 0.4, transition: 'opacity 0.2s ease' }}>
                    <span style={{ fontSize: '11px', color: 'var(--sand-dim)', fontFamily: 'var(--font-headings)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      Test Chimes & Drones
                    </span>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        className="kemet-btn-secondary"
                        onClick={playHoverSound}
                        disabled={!sfxEnabledState}
                        style={{ padding: '6px 12px', fontSize: '11px' }}
                      >
                        Nile Breeze (Hover)
                      </button>
                      <button
                        className="kemet-btn-secondary"
                        onClick={playClickSound}
                        disabled={!sfxEnabledState}
                        style={{ padding: '6px 12px', fontSize: '11px' }}
                      >
                        Tomb Tap (Click)
                      </button>
                      <button
                        className="kemet-btn-secondary"
                        onClick={playSuccessSound}
                        disabled={!sfxEnabledState}
                        style={{ padding: '6px 12px', fontSize: '11px' }}
                      >
                        Temple Chime (Success)
                      </button>
                      <button
                        className="kemet-btn-secondary"
                        onClick={playErrorSound}
                        disabled={!sfxEnabledState}
                        style={{ padding: '6px 12px', fontSize: '11px' }}
                      >
                        Tomb Curse (Error)
                      </button>
                      <button
                        className="kemet-btn-secondary"
                        onClick={playPortalSound}
                        disabled={!sfxEnabledState}
                        style={{ padding: '6px 12px', fontSize: '11px' }}
                      >
                        Stone Portal (Gate)
                      </button>
                      <button
                        className="kemet-btn-secondary"
                        onClick={playSanctumSound}
                        disabled={!sfxEnabledState}
                        style={{ padding: '6px 12px', fontSize: '11px' }}
                      >
                        Sanctum Gate (Admin Join)
                      </button>
                    </div>
                  </div>
                </div>
              </SectionCard>
            </div>
          )}

          {/* ══ SUPPORT & FEEDBACK TAB ═══════════════════════════ */}
          {activeTab === 'support' && (() => {
            const STATUS_META = {
              open:        { label: 'Open',        bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.3)',   text: '#FCA5A5' },
              in_progress: { label: 'In Progress', bg: 'rgba(251,146,60,0.1)',  border: 'rgba(251,146,60,0.3)',  text: '#FB923C' },
              resolved:    { label: 'Resolved',    bg: 'rgba(52,211,153,0.08)', border: 'rgba(52,211,153,0.25)', text: '#34D399' },
            };
            const formatDate = (d) => {
              if (!d) return '—';
              return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
            };
            const ticketId = (id) => `TKT-${(id || '').slice(0, 6).toUpperCase()}`;

            return (
            <div>
              {/* View toggle */}
              <div style={{ display: 'flex', gap: '0', marginBottom: '20px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(212,175,55,0.12)', borderRadius: '8px', overflow: 'hidden', width: 'fit-content' }}>
                {[{ id: 'new', label: 'New Ticket' }, { id: 'history', label: `My Tickets${myTickets.length ? ` (${myTickets.length})` : ''}` }].map(v => (
                  <button
                    key={v.id}
                    onClick={() => setSupportView(v.id)}
                    style={{
                      padding: '8px 20px', border: 'none', cursor: 'pointer',
                      fontFamily: 'var(--font-headings)', fontSize: '12px', letterSpacing: '0.06em',
                      background: supportView === v.id ? 'var(--gold-gradient)' : 'transparent',
                      color: supportView === v.id ? '#0D0D0B' : 'var(--sand-dim)',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {v.label}
                  </button>
                ))}
              </div>

              {supportView === 'history' ? (
                /* ── MY TICKETS HISTORY ── */
                <SectionCard title="My Tickets" subtitle="Track the status of your submitted tickets.">
                  {ticketsLoading ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '20px 0', color: 'var(--sand-dark)', fontSize: '13px' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                        <path d="M21 12a9 9 0 0 0-9-9" strokeLinecap="round" />
                      </svg>
                      Loading your tickets…
                    </div>
                  ) : myTickets.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '32px 0' }}>
                      <p style={{ fontSize: '13px', color: 'var(--sand-dark)', margin: '0 0 16px' }}>
                        You haven&apos;t submitted any tickets yet.
                      </p>
                      <button
                        onClick={() => setSupportView('new')}
                        style={{
                          background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)',
                          borderRadius: '8px', color: 'var(--gold)', padding: '8px 20px',
                          fontSize: '12px', fontFamily: 'var(--font-headings)', letterSpacing: '0.08em', cursor: 'pointer',
                        }}
                      >
                        Submit a Ticket
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {myTickets.map((t, idx) => {
                        const meta = STATUS_META[t.status] || STATUS_META.open;
                        return (
                          <div key={t.id || idx} style={{
                            display: 'flex', alignItems: 'center', gap: '12px',
                            padding: '12px 14px', background: 'rgba(212,175,55,0.02)',
                            border: '1px solid rgba(212,175,55,0.08)', borderRadius: '8px', flexWrap: 'wrap',
                          }}>
                            <span style={{ fontSize: '10px', fontFamily: 'monospace', color: 'var(--gold-dim)', flexShrink: 0 }}>
                              {ticketId(t.id)}
                            </span>
                            <span style={{
                              padding: '2px 8px', borderRadius: '4px', fontSize: '10px',
                              fontFamily: 'var(--font-headings)', letterSpacing: '0.06em', flexShrink: 0,
                              background: meta.bg, border: `1px solid ${meta.border}`, color: meta.text,
                            }}>
                              {meta.label}
                            </span>
                            <span style={{ flex: 1, fontSize: '13px', color: 'var(--sand-light)', fontFamily: 'var(--font-headings)', minWidth: '100px' }}>
                              {t.subject}
                            </span>
                            <span style={{ fontSize: '10px', color: 'var(--sand-dark)', fontFamily: 'monospace', flexShrink: 0 }}>
                              {formatDate(t.submitted_at)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </SectionCard>
              ) : (
                /* ── NEW TICKET FORM ── */
                <>
              {feedbackDone ? (
                <SectionCard title="Message Received" subtitle="Your scroll has been delivered to the temple scribes.">
                  <div style={{ textAlign: 'center', padding: '32px 0' }}>
                    <div style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '50%',
                      background: 'rgba(52,211,153,0.1)',
                      border: '1px solid rgba(52,211,153,0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 16px',
                    }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <h3 style={{ fontSize: '16px', color: '#34D399', fontFamily: 'var(--font-headings)', letterSpacing: '0.08em', margin: '0 0 8px' }}>
                      Submission Received
                    </h3>
                    <p style={{ fontSize: '13px', color: 'var(--sand-dim)', lineHeight: 1.6, margin: '0 0 24px' }}>
                      Thank you for reaching out. We review all feedback and will follow up at your registered email if needed.
                    </p>
                    <button
                      onClick={() => setFeedbackDone(false)}
                      style={{
                        background: 'rgba(212,175,55,0.08)',
                        border: '1px solid rgba(212,175,55,0.2)',
                        borderRadius: '8px',
                        color: 'var(--gold)',
                        padding: '8px 20px',
                        fontSize: '12px',
                        fontFamily: 'var(--font-headings)',
                        letterSpacing: '0.08em',
                        cursor: 'pointer',
                      }}
                    >
                      Send Another
                    </button>
                  </div>
                </SectionCard>
              ) : (
                <>
                  <SectionCard title="Support & Feedback" subtitle="Send a message to the Tjesa team. We read every submission.">
                    <form onSubmit={handleFeedbackSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

                      {/* Public Feedback Board Link */}
                      <div style={{
                        padding: '12px 14px',
                        background: 'rgba(212,175,55,0.04)',
                        border: '1px solid rgba(212,175,55,0.15)',
                        borderRadius: '8px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '12px',
                        marginBottom: '4px'
                      }}>
                        <div>
                          <div style={{ fontSize: '11px', color: 'var(--gold-bright)', fontFamily: 'var(--font-headings)', letterSpacing: '0.04em', fontWeight: 'bold' }}>
                            PUBLIC FEEDBACK & ROADMAP
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--sand-dim)', marginTop: '2px', fontFamily: 'var(--font-body)' }}>
                            Browse suggestions, upvote requested features, or check the product roadmap.
                          </div>
                        </div>
                        <NextLink
                          href="/feedback"
                          className="kemet-btn-secondary"
                          style={{
                            padding: '6px 14px',
                            fontSize: '11px',
                            height: 'auto',
                            minHeight: 'unset',
                            whiteSpace: 'nowrap',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          View Board
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                            <polyline points="12 5 19 12 12 19"></polyline>
                          </svg>
                        </NextLink>
                      </div>

                      {/* Category */}
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', color: 'var(--sand-dim)', marginBottom: '6px', fontFamily: 'var(--font-headings)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                          Category
                        </label>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {['Bug Report', 'Feature Request', 'General Feedback', 'Account Issue'].map(cat => (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => setFeedbackCategory(cat)}
                              style={{
                                padding: '7px 14px',
                                borderRadius: '6px',
                                border: feedbackCategory === cat
                                  ? '1px solid rgba(212,175,55,0.5)'
                                  : '1px solid rgba(212,175,55,0.12)',
                                background: feedbackCategory === cat
                                  ? 'rgba(212,175,55,0.1)'
                                  : 'transparent',
                                color: feedbackCategory === cat ? 'var(--gold-bright)' : 'var(--sand-dark)',
                                fontSize: '12px',
                                fontFamily: 'var(--font-headings)',
                                letterSpacing: '0.04em',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                              }}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Subject */}
                      <div>
                        <label className="kemet-label" htmlFor="feedback-subject" style={{ display: 'block', fontSize: '11px', color: 'var(--sand-dim)', marginBottom: '6px' }}>
                          SUBJECT
                        </label>
                        <input
                          id="feedback-subject"
                          type="text"
                          className="kemet-input"
                          placeholder="Brief summary of your message…"
                          value={feedbackSubject}
                          onChange={e => setFeedbackSubject(e.target.value)}
                          maxLength={120}
                          disabled={feedbackLoading}
                          style={{ background: 'rgba(var(--obsidian-rgb), 0.5)' }}
                        />
                      </div>

                      {/* Message */}
                      <div>
                        <label className="kemet-label" htmlFor="feedback-message" style={{ display: 'block', fontSize: '11px', color: 'var(--sand-dim)', marginBottom: '6px' }}>
                          MESSAGE
                        </label>
                        <textarea
                          id="feedback-message"
                          className="kemet-input"
                          placeholder="Describe your issue, idea, or feedback in detail…"
                          value={feedbackMessage}
                          onChange={e => setFeedbackMessage(e.target.value)}
                          disabled={feedbackLoading}
                          rows={6}
                          maxLength={2000}
                          style={{
                            background: 'rgba(var(--obsidian-rgb), 0.5)',
                            resize: 'vertical',
                            minHeight: '120px',
                            fontFamily: 'var(--font-body)',
                            lineHeight: 1.6,
                          }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}>
                          <span style={{ fontSize: '10px', color: 'var(--sand-dark)', fontFamily: 'var(--font-body)' }}>
                            {feedbackMessage.length < 10 && feedbackMessage.length > 0 ? 'At least 10 characters required' : ''}
                          </span>
                          <span style={{ fontSize: '10px', color: 'var(--sand-dark)', fontFamily: 'monospace' }}>
                            {feedbackMessage.length}/2000
                          </span>
                        </div>
                      </div>

                      {/* From */}
                      <div style={{
                        padding: '10px 14px',
                        background: 'rgba(212,175,55,0.03)',
                        border: '1px solid rgba(212,175,55,0.08)',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                      }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--gold-dim)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                        </svg>
                        <span style={{ fontSize: '11px', color: 'var(--sand-dark)', fontFamily: 'var(--font-body)' }}>
                          Sending as <strong style={{ color: 'var(--sand-dim)' }}>{user?.email}</strong>
                        </span>
                      </div>

                      <button
                        type="submit"
                        className="kemet-btn"
                        disabled={feedbackLoading || !feedbackCategory || !feedbackSubject.trim() || feedbackMessage.trim().length < 10}
                        style={{ padding: '9px 22px', fontSize: '12px', alignSelf: 'flex-start', height: 'auto', minHeight: 'unset' }}
                      >
                        {feedbackLoading ? (
                          <>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 1s linear infinite' }}>
                              <path d="M21 12a9 9 0 0 0-9-9" strokeLinecap="round" />
                            </svg>
                            Sending…
                          </>
                        ) : 'Send Message'}
                      </button>
                    </form>
                  </SectionCard>

                  <SectionCard title="Other Ways to Reach Us" subtitle="Additional channels if you need faster support.">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {[
                        {
                          icon: (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
                            </svg>
                          ),
                          label: 'Email Support',
                          value: 'support@tjesa.com',
                          note: 'General inquiries & account help',
                        },
                        {
                          icon: (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                          ),
                          label: 'Response Time',
                          value: 'Within 24–48 hours',
                          note: 'We reply to all messages',
                        },
                      ].map(item => (
                        <div key={item.label} style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '14px',
                          padding: '12px 14px',
                          background: 'rgba(212,175,55,0.03)',
                          border: '1px solid rgba(212,175,55,0.08)',
                          borderRadius: '8px',
                        }}>
                          <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '8px',
                            background: 'rgba(212,175,55,0.06)',
                            border: '1px solid rgba(212,175,55,0.12)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}>
                            {item.icon}
                          </div>
                          <div>
                            <div style={{ fontSize: '12px', color: 'var(--sand-light)', fontFamily: 'var(--font-headings)', letterSpacing: '0.04em', marginBottom: '2px' }}>
                              {item.value}
                            </div>
                            <div style={{ fontSize: '10px', color: 'var(--sand-dark)', fontFamily: 'var(--font-body)' }}>
                              {item.note}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </SectionCard>
                </>
              )}
              </>
              )}
            </div>
            );
          })()}

          {/* ══ DANGER ZONE TAB ══════════════════════════════════ */}
          {activeTab === 'danger' && (
            <div>
              <SectionCard
                title="Sign Out"
                subtitle="End your current session and return to the gateway."
                accentColor="linear-gradient(90deg, rgba(168,36,36,0.6), rgba(168,36,36,0.2))"
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                  <p style={{ fontSize: '13px', color: 'var(--sand-dim)', lineHeight: 1.6, margin: 0, maxWidth: '400px' }}>
                    You will be signed out of all active sessions. Your data and connections remain intact.
                  </p>
                  <button
                    className="danger-btn"
                    onClick={handleSignOut}
                    disabled={signOutLoading}
                    style={{
                      border: '1px solid rgba(168,36,36,0.35)',
                      background: 'rgba(168,36,36,0.08)',
                      color: '#FF9F9F',
                    }}
                    onMouseOver={e => { e.currentTarget.style.background = 'rgba(168,36,36,0.15)'; e.currentTarget.style.borderColor = 'rgba(168,36,36,0.6)'; }}
                    onMouseOut={e => { e.currentTarget.style.background = 'rgba(168,36,36,0.08)'; e.currentTarget.style.borderColor = 'rgba(168,36,36,0.35)'; }}
                  >
                    {signOutLoading ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 1s linear infinite' }}>
                        <path d="M21 12a9 9 0 0 0-9-9" strokeLinecap="round" />
                      </svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                    )}
                    {signOutLoading ? 'Signing out...' : 'Sign Out'}
                  </button>
                </div>
              </SectionCard>

              <SectionCard
                title="Sever All Connections"
                subtitle="Disconnect all Notion workspaces from your account."
                accentColor="linear-gradient(90deg, rgba(168,36,36,0.4), rgba(168,36,36,0.1))"
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                  <p style={{ fontSize: '13px', color: 'var(--sand-dim)', lineHeight: 1.6, margin: 0, maxWidth: '400px' }}>
                    Removes all Notion integrations from your account. Individual tool configurations are preserved but inactive.
                  </p>
                  <button
                    className="danger-btn"
                    onClick={() => handleDisconnect(null)}
                    disabled={!!disconnecting || accounts.length === 0}
                    style={{
                      border: '1px solid rgba(168,36,36,0.35)',
                      background: 'rgba(168,36,36,0.08)',
                      color: '#FF9F9F',
                      opacity: accounts.length === 0 ? 0.4 : 1,
                    }}
                    onMouseOver={e => { if (accounts.length > 0) { e.currentTarget.style.background = 'rgba(168,36,36,0.15)'; } }}
                    onMouseOut={e => { e.currentTarget.style.background = 'rgba(168,36,36,0.08)'; }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                    Sever All
                  </button>
                </div>
              </SectionCard>

              <SectionCard
                title="Delete Account"
                subtitle="Permanently erase your account from the sacred archives."
                accentColor="linear-gradient(90deg, #A82424, rgba(168,36,36,0.2))"
              >
                <div style={{
                  padding: '14px',
                  background: 'rgba(168,36,36,0.06)',
                  border: '1px solid rgba(168,36,36,0.2)',
                  borderRadius: '8px',
                  marginBottom: '16px',
                }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <span style={{ color: '#FF9F9F', display: 'flex', alignItems: 'center', flexShrink: 0 }}><AlertTriangle size={16} /></span>
                    <p style={{ fontSize: '12px', color: '#FF9F9F', lineHeight: 1.6, margin: 0 }}>
                      <strong>This action is irreversible.</strong> Your account, all Notion connections, and all tool configurations will be permanently deleted. This cannot be undone.
                    </p>
                  </div>
                </div>

                <button
                  className="danger-btn"
                  onClick={() => setDeleteModalOpen(true)}
                  style={{
                    border: '1px solid rgba(168,36,36,0.5)',
                    background: 'rgba(168,36,36,0.12)',
                    color: '#FF7F7F',
                    fontWeight: 700,
                  }}
                  onMouseOver={e => { e.currentTarget.style.background = 'rgba(168,36,36,0.2)'; }}
                  onMouseOut={e => { e.currentTarget.style.background = 'rgba(168,36,36,0.12)'; }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6M14 11v6" />
                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                  </svg>
                  Delete My Account
                </button>
              </SectionCard>
            </div>
          )}
        </div>
      </div>

      {/* ── DELETE CONFIRMATION MODAL ─────────────────────────── */}
      {deleteModalOpen && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(7,7,6,0.88)',
          backdropFilter: 'blur(8px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 9998, padding: '20px',
          animation: 'fadeSlideUp 0.2s ease both',
        }}>
          <div style={{
            background: 'var(--obsidian-mid)',
            border: '1px solid rgba(168,36,36,0.5)',
            borderRadius: '12px',
            maxWidth: '440px',
            width: '100%',
            overflow: 'hidden',
            boxShadow: '0 0 30px rgba(168,36,36,0.2), 0 20px 40px rgba(0,0,0,0.9)',
          }}>
            <div style={{ height: '3px', background: 'linear-gradient(90deg, #A82424, rgba(168,36,36,0.2))' }} />
            <div style={{ padding: '28px 24px' }}>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px', color: '#FF7F7F' }}>
                  <AlertTriangle size={32} />
                </div>
                <h3 style={{ color: '#FF7F7F', fontFamily: 'var(--font-headings)', fontSize: '18px', letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>
                  Confirm Deletion
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--sand-dim)', marginTop: '8px', lineHeight: 1.5 }}>
                  Type <strong style={{ color: '#FF7F7F' }}>DELETE</strong> below to permanently erase your account.
                </p>
              </div>

              <input
                type="text"
                className="kemet-input"
                placeholder="Type DELETE to confirm"
                value={deleteConfirm}
                onChange={e => setDeleteConfirm(e.target.value)}
                style={{ marginBottom: '16px', borderColor: deleteConfirm === 'DELETE' ? 'rgba(168,36,36,0.6)' : undefined }}
              />

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => { setDeleteModalOpen(false); setDeleteConfirm(''); }}
                  style={{
                    flex: 1,
                    padding: '10px',
                    border: '1px solid rgba(212,175,55,0.2)',
                    borderRadius: '8px',
                    background: 'transparent',
                    color: 'var(--sand-dim)',
                    fontFamily: 'var(--font-headings)',
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  disabled={deleteConfirm !== 'DELETE' || deleteLoading}
                  onClick={handleDeleteAccount}
                  style={{
                    flex: 1,
                    padding: '10px',
                    border: '1px solid rgba(168,36,36,0.5)',
                    borderRadius: '8px',
                    background: deleteConfirm === 'DELETE' ? 'rgba(168,36,36,0.2)' : 'rgba(168,36,36,0.05)',
                    color: deleteConfirm === 'DELETE' ? '#FF7F7F' : 'rgba(168,36,36,0.3)',
                    fontFamily: 'var(--font-headings)',
                    fontSize: '12px',
                    cursor: deleteConfirm === 'DELETE' ? 'pointer' : 'not-allowed',
                    fontWeight: 700,
                    transition: 'all 0.2s ease',
                  }}
                >
                  {deleteLoading ? 'Severing...' : 'Delete Forever'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}
