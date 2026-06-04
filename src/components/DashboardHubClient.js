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
      status: 'locked',
      badge: 'COMING SOON',
      actionText: 'Enter Observatory',
      path: '#',
      icon: (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--sand-dark)" strokeWidth="1.5">
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
