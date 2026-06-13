'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Header from './Header';
import GlowingCard from './GlowingCard';
import EyeOfHorusLoader from './EyeOfHorusLoader';
import { createClient } from '@/lib/supabase/client';

export default function AdminClient({ account }) {
  const router = useRouter();
  const [emails, setEmails] = useState([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // 1. Fetch waitlist emails on mount + subscribe to real-time updates
  useEffect(() => {
    async function loadWaitlist() {
      try {
        const response = await fetch('/api/admin/waitlist');
        const data = await response.json();

        if (response.ok && data.success) {
          setEmails(data.emails || []);
        } else {
          setError(data.error || 'Failed to fetch waitlist scroll.');
        }
      } catch (err) {
        setError('A network disruption occurred while reading waitlist archives.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }

    loadWaitlist();

    let channel;
    try {
      const supabase = createClient();
      channel = supabase
        .channel('realtime-waitlist')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'waitlist' },
          (payload) => {
            console.log('Real-time waitlist signup received:', payload.new);
            setEmails((prev) => {
              if (prev.some(e => e.id === payload.new.id || e.email.toLowerCase() === payload.new.email.toLowerCase())) {
                return prev;
              }
              const newEntry = { ...payload.new, newlyInserted: true };
              return [newEntry, ...prev];
            });
          }
        )
        .subscribe();
    } catch (realtimeErr) {
      console.warn('[Real-time] Connection active fallback/bypass:', realtimeErr);
    }

    return () => {
      if (channel) {
        try {
          const supabase = createClient();
          supabase.removeChannel(channel);
        } catch (removeErr) {
          console.error(removeErr);
        }
      }
    };
  }, []);

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

  // 2. Export CSV Helper
  const handleExportCSV = () => {
    if (emails.length === 0) return;

    // Build CSV content
    const headers = ['Name', 'Email Address', 'Excited Tool', 'UTM Source', 'UTM Medium', 'UTM Campaign', 'Registered At'];
    const rows = emails.map(e => [
      e.name || '',
      e.email,
      e.excited_tool || '',
      e.utm_source || '',
      e.utm_medium || '',
      e.utm_campaign || '',
      new Date(e.registered_at).toISOString()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(val => `"${(val || '').replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `tjesa_waitlist_${new Date().toISOString().substring(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 3. Calculate metrics for the dashboard
  const sourceCounts = {};
  const toolCounts = {};

  emails.forEach(e => {
    const src = (e.utm_source || 'Direct / Organic').trim();
    sourceCounts[src] = (sourceCounts[src] || 0) + 1;

    const tool = (e.excited_tool || 'None').trim();
    toolCounts[tool] = (toolCounts[tool] || 0) + 1;
  });

  const sortedSources = Object.entries(sourceCounts).sort((a, b) => b[1] - a[1]);
  const sortedTools = Object.entries(toolCounts).sort((a, b) => b[1] - a[1]);

  // 4. Filter waitlist
  const filteredEmails = emails.filter(e => 
    e.email.toLowerCase().includes(search.toLowerCase()) ||
    (e.name && e.name.toLowerCase().includes(search.toLowerCase())) ||
    (e.excited_tool && e.excited_tool.toLowerCase().includes(search.toLowerCase())) ||
    (e.utm_source && e.utm_source.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', zIndex: 1 }}>
      <Header account={account} onDisconnect={handleDisconnect} />

      <div className="container" style={{ padding: '40px 24px', flex: 1, maxWidth: '1000px' }}>
        
        {/* Page Header */}
        <div style={{ marginBottom: '32px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: 'var(--gold)', letterSpacing: '0.15em', fontFamily: 'var(--font-headings)' }}>
            THE WAITLIST LEDGER
          </span>
          <h2 style={{ fontSize: '32px', marginTop: '4px', textTransform: 'uppercase' }}>
            Archived Cartouches
          </h2>
          <p style={{ maxWidth: '600px', fontSize: '14px', marginTop: '8px', color: 'var(--sand-dim)' }}>
            Review all waitlist registrants recorded in the waiting scrolls. Filter through the archives or export them for mailing campaigns.
          </p>
        </div>

        {error && (
          <div style={{
            padding: '16px',
            background: 'rgba(168, 36, 36, 0.1)',
            border: '1px solid var(--scarab-red)',
            borderRadius: '8px',
            color: '#FF7F7F',
            fontSize: '14px',
            marginBottom: '24px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
          </div>
        )}

        {isLoading ? (
          <div style={{ padding: '48px 0', textAlign: 'center' }}>
            <EyeOfHorusLoader size={60} text="Opening waitlist papyrus scrolls..." />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Real-time Dashboard widgets */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '10px' }}>
              
              {/* Stat 1: Total Registrants */}
              <GlowingCard title="Total Scribes Registered" subtitle="Real-time waitlist size">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '110px' }}>
                  <div style={{ fontSize: '46px', fontFamily: 'var(--font-headings)', color: 'var(--gold)', letterSpacing: '0.05em', fontWeight: 'bold' }}>
                    {emails.length}
                  </div>
                </div>
              </GlowingCard>

              {/* Stat 2: Top UTM Sources */}
              <GlowingCard title="Traffic & UTM Channels" subtitle="Referral distribution breakdown">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', height: '110px', overflowY: 'auto' }} className="sacred-scroll-list">
                  {sortedSources.length === 0 ? (
                    <div style={{ color: 'var(--sand-dark)', fontSize: '12px', textAlign: 'center', padding: '36px 0' }}>No sources captured yet.</div>
                  ) : (
                    sortedSources.slice(0, 4).map(([src, count]) => {
                      const percentage = Math.round((count / emails.length) * 100) || 0;
                      return (
                        <div key={src} style={{ fontSize: '12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                            <span style={{ color: 'var(--sand)', textTransform: 'capitalize', fontWeight: '500' }}>{src}</span>
                            <span style={{ color: 'var(--gold-dim)' }}>{count} ({percentage}%)</span>
                          </div>
                          <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                            <div style={{ width: `${percentage}%`, height: '100%', background: 'var(--gold-gradient)', borderRadius: '10px' }} />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </GlowingCard>

              {/* Stat 3: Tool Popularity */}
              <GlowingCard title="Sacred Tools of Choice" subtitle="Highest interest by tool category">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', height: '110px', overflowY: 'auto' }} className="sacred-scroll-list">
                  {sortedTools.length === 0 ? (
                    <div style={{ color: 'var(--sand-dark)', fontSize: '12px', textAlign: 'center', padding: '36px 0' }}>No tool selections recorded.</div>
                  ) : (
                    sortedTools.slice(0, 4).map(([tool, count]) => {
                      const percentage = Math.round((count / emails.length) * 100) || 0;
                      return (
                        <div key={tool} style={{ fontSize: '12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                            <span style={{ color: 'var(--sand)', textTransform: 'capitalize', fontWeight: '500' }}>{tool}</span>
                            <span style={{ color: 'var(--gold-dim)' }}>{count} ({percentage}%)</span>
                          </div>
                          <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                            <div style={{ width: `${percentage}%`, height: '100%', background: 'linear-gradient(90deg, #8C6E2E, #C9A84C)', borderRadius: '10px' }} />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </GlowingCard>

            </div>

            {/* Stats & Search Row */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px'
            }}>
              {/* Search Bar */}
              <div style={{ flex: 1, minWidth: '260px' }}>
                <input 
                  className="kemet-input"
                  type="text"
                  placeholder="Search name, email, tool, or UTM source..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ padding: '10px 14px', fontSize: '14px' }}
                />
              </div>

              {/* Stats & Export */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ fontSize: '12px', color: 'var(--sand-dim)', fontFamily: 'var(--font-headings)', letterSpacing: '0.05em' }}>
                  SHOWING: <strong style={{ color: 'var(--gold)', fontSize: '14px' }}>{filteredEmails.length}</strong> of {emails.length}
                </div>

                <button 
                  className="kemet-btn"
                  onClick={handleExportCSV}
                  disabled={emails.length === 0}
                  style={{ padding: '10px 20px', fontSize: '12px', height: 'auto', minHeight: 'unset' }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <Download size={14} /> Export CSV
                  </span>
                </button>
              </div>
            </div>

            {/* Waitlist Table */}
            <GlowingCard title="Waitlist Scroll Records" subtitle="Archived registry chronological order">
              {filteredEmails.length === 0 ? (
                <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--sand-dark)', padding: '24px 0', margin: 0 }}>
                  {emails.length === 0 ? 'No scribes have carved their names yet.' : 'No email matches your query.'}
                </p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <style>{`
                    @keyframes rowFlashGlow {
                      0% { background-color: rgba(212, 175, 55, 0.3); }
                      100% { background-color: transparent; }
                    }
                  `}</style>
                  <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    textAlign: 'left',
                    fontSize: '13px'
                  }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(212,175,55,0.15)', color: 'var(--gold)', fontFamily: 'var(--font-headings)' }}>
                        <th style={{ padding: '10px 12px', fontWeight: 'bold' }}>FULL NAME</th>
                        <th style={{ padding: '10px 12px', fontWeight: 'bold' }}>EMAIL ADDRESS</th>
                        <th style={{ padding: '10px 12px', fontWeight: 'bold' }}>EXCITED TOOL</th>
                        <th style={{ padding: '10px 12px', fontWeight: 'bold' }}>UTM SOURCE</th>
                        <th style={{ padding: '10px 12px', fontWeight: 'bold' }}>UTM MEDIUM</th>
                        <th style={{ padding: '10px 12px', fontWeight: 'bold' }}>UTM CAMPAIGN</th>
                        <th style={{ padding: '10px 12px', fontWeight: 'bold', textAlign: 'right' }}>DATE REGISTRATION</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEmails.map((item, index) => {
                        const isNew = item.newlyInserted;
                        return (
                          <tr 
                            key={item.id || index}
                            style={{
                              borderBottom: '1px solid rgba(255,255,255,0.03)',
                              background: index % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent',
                              animation: isNew ? 'rowFlashGlow 4s ease-out forwards' : 'none',
                              transition: 'background 0.2s ease'
                            }}
                            onMouseOver={e => e.currentTarget.style.background = 'rgba(212,175,55,0.04)'}
                            onMouseOut={e => e.currentTarget.style.background = index % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent'}
                          >
                            <td style={{ padding: '12px', color: 'var(--sand)' }}>{item.name || <em style={{ color: 'var(--sand-dark)' }}>Anonymous</em>}</td>
                            <td style={{ padding: '12px', color: 'var(--sand)' }}>{item.email}</td>
                            <td style={{ padding: '12px', color: 'var(--sand)' }}>
                              {item.excited_tool ? (
                                <span style={{
                                  padding: '3px 8px',
                                  background: 'rgba(212,175,55,0.08)',
                                  border: '1px solid rgba(212,175,55,0.15)',
                                  borderRadius: '4px',
                                  fontSize: '11px',
                                  color: 'var(--gold-dim)'
                                }}>
                                  {item.excited_tool}
                                </span>
                              ) : (
                                <span style={{ color: 'var(--sand-dark)' }}>None</span>
                              )}
                            </td>
                            <td style={{ padding: '12px', color: 'var(--sand)' }}>{item.utm_source || <span style={{ color: 'var(--sand-dark)' }}>-</span>}</td>
                            <td style={{ padding: '12px', color: 'var(--sand)' }}>{item.utm_medium || <span style={{ color: 'var(--sand-dark)' }}>-</span>}</td>
                            <td style={{ padding: '12px', color: 'var(--sand)' }}>{item.utm_campaign || <span style={{ color: 'var(--sand-dark)' }}>-</span>}</td>
                            <td style={{ padding: '12px', color: 'var(--sand-dim)', textAlign: 'right', fontFamily: 'monospace' }}>
                              {new Date(item.registered_at).toLocaleString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </GlowingCard>

          </div>
        )}

      </div>
    </div>
  );
}
