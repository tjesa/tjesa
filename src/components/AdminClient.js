'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from './Header';
import GlowingCard from './GlowingCard';
import EyeOfHorusLoader from './EyeOfHorusLoader';

export default function AdminClient({ account }) {
  const router = useRouter();
  const [emails, setEmails] = useState([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // 1. Fetch waitlist emails on mount
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
    const headers = ['Email', 'Registered At'];
    const rows = emails.map(e => [
      e.email,
      new Date(e.registered_at).toISOString()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(val => `"${val.replace(/"/g, '""')}"`).join(','))
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

  // 3. Filter emails
  const filteredEmails = emails.filter(e => 
    e.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', zIndex: 1 }}>
      <Header account={account} onDisconnect={handleDisconnect} />

      <div className="container" style={{ padding: '40px 24px', flex: 1, maxWidth: '800px' }}>
        
        {/* Page Header */}
        <div style={{ marginBottom: '32px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: 'var(--gold)', letterSpacing: '0.15em', fontFamily: 'var(--font-headings)' }}>
            THE WAITLIST LEDGER
          </span>
          <h2 style={{ fontSize: '32px', marginTop: '4px', textTransform: 'uppercase' }}>
            Archived Cartouches
          </h2>
          <p style={{ maxWidth: '600px', fontSize: '14px', marginTop: '8px', color: 'var(--sand-dim)' }}>
            Review all emails recorded in the waiting scrolls. Filter through the archives or export them for mailing campaigns.
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
            ⚠️ {error}
          </div>
        )}

        {isLoading ? (
          <div style={{ padding: '48px 0', textAlign: 'center' }}>
            <EyeOfHorusLoader size={60} text="Opening waitlist papyrus scrolls..." />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
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
                  placeholder="Search emails..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ padding: '10px 14px', fontSize: '14px' }}
                />
              </div>

              {/* Stats & Export */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ fontSize: '12px', color: 'var(--sand-dim)', fontFamily: 'var(--font-headings)', letterSpacing: '0.05em' }}>
                  REGISTRANTS: <strong style={{ color: 'var(--gold)', fontSize: '14px' }}>{emails.length}</strong>
                </div>

                <button 
                  className="kemet-btn"
                  onClick={handleExportCSV}
                  disabled={emails.length === 0}
                  style={{ padding: '10px 20px', fontSize: '12px', height: 'auto', minHeight: 'unset' }}
                >
                  📥 Export CSV
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
                  <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    textAlign: 'left',
                    fontSize: '13px'
                  }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(212,175,55,0.15)', color: 'var(--gold)', fontFamily: 'var(--font-headings)' }}>
                        <th style={{ padding: '10px 12px', fontWeight: 'bold' }}>EMAIL ADDRESS</th>
                        <th style={{ padding: '10px 12px', fontWeight: 'bold', textAlign: 'right' }}>DATE REGISTRATION</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEmails.map((item, index) => (
                        <tr 
                          key={item.id || index}
                          style={{
                            borderBottom: '1px solid rgba(255,255,255,0.03)',
                            background: index % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent',
                            transition: 'background 0.2s ease'
                          }}
                          onMouseOver={e => e.currentTarget.style.background = 'rgba(212,175,55,0.02)'}
                          onMouseOut={e => e.currentTarget.style.background = index % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent'}
                        >
                          <td style={{ padding: '12px', color: 'var(--sand)' }}>{item.email}</td>
                          <td style={{ padding: '12px', color: 'var(--sand-dim)', textAlign: 'right', fontFamily: 'monospace' }}>
                            {new Date(item.registered_at).toLocaleString()}
                          </td>
                        </tr>
                      ))}
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
