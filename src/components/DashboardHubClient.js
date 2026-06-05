'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Header from './Header';
import GlowingCard from './GlowingCard';

export default function DashboardHubClient({ account }) {
  const router = useRouter();

  const handleDisconnect = async () => {
    try {
      const response = await fetch('/api/auth/disconnect', { method: 'POST' });
      if (response.ok) {
        router.push('/');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const instruments = [
    {
      id: 'qr',
      name: 'The Glyph Carver',
      subtitle: 'QR CODE GENERATOR',
      description: 'Translate links inside your Notion database rows into dynamic, scannable QR Code image assets that render inline in your tables.',
      status: 'active',
      badge: 'READY',
      actionText: 'Enter Carving Station',
      path: '/dashboard/tools/qr',
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
      name: 'The Aten Gazer',
      subtitle: 'DATABASE CHARTS & OBSERVATORIES',
      description: 'Visualize database properties, tasks progress, and financial values as sleek, interactive charts and dashboard observatories.',
      status: 'active',
      badge: 'READY',
      actionText: 'Enter Observatory',
      path: '/dashboard/tools/charts',
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
      name: 'The Nile Scribe',
      subtitle: 'NOTION FORMS & SURVEYS',
      description: 'Build public-facing, themed survey forms that automatically populate survey records directly into your Notion database scrolls.',
      status: 'active',
      badge: 'READY',
      actionText: 'Enter Scribe Chambers',
      path: '/dashboard/tools/forms',
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
      name: 'The Papyrus Publisher',
      subtitle: 'NOTION CMS & BLOG GENERATOR',
      description: 'Generate a public, themed blog or wiki dashboard directly from a Notion database. Write your articles in Notion, publish instantly.',
      status: 'active',
      badge: 'READY',
      actionText: 'Enter Publisher Chambers',
      path: '/dashboard/tools/publisher',
      icon: (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.5">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      )
    },
    {
      id: 'sphinx',
      name: 'The Sphinx Shield',
      subtitle: 'PORTAL SECURITY & VAULT GATES',
      description: 'Safeguard your public scrolls. Protect your generated sites, observatories, or Nile surveys with secure passwords and client gates.',
      status: 'active',
      badge: 'READY',
      actionText: 'Enter Sphinx Chambers',
      path: '/dashboard/tools/sphinx',
      icon: (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.5">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      )
    },
    {
      id: 'pdf',
      name: 'The Rosetta Press',
      subtitle: 'PDF & DOCUMENT EXPORTER',
      description: 'Convert Notion document pages into print-ready PDF scrolls. Choose visual templates, page margins, and download instantly.',
      status: 'active',
      badge: 'READY',
      actionText: 'Enter Press Chambers',
      path: '/dashboard/tools/pdf',
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
      name: 'The Nile Dispatch',
      subtitle: 'NOTION MAIL & EMAIL CAMPAIGNS',
      description: 'Send bulk email newsletters and template campaigns directly to contact lists inside your Notion database scrolls. Map columns to variables and track delivery status.',
      status: 'active',
      badge: 'READY',
      actionText: 'Enter Dispatch Chambers',
      path: '/dashboard/tools/mail',
      icon: (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.5">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <polyline points="22,6 12,13 2,6" />
        </svg>
      )
    },
    {
      id: 'social',
      name: 'The Royal Herald',
      subtitle: 'AUTOMATIC SOCIAL MEDIA DISPATCHER',
      description: 'Auto-publish database rows containing drafted captions and images directly to social channels. Configure custom webhooks and track publishing dates.',
      status: 'active',
      badge: 'READY',
      actionText: 'Enter Herald Chambers',
      path: '/dashboard/tools/social',
      icon: (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.5">
          <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
        </svg>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', zIndex: 1 }}>
      <Header account={account} onDisconnect={handleDisconnect} />

      <div className="container" style={{ padding: '60px 24px', flex: 1, maxWidth: '1100px' }}>
        
        {/* Hub Header */}
        <div style={{ marginBottom: '48px', textAlign: 'center' }}>
          <span style={{ fontSize: '12px', color: 'var(--gold)', letterSpacing: '0.2em', fontFamily: 'var(--font-headings)' }}>
            TJESA INTEGRATED SUITE
          </span>
          <h1 style={{ fontSize: '42px', marginTop: '6px', textTransform: 'uppercase', fontFamily: 'var(--font-headings)' }}>
            The Hall of Instruments
          </h1>
          <p style={{ maxWidth: '650px', fontSize: '15px', marginTop: '12px', marginLeft: 'auto', marginRight: 'auto', color: 'var(--sand-dim)', lineHeight: 1.6 }}>
            Select an instrument from the archives to integrate with your workspace database scrolls. All tools connect securely with your binded Notion portal.
          </p>
        </div>

        {/* Instruments Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
          gap: '32px',
          marginTop: '24px'
        }}>
          {instruments.map(inst => (
            <div 
              key={inst.id} 
              style={{ 
                opacity: inst.status === 'locked' ? 0.75 : 1,
                transition: 'transform 0.3s ease, opacity 0.3s ease',
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
              <GlowingCard title={inst.name} subtitle={inst.subtitle} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1, justifyContent: 'space-between' }}>
                  
                  {/* Icon & Badge Row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ 
                      padding: '12px', 
                      background: 'rgba(212, 175, 55, 0.03)', 
                      border: '1px solid rgba(212, 175, 55, 0.1)', 
                      borderRadius: '8px' 
                    }}>
                      {inst.icon}
                    </div>
                    <span style={{
                      fontSize: '9px',
                      padding: '4px 10px',
                      fontFamily: 'var(--font-headings)',
                      letterSpacing: '0.05em',
                      borderRadius: '20px',
                      background: inst.status === 'active' ? 'rgba(52, 211, 153, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                      color: inst.status === 'active' ? '#34D399' : 'var(--sand-dark)',
                      border: inst.status === 'active' ? '1px solid rgba(52, 211, 153, 0.2)' : '1px solid rgba(255, 255, 255, 0.05)'
                    }}>
                      {inst.badge}
                    </span>
                  </div>

                  {/* Description */}
                  <p style={{ fontSize: '13px', color: 'var(--sand-dim)', lineHeight: 1.5, flex: 1 }}>
                    {inst.description}
                  </p>

                  {/* Action Button */}
                  <button
                    className={inst.status === 'active' ? 'kemet-btn' : 'kemet-btn-secondary'}
                    style={{ 
                      width: '100%', 
                      justifyContent: 'center', 
                      opacity: inst.status === 'locked' ? 0.5 : 1,
                      cursor: inst.status === 'locked' ? 'not-allowed' : 'pointer'
                    }}
                    disabled={inst.status === 'locked'}
                    onClick={() => {
                      if (inst.status === 'active') {
                        router.push(inst.path);
                      }
                    }}
                  >
                    {inst.actionText}
                  </button>

                </div>
              </GlowingCard>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
