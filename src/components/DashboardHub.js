'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from './Header';
import GlowingCard from './GlowingCard';
import { Zap } from 'lucide-react';

export default function DashboardHub({ userAccounts = [], user, initialConfigs = [] }) {
  const router = useRouter();

  // Helper for Scribe relative time formatting
  const getRelativeTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 1000 / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const activeConfigs = initialConfigs.filter(c => c.active);
  const totalSuccessCount = initialConfigs.reduce((acc, c) => acc + (c.last_sync_success_count || 0), 0);
  const totalConfigsCount = initialConfigs.length;
  const chartsCount = initialConfigs.filter(c => c.tool === 'charts_observatory').length;
  const formsCount = initialConfigs.filter(c => c.tool === 'form_builder').length;

  const recentSyncs = [...initialConfigs]
    .filter(c => c.last_sync)
    .sort((a, b) => new Date(b.last_sync) - new Date(a.last_sync))
    .slice(0, 5);

  const handleDisconnect = async () => {
    try {
      const response = await fetch('/api/auth/disconnect', { method: 'POST' });
      if (response.ok) {
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const firstAccount = userAccounts && userAccounts.length > 0 ? userAccounts[0] : null;

  const instruments = [
    {
      id: 'qr',
      name: 'QR Code Generator',
      subtitle: 'The Glyph Carver',
      description: 'Translate links inside your Notion database rows into dynamic, scannable QR Code image assets that render inline in your tables.',
      status: 'active',
      actionText: 'Open QR Generator',
      path: '/dashboard/qr',
      icon: (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.5">
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
      description: 'Visualize database properties, tasks progress, and financial values as sleek, interactive charts and dashboard observatories.',
      status: 'locked',
      actionText: 'Open Charts Observatory',
      path: '/dashboard/charts',
      icon: (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.5">
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
      description: 'Build public-facing, themed survey forms that automatically populate survey records directly into your Notion database scrolls.',
      status: 'locked',
      actionText: 'Open Form Builder',
      path: '/dashboard/forms',
      icon: (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.5">
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
      description: 'Generate a public, themed blog or wiki dashboard directly from a Notion database. Write your articles in Notion, publish instantly.',
      status: 'locked',
      actionText: 'Open CMS Publisher',
      path: '/dashboard/publisher',
      icon: (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.5">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      )
    },
    {
      id: 'sphinx',
      name: 'Portal Security & Vaults',
      subtitle: 'The Sphinx Shield',
      description: 'Safeguard your public scrolls. Protect your generated sites, observatories, or Nile surveys with secure passwords and client gates.',
      status: 'locked',
      actionText: 'Open Security Vaults',
      path: '/dashboard/sphinx',
      icon: (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.5">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      )
    },
    {
      id: 'pdf',
      name: 'PDF & Document Exporter',
      subtitle: 'The Rosetta Press',
      description: 'Convert Notion document pages into print-ready PDF scrolls. Choose visual templates, page margins, and download instantly.',
      status: 'locked',
      actionText: 'Open PDF Exporter',
      path: '/dashboard/pdf',
      icon: (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.5">
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
      description: 'Send bulk email newsletters and template campaigns directly to contact lists inside your Notion database scrolls. Map columns to variables and track delivery status.',
      status: 'locked',
      actionText: 'Open Mail Campaigns',
      path: '/dashboard/mail',
      icon: (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.5">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <polyline points="22,6 12,13 2,6" />
        </svg>
      )
    },
    {
      id: 'social',
      name: 'Automatic Social Dispatch',
      subtitle: 'The Royal Herald',
      description: 'Auto-publish database rows containing drafted captions and images directly to social channels. Configure custom webhooks and track publishing dates.',
      status: 'locked',
      actionText: 'Open Social Dispatch',
      path: '/dashboard/social',
      icon: (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.5">
          <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
        </svg>
      )
    }
  ];

  const connectedCount = userAccounts ? userAccounts.filter(a => instruments.some(inst => inst.id === a.tool)).length : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', zIndex: 1 }}>
      <Header account={firstAccount} onDisconnect={handleDisconnect} />
      
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes greenPulse {
          0% { transform: scale(0.92); opacity: 0.6; }
          50% { transform: scale(1.08); opacity: 1; }
          100% { transform: scale(0.92); opacity: 0.6; }
        }
        .pulse-indicator {
          animation: greenPulse 2s infinite ease-in-out;
        }
      ` }} />

      <div className="container" style={{ padding: '60px 24px', flex: 1, maxWidth: '1100px' }}>
        {/* Hub Header */}
        <div style={{ marginBottom: '40px', textAlign: 'center' }}>
          <span style={{ fontSize: '12px', color: 'var(--gold)', letterSpacing: '0.2em', fontFamily: 'var(--font-headings)' }}>
            TJESA INTEGRATED SUITE
          </span>
          <h1 style={{ fontSize: '42px', marginTop: '6px', textTransform: 'uppercase', fontFamily: 'var(--font-headings)' }}>
            Tools & Integrations
          </h1>
          <p style={{ maxWidth: '650px', fontSize: '15px', marginTop: '12px', marginLeft: 'auto', marginRight: 'auto', color: 'var(--sand-dim)', lineHeight: 1.6 }}>
            Select an instrument from the archives to integrate with your workspace database scrolls. All tools connect securely with their bound Notion integration keys.
          </p>
        </div>

        {/* Integration Progress and Status Summary */}
        <div style={{
          background: 'rgba(212, 175, 55, 0.02)',
          border: '1px solid rgba(212, 175, 55, 0.1)',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '40px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.4)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--gold)', letterSpacing: '0.1em', fontFamily: 'var(--font-headings)', textTransform: 'uppercase' }}>
                Sacred Binding Status
              </span>
              <h2 style={{ fontSize: '20px', margin: '4px 0 0 0', textTransform: 'uppercase', fontFamily: 'var(--font-headings)', color: 'var(--sand-light)', letterSpacing: '0.05em' }}>
                {connectedCount > 0 
                  ? `${connectedCount} of 8 Instruments Bound` 
                  : 'No Instruments Bound'}
              </h2>
            </div>
            {firstAccount && (
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '11px', color: 'var(--sand-dim)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Workspace</span>
                <strong style={{ fontSize: '15px', color: 'var(--gold)', fontFamily: 'var(--font-headings)' }}>{firstAccount.workspace_name}</strong>
              </div>
            )}
          </div>
          
          {/* Progress Bar */}
          <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '3px', overflow: 'hidden', position: 'relative' }}>
            <div style={{ 
              width: `${(connectedCount / 8) * 100}%`, 
              height: '100%', 
              background: 'linear-gradient(90deg, var(--gold-dim), var(--gold))', 
              borderRadius: '3px',
              transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 0 10px var(--gold-glow)'
            }} />
          </div>

          <div style={{ fontSize: '11px', color: 'var(--sand-dim)', display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <Zap size={12} fill="currentColor" style={{ color: 'var(--gold)' }} />
            <span>Each tool connects to its own Notion Integration separately.</span>
          </div>
        </div>

        {/* Dynamic Analytics & Scribe Ledger Section */}
        {(
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', marginBottom: '40px' }}>
            {/* Stats Cards Row */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
              gap: '24px'
            }}>
              <GlowingCard title="ACTIVE SYNCS" subtitle="Currently running databases">
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
                  <span style={{ fontSize: '36px', fontWeight: 'bold', color: 'var(--gold)', fontFamily: 'var(--font-headings)', textShadow: '0 0 10px var(--gold-glow)' }}>
                    {activeConfigs.length}
                  </span>
                  <span style={{ fontSize: '13px', color: 'var(--sand-dim)' }}>
                    / {totalConfigsCount} total
                  </span>
                </div>
              </GlowingCard>

              <GlowingCard title="GLYPHS CARVED" subtitle="Total successful records synced">
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
                  <span style={{ fontSize: '36px', fontWeight: 'bold', color: 'var(--gold)', fontFamily: 'var(--font-headings)', textShadow: '0 0 10px var(--gold-glow)' }}>
                    {totalSuccessCount}
                  </span>
                  <span style={{ fontSize: '13px', color: 'var(--sand-dim)' }}>
                    records
                  </span>
                </div>
              </GlowingCard>

              <GlowingCard title="OBSERVATORIES" subtitle="Charts Observatory active">
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
                  <span style={{ fontSize: '36px', fontWeight: 'bold', color: 'var(--gold)', fontFamily: 'var(--font-headings)', textShadow: '0 0 10px var(--gold-glow)' }}>
                    {chartsCount}
                  </span>
                  <span style={{ fontSize: '13px', color: 'var(--sand-dim)' }}>
                    active
                  </span>
                </div>
              </GlowingCard>

              <GlowingCard title="SURVEY FORMS" subtitle="Active forms collecting data">
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
                  <span style={{ fontSize: '36px', fontWeight: 'bold', color: 'var(--gold)', fontFamily: 'var(--font-headings)', textShadow: '0 0 10px var(--gold-glow)' }}>
                    {formsCount}
                  </span>
                  <span style={{ fontSize: '13px', color: 'var(--sand-dim)' }}>
                    launched
                  </span>
                </div>
              </GlowingCard>
            </div>

            {/* Split Section: Scribe Ledger & Active Map */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 450px), 1fr))',
              gap: '32px'
            }}>
              {/* Scribe Ledger */}
              <GlowingCard title="The Scribe Ledger" subtitle="Unified real-time sync audit log">
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  maxHeight: '300px',
                  overflowY: 'auto',
                  paddingRight: '6px'
                }}>
                  {recentSyncs.length === 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '32px 0', color: 'var(--sand-dark)', fontSize: '13px' }}>
                      <Zap size={18} style={{ opacity: 0.5 }} />
                      <span>No entries carved yet. Sync an instrument database to trigger log recording.</span>
                    </div>
                  ) : (
                    recentSyncs.map((cfg) => {
                      const inst = instruments.find(i => i.id === cfg.tool || (cfg.tool === 'qr_generator' && i.id === 'qr') || (cfg.tool === 'charts_observatory' && i.id === 'charts') || (cfg.tool === 'form_builder' && i.id === 'forms') || (cfg.tool === 'papyrus_publisher' && i.id === 'publisher') || (cfg.tool === 'pdf_exporter' && i.id === 'pdf') || (cfg.tool === 'mail_dispatcher' && i.id === 'mail') || (cfg.tool === 'social_herald' && i.id === 'social'));
                      
                      return (
                        <div key={cfg.id} style={{
                          background: 'rgba(13, 13, 11, 0.5)',
                          border: '1px solid rgba(212, 175, 55, 0.1)',
                          borderRadius: '8px',
                          padding: '12px 16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                            <div style={{
                              padding: '8px',
                              background: 'rgba(212, 175, 55, 0.05)',
                              border: '1px solid rgba(212, 175, 55, 0.15)',
                              borderRadius: '6px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'var(--gold)'
                            }}>
                              {inst ? React.cloneElement(inst.icon, { width: '16', height: '16' }) : <Zap size={16} />}
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <span style={{ fontSize: '12px', color: 'var(--sand-light)', fontWeight: 'bold', display: 'block', textTransform: 'uppercase', letterSpacing: '0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {inst?.name || cfg.tool}
                              </span>
                              <span style={{ fontSize: '11px', color: 'var(--sand-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                                Database: <strong>{cfg.database_name}</strong>
                              </span>
                            </div>
                          </div>

                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <span style={{
                              fontSize: '9px',
                              padding: '2px 8px',
                              background: cfg.active ? 'rgba(52, 211, 153, 0.08)' : 'rgba(212, 175, 55, 0.04)',
                              color: cfg.active ? '#34D399' : 'var(--sand-dim)',
                              border: cfg.active ? '1px solid rgba(52, 211, 153, 0.2)' : '1px solid rgba(212, 175, 55, 0.1)',
                              borderRadius: '12px',
                              fontFamily: 'var(--font-headings)',
                              letterSpacing: '0.05em',
                              fontWeight: 'bold',
                              display: 'inline-block',
                              marginBottom: '4px'
                            }}>
                              {cfg.active ? 'ACTIVE' : 'INACTIVE'}
                            </span>
                            <span style={{ display: 'block', fontSize: '10px', color: 'var(--sand-dark)' }}>
                              {getRelativeTime(cfg.last_sync)}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </GlowingCard>

              {/* Active Integrations Map */}
              <GlowingCard title="Active Integrations Map" subtitle="Current database synchronization routes">
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  maxHeight: '300px',
                  overflowY: 'auto'
                }}>
                  {initialConfigs.length === 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '32px 0', color: 'var(--sand-dark)', fontSize: '13px' }}>
                      <Zap size={18} style={{ opacity: 0.5 }} />
                      <span>No database routes mapped.</span>
                    </div>
                  ) : (
                    initialConfigs.map((cfg) => {
                      const inst = instruments.find(i => i.id === cfg.tool || (cfg.tool === 'qr_generator' && i.id === 'qr') || (cfg.tool === 'charts_observatory' && i.id === 'charts') || (cfg.tool === 'form_builder' && i.id === 'forms') || (cfg.tool === 'papyrus_publisher' && i.id === 'publisher') || (cfg.tool === 'pdf_exporter' && i.id === 'pdf') || (cfg.tool === 'mail_dispatcher' && i.id === 'mail') || (cfg.tool === 'social_herald' && i.id === 'social'));
                      
                      return (
                        <div key={cfg.id} style={{
                          padding: '12px',
                          borderBottom: '1px solid rgba(212, 175, 55, 0.08)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '16px'
                        }}>
                          <div style={{ minWidth: 0 }}>
                            <span style={{ fontSize: '13px', color: 'var(--sand-light)', fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                              {cfg.database_name}
                            </span>
                            <span style={{ fontSize: '10px', color: 'var(--gold)', letterSpacing: '0.02em', textTransform: 'uppercase', fontFamily: 'var(--font-headings)' }}>
                              {inst?.subtitle || cfg.tool}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                            <span style={{ fontSize: '11px', color: 'var(--sand-dim)' }}>
                              {cfg.settings?.trigger_type ? `Trigger: ${cfg.settings.trigger_type}` : 'Auto-polling'}
                            </span>
                            <Link 
                              href={inst?.path || '/dashboard'}
                              className="kemet-btn-secondary"
                              style={{ padding: '4px 10px', fontSize: '10px', height: 'auto', minHeight: 'unset' }}
                            >
                              Manage
                            </Link>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </GlowingCard>
            </div>
          </div>
        )}

        {/* Instruments Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', 
          gap: '32px',
          marginTop: '24px'
        }}>
          {instruments.map(inst => {
            const isConnected = userAccounts && userAccounts.some(a => a.tool === inst.id);
            const isLocked = inst.status === 'locked';
            const badgeText = isLocked ? 'COMING SOON' : isConnected ? 'READY' : 'NOT CONNECTED';
            const actionText = isLocked ? 'Coming Soon' : isConnected ? inst.actionText : 'Setup Connection';
            
            const cardStyle = isConnected ? {
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              borderColor: 'rgba(212, 175, 55, 0.4)',
              background: 'linear-gradient(180deg, rgba(20, 19, 17, 0.8) 0%, rgba(28, 25, 21, 0.9) 100%)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6), 0 0 15px rgba(212, 175, 55, 0.05)'
            } : {
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            };

            return (
              <div 
                key={inst.id} 
                style={{ 
                  opacity: inst.status === 'locked' ? 0.75 : 1,
                  transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease',
                  display: 'flex',
                  flexDirection: 'column'
                }}
                onMouseEnter={(e) => {
                  if (inst.status !== 'locked') e.currentTarget.style.transform = 'translateY(-6px)';
                }}
                onMouseLeave={(e) => {
                  if (inst.status !== 'locked') e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <GlowingCard title={inst.name} subtitle={inst.subtitle} style={cardStyle}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1, justifyContent: 'space-between' }}>
                    
                    {/* Icon & Badge Row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ 
                        padding: '12px', 
                        background: isConnected ? 'rgba(212, 175, 55, 0.08)' : 'rgba(212, 175, 55, 0.03)', 
                        border: isConnected ? '1px solid rgba(212, 175, 55, 0.25)' : '1px solid rgba(212, 175, 55, 0.1)', 
                        borderRadius: '8px',
                        boxShadow: isConnected ? '0 0 12px rgba(212, 175, 55, 0.15)' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {isConnected ? React.cloneElement(inst.icon, { stroke: 'var(--gold-bright)', style: { filter: 'drop-shadow(0 0 4px var(--gold-glow))' } }) : inst.icon}
                      </div>
                      <span style={{
                        fontSize: '9px',
                        padding: '4px 10px',
                        fontFamily: 'var(--font-headings)',
                        letterSpacing: '0.05em',
                        borderRadius: '20px',
                        background: isLocked ? 'rgba(255,255,255,0.03)' : isConnected ? 'rgba(52, 211, 153, 0.08)' : 'rgba(212, 175, 55, 0.02)',
                        color: isLocked ? 'rgba(255,255,255,0.25)' : isConnected ? '#34D399' : 'var(--sand-dim)',
                        border: isLocked ? '1px solid rgba(255,255,255,0.08)' : isConnected ? '1px solid rgba(52, 211, 153, 0.25)' : '1px solid rgba(212, 175, 55, 0.12)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontWeight: 'bold',
                        boxShadow: isConnected && !isLocked ? '0 0 8px rgba(52, 211, 153, 0.15)' : 'none'
                      }}>
                        {isLocked && (
                          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                          </svg>
                        )}
                        {!isLocked && isConnected && (
                          <span
                            className="pulse-indicator"
                            style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              background: '#34D399',
                              boxShadow: '0 0 6px #34D399'
                            }}
                          />
                        )}
                        {badgeText}
                      </span>
                    </div>

                    {/* Description */}
                    <p style={{ fontSize: '13px', color: 'var(--sand-dim)', lineHeight: 1.5, flex: 1 }}>
                      {inst.description}
                    </p>

                    {/* Action Button */}
                    <button
                      className={isConnected ? 'kemet-btn' : 'kemet-btn-secondary'}
                      style={{ 
                        width: '100%', 
                        justifyContent: 'center', 
                        opacity: inst.status === 'locked' ? 0.5 : 1,
                        cursor: inst.status === 'locked' ? 'not-allowed' : 'pointer',
                        padding: isConnected ? '12px 28px' : '11px 27px',
                        boxShadow: isConnected ? '0 4px 15px rgba(212, 175, 55, 0.25)' : 'none'
                      }}
                      disabled={inst.status === 'locked'}
                      onClick={() => {
                        if (inst.status === 'active') {
                          router.push(inst.path);
                        }
                      }}
                    >
                      {isConnected ? `${actionText} →` : actionText}
                    </button>

                  </div>
                </GlowingCard>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
