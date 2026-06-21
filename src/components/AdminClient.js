'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, Download, Link as LinkIcon, Copy, Trash2, ExternalLink, Check, Plus, Users, ShieldAlert, Key } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Header from './Header';
import GlowingCard from './GlowingCard';
import EyeOfHorusLoader from './EyeOfHorusLoader';
import { createClient } from '@/lib/supabase/client';
import { playSanctumSound } from '@/lib/audio';

export default function AdminClient({ account }) {
  const router = useRouter();
  const [emails, setEmails] = useState([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Play admin sanctum join sound on mount
  useEffect(() => {
    playSanctumSound();
  }, []);

  // Tabs
  const [activeTab, setActiveTab] = useState('waitlist'); // 'waitlist', 'utm', 'workspaces', or 'feedback'

  // UTM Links State
  const [utmLinks, setUtmLinks] = useState([]);
  const [isUtmLoading, setIsUtmLoading] = useState(true);
  const [isSavingUtm, setIsSavingUtm] = useState(false);
  const [utmError, setUtmError] = useState('');
  const [formCopied, setFormCopied] = useState(false);
  const [copiedLinkId, setCopiedLinkId] = useState(null);

  // UTM Form States
  const [baseUrl, setBaseUrl] = useState('');
  const [utmSource, setUtmSource] = useState('');
  const [utmMedium, setUtmMedium] = useState('');
  const [utmCampaign, setUtmCampaign] = useState('');
  const [utmTerm, setUtmTerm] = useState('');
  const [utmContent, setUtmContent] = useState('');

  // Notion Workspaces State
  const [workspaces, setWorkspaces] = useState([]);
  const [isWorkspacesLoading, setIsWorkspacesLoading] = useState(true);
  const [workspacesError, setWorkspacesError] = useState('');
  const [workspaceSearch, setWorkspaceSearch] = useState('');
  const [isDisconnectingId, setIsDisconnectingId] = useState(null);

  // Feedback State
  const [feedback, setFeedback] = useState([]);
  const [isFeedbackLoading, setIsFeedbackLoading] = useState(true);
  const [feedbackSearch, setFeedbackSearch] = useState('');
  const [feedbackCategoryFilter, setFeedbackCategoryFilter] = useState('All');
  const [expandedFeedbackId, setExpandedFeedbackId] = useState(null);
  const [ticketStatusFilter, setTicketStatusFilter] = useState('All');
  const [ticketSavingId, setTicketSavingId] = useState(null);
  const [ticketDraftNotes, setTicketDraftNotes] = useState({});

  // Invite loading state map
  const [isInvitingId, setIsInvitingId] = useState(null);

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

  // 2. Fetch UTM registry & Notion Workspaces on mount and handle site URL defaults
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        setBaseUrl(window.location.origin);
      }, 0);
    }

    async function loadUtmRegistry() {
      try {
        const response = await fetch('/api/admin/utm');
        const data = await response.json();
        if (response.ok && data.success) {
          setUtmLinks(data.links || []);
        } else {
          setUtmError(data.error || 'Failed to open UTM campaign registry.');
        }
      } catch (err) {
        setUtmError('An error occurred while deciphering UTM registry scrolls.');
        console.error(err);
      } finally {
        setIsUtmLoading(false);
      }
    }

    async function loadWorkspaces() {
      try {
        const response = await fetch('/api/admin/workspaces');
        const data = await response.json();
        if (response.ok && data.success) {
          setWorkspaces(data.workspaces || []);
        } else {
          setWorkspacesError(data.error || 'Failed to open workspaces registry.');
        }
      } catch (err) {
        setWorkspacesError('An error occurred while reading connected Notion workspace credentials.');
        console.error(err);
      } finally {
        setIsWorkspacesLoading(false);
      }
    }

    async function loadFeedback() {
      try {
        const response = await fetch('/api/admin/feedback');
        const data = await response.json();
        if (response.ok && data.success) {
          setFeedback(data.submissions || []);
        }
      } catch (err) {
        console.error('[AdminClient] loadFeedback error:', err);
      } finally {
        setIsFeedbackLoading(false);
      }
    }

    loadUtmRegistry();
    loadWorkspaces();
    loadFeedback();
  }, []);

  // 3. Dynamic URL calculation during rendering
  let generatedUrl = '';
  if (baseUrl) {
    try {
      const urlObj = new URL(baseUrl);
      if (utmSource) urlObj.searchParams.set('utm_source', utmSource.trim());
      if (utmMedium) urlObj.searchParams.set('utm_medium', utmMedium.trim());
      if (utmCampaign) urlObj.searchParams.set('utm_campaign', utmCampaign.trim());
      if (utmTerm) urlObj.searchParams.set('utm_term', utmTerm.trim());
      if (utmContent) urlObj.searchParams.set('utm_content', utmContent.trim());
      generatedUrl = urlObj.toString();
    } catch (_) {
      generatedUrl = '';
    }
  }

  // 4. Save UTM link
  const handleSaveUtmLink = async (e) => {
    e.preventDefault();
    if (!baseUrl || !utmSource || !utmMedium || !utmCampaign) {
      setUtmError('Base URL, Source, Medium, and Campaign are mandatory.');
      return;
    }
    setUtmError('');
    setIsSavingUtm(true);
    try {
      const response = await fetch('/api/admin/utm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: baseUrl,
          utm_source: utmSource,
          utm_medium: utmMedium,
          utm_campaign: utmCampaign,
          utm_term: utmTerm,
          utm_content: utmContent
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setUtmLinks(prev => [data.link, ...prev]);
        setUtmCampaign('');
        setUtmTerm('');
        setUtmContent('');
      } else {
        setUtmError(data.error || 'Failed to store UTM link.');
      }
    } catch (err) {
      setUtmError('Connection error while recording campaign scroll.');
      console.error(err);
    } finally {
      setIsSavingUtm(false);
    }
  };

  // 5. Delete UTM link
  const handleDeleteUtmLink = async (id) => {
    if (!confirm('Are you sure you want to discard this campaign link from the scrolls?')) return;
    try {
      const response = await fetch(`/api/admin/utm?id=${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (response.ok && data.success) {
        setUtmLinks(prev => prev.filter(u => u.id !== id));
      } else {
        setUtmError(data.error || 'Failed to remove campaign record.');
      }
    } catch (err) {
      setUtmError('Connection error while discarding campaign record.');
      console.error(err);
    }
  };

  // 6. Invite Scribe (mark waitlist member as invited)
  const handleInviteScribe = async (id) => {
    setIsInvitingId(id);
    try {
      const response = await fetch('/api/admin/waitlist/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setEmails(prev => prev.map(e => e.id === id ? { ...e, status: 'invited', invited_at: data.scribe.invited_at } : e));
      } else {
        alert(data.error || 'Failed to register waitlist invitation.');
      }
    } catch (err) {
      console.error(err);
      alert('A network disruption occurred while dispatching invitation scrolls.');
    } finally {
      setIsInvitingId(null);
    }
  };

  // 7. Disconnect Notion Workspace gateway
  const handleDisconnectWorkspace = async (workspaceId) => {
    if (!confirm('Are you sure you want to disconnect this workspace gateway? All synchronization configurations will be permanently dissolved.')) return;
    setIsDisconnectingId(workspaceId);
    try {
      const response = await fetch(`/api/admin/workspaces?workspace_id=${workspaceId}`, { method: 'DELETE' });
      const data = await response.json();
      if (response.ok && data.success) {
        setWorkspaces(prev => prev.filter(w => w.workspace_id !== workspaceId));
      } else {
        alert(data.error || 'Failed to sever connection gateway.');
      }
    } catch (err) {
      console.error(err);
      alert('A connection error occurred while severing the gateway credentials.');
    } finally {
      setIsDisconnectingId(null);
    }
  };

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

  // 8. Update ticket (status / priority / admin_notes)
  const handleTicketUpdate = async (id, field, value) => {
    setTicketSavingId(id + field);
    try {
      const res = await fetch('/api/admin/feedback', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, [field]: value }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback(prev => prev.map(f => f.id === id ? { ...f, ...data.ticket } : f));
        if (field === 'admin_notes') {
          setTicketDraftNotes(prev => { const n = { ...prev }; delete n[id]; return n; });
        }
      }
    } catch (err) {
      console.error('[TicketUpdate]', err);
    } finally {
      setTicketSavingId(null);
    }
  };

  // 9. Export CSV Helper
  const handleExportCSV = () => {
    if (emails.length === 0) return;

    const headers = ['Name', 'Email Address', 'Excited Tool', 'Status', 'UTM Source', 'UTM Medium', 'UTM Campaign', 'Registered At'];
    const rows = emails.map(e => [
      e.name || '',
      e.email,
      e.excited_tool || '',
      e.status || 'pending',
      e.utm_source || '',
      e.utm_medium || '',
      e.utm_campaign || '',
      new Date(e.registered_at).toISOString()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(val => `"${(val || '').replace(/"/g, '""')}"`).join(','))
    ].join('\n');

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

  // Calculate metrics for waitlist
  const sourceCounts = {};
  const toolCounts = {};
  const campaignCounts = {};
  const mediumCounts = {};
  let utmTrackedSignupsCount = 0;

  emails.forEach(e => {
    const src = (e.utm_source || '').trim();
    const med = (e.utm_medium || '').trim();
    const cmp = (e.utm_campaign || '').trim();

    const displaySrc = src || 'Direct / Organic';
    sourceCounts[displaySrc] = (sourceCounts[displaySrc] || 0) + 1;

    const tool = (e.excited_tool || 'None').trim();
    toolCounts[tool] = (toolCounts[tool] || 0) + 1;

    if (src || med || cmp) {
      utmTrackedSignupsCount++;
    }

    if (cmp) {
      campaignCounts[cmp] = (campaignCounts[cmp] || 0) + 1;
    }
    if (med) {
      mediumCounts[med] = (mediumCounts[med] || 0) + 1;
    }
  });

  const sortedSources = Object.entries(sourceCounts).sort((a, b) => b[1] - a[1]);
  const sortedTools = Object.entries(toolCounts).sort((a, b) => b[1] - a[1]);
  const sortedCampaigns = Object.entries(campaignCounts).sort((a, b) => b[1] - a[1]);
  const sortedMediums = Object.entries(mediumCounts).sort((a, b) => b[1] - a[1]);

  const getConversionsForLink = (link) => {
    return emails.filter(e => 
      e.utm_source?.toLowerCase() === link.utm_source?.toLowerCase() &&
      e.utm_medium?.toLowerCase() === link.utm_medium?.toLowerCase() &&
      e.utm_campaign?.toLowerCase() === link.utm_campaign?.toLowerCase()
    ).length;
  };

  const topCampaignName = sortedCampaigns[0]?.[0] || 'None';

  // Filters
  const filteredEmails = emails.filter(e => 
    e.email.toLowerCase().includes(search.toLowerCase()) ||
    (e.name && e.name.toLowerCase().includes(search.toLowerCase())) ||
    (e.excited_tool && e.excited_tool.toLowerCase().includes(search.toLowerCase())) ||
    (e.utm_source && e.utm_source.toLowerCase().includes(search.toLowerCase())) ||
    (e.utm_campaign && e.utm_campaign.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredWorkspaces = workspaces.filter(w => 
    (w.workspace_name && w.workspace_name.toLowerCase().includes(workspaceSearch.toLowerCase())) ||
    (w.owner?.user?.name && w.owner.user.name.toLowerCase().includes(workspaceSearch.toLowerCase())) ||
    (w.owner?.user?.person?.email && w.owner.user.person.email.toLowerCase().includes(workspaceSearch.toLowerCase())) ||
    (w.tool && w.tool.toLowerCase().includes(workspaceSearch.toLowerCase()))
  );

  // Copy helpers
  const copyToClipboard = (text, isForm = false, id = null) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    if (isForm) {
      setFormCopied(true);
      setTimeout(() => setFormCopied(false), 2000);
    } else if (id) {
      setCopiedLinkId(id);
      setTimeout(() => setCopiedLinkId(null), 2000);
    }
  };

  const getFullGeneratedUrl = (link) => {
    try {
      const urlObj = new URL(link.url);
      if (link.utm_source) urlObj.searchParams.set('utm_source', link.utm_source);
      if (link.utm_medium) urlObj.searchParams.set('utm_medium', link.utm_medium);
      if (link.utm_campaign) urlObj.searchParams.set('utm_campaign', link.utm_campaign);
      if (link.utm_term) urlObj.searchParams.set('utm_term', link.utm_term);
      if (link.utm_content) urlObj.searchParams.set('utm_content', link.utm_content);
      return urlObj.toString();
    } catch (_) {
      return link.url;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', zIndex: 1 }}>
      <Header account={account} onDisconnect={handleDisconnect} />

      <div className="container" style={{ padding: '40px 24px', flex: 1, maxWidth: '1080px' }}>
        
        {/* Page Header */}
        <div style={{ marginBottom: '32px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: 'var(--gold)', letterSpacing: '0.15em', fontFamily: 'var(--font-headings)' }}>
            THE PHARAONIC PORTAL
          </span>
          <h2 style={{ fontSize: '32px', marginTop: '4px', textTransform: 'uppercase' }}>
            Administrative Sanctum
          </h2>
          <p style={{ maxWidth: '600px', fontSize: '14px', marginTop: '8px', color: 'var(--sand-dim)' }}>
            Decipher waiting list papyri, coordinate traffic structures, and govern early-access Notion workspace gateways.
          </p>
        </div>

        {/* Tab Selector */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '16px',
          marginBottom: '32px',
          borderBottom: '1px solid rgba(212, 175, 55, 0.15)',
          paddingBottom: '2px',
          flexWrap: 'wrap'
        }}>
          {[
            { id: 'waitlist', label: 'Waitlist Ledger' },
            { id: 'utm', label: 'UTM Campaign Chamber' },
            { id: 'workspaces', label: 'Notion Workspaces Gateway' },
            { id: 'feedback', label: 'Feedback Inbox' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: 'none',
                border: 'none',
                color: activeTab === tab.id ? 'var(--gold)' : 'var(--sand-dim)',
                fontSize: '13px',
                fontWeight: activeTab === tab.id ? 'bold' : 'normal',
                fontFamily: 'var(--font-headings)',
                padding: '12px 20px',
                cursor: 'pointer',
                borderBottom: activeTab === tab.id ? '2px solid var(--gold)' : '2px solid transparent',
                transition: 'var(--transition-smooth)',
                letterSpacing: '0.06em',
                textTransform: 'uppercase'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Errors display */}
        {(error || utmError || workspacesError) && (
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
              <span>{error || utmError || workspacesError}</span>
            </div>
          </div>
        )}

        {isLoading ? (
          <div style={{ padding: '48px 0', textAlign: 'center' }}>
            <EyeOfHorusLoader size={60} text="Opening administrative papyrus scrolls..." />
          </div>
        ) : (
          <div>
            {/* TAB 1: WAITLIST LEDGER */}
            {activeTab === 'waitlist' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Stats Cards */}
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

                {/* Search & Export bar */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '16px'
                }}>
                  <div style={{ flex: 1, minWidth: '260px' }}>
                    <input 
                      className="kemet-input"
                      type="text"
                      placeholder="Search name, email, tool, campaign, or UTM source..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      style={{ padding: '10px 14px', fontSize: '14px' }}
                    />
                  </div>

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

                {/* Waitlist Ledger Table */}
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
                            <th style={{ padding: '10px 12px', fontWeight: 'bold' }}>STATUS</th>
                            <th style={{ padding: '10px 12px', fontWeight: 'bold' }}>UTM CAMPAIGN</th>
                            <th style={{ padding: '10px 12px', fontWeight: 'bold' }}>UTM SOURCE</th>
                            <th style={{ padding: '10px 12px', fontWeight: 'bold', textAlign: 'right' }}>ACTION Trigger</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredEmails.map((item, index) => {
                            const isNew = item.newlyInserted;
                            const isInvited = item.status === 'invited';
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
                                <td style={{ padding: '12px' }}>
                                  <span style={{
                                    padding: '2px 8px',
                                    borderRadius: '12px',
                                    fontSize: '10px',
                                    fontWeight: 'bold',
                                    border: isInvited ? '1px solid rgba(212,175,55,0.4)' : '1px solid rgba(255,255,255,0.15)',
                                    color: isInvited ? 'var(--gold)' : 'var(--sand-dim)',
                                    background: isInvited ? 'rgba(212,175,55,0.05)' : 'rgba(255,255,255,0.02)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em'
                                  }} title={isInvited ? `Invited on ${new Date(item.invited_at).toLocaleString()}` : 'Registered waiting'}>
                                    {isInvited ? 'Invited' : 'Pending'}
                                  </span>
                                </td>
                                <td style={{ padding: '12px', color: 'var(--sand)' }}>{item.utm_campaign || <span style={{ color: 'var(--sand-dark)' }}>-</span>}</td>
                                <td style={{ padding: '12px', color: 'var(--sand)' }}>{item.utm_source || <span style={{ color: 'var(--sand-dark)' }}>-</span>}</td>
                                <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                                  <button
                                    onClick={() => handleInviteScribe(item.id)}
                                    disabled={isInvited || isInvitingId === item.id}
                                    className={isInvited ? 'kemet-btn-secondary' : 'kemet-btn'}
                                    style={{
                                      padding: '4px 12px',
                                      fontSize: '10px',
                                      height: 'auto',
                                      minHeight: 'unset',
                                      textTransform: 'uppercase',
                                      cursor: isInvited ? 'default' : 'pointer',
                                      opacity: isInvited ? 0.6 : 1,
                                      borderColor: isInvited ? 'rgba(212, 175, 55, 0.2)' : undefined,
                                      boxShadow: isInvited ? 'none' : undefined
                                    }}
                                  >
                                    {isInvitingId === item.id ? 'Inviting...' : isInvited ? 'Invited' : 'Invite'}
                                  </button>
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

            {/* TAB 2: UTM CAMPAIGN CHAMBER */}
            {activeTab === 'utm' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* UTM Quick Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '10px' }}>
                  
                  {/* Metric 1: Total UTM Signups */}
                  <GlowingCard title="Campaign Conversions" subtitle="Leads from active campaigns">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '110px' }}>
                      <div style={{ fontSize: '46px', fontFamily: 'var(--font-headings)', color: 'var(--gold)', letterSpacing: '0.05em', fontWeight: 'bold' }}>
                        {utmTrackedSignupsCount}
                      </div>
                    </div>
                  </GlowingCard>

                  {/* Metric 2: Active Registry Links */}
                  <GlowingCard title="Active Marketing Scrolls" subtitle="Total campaigns generated">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '110px' }}>
                      <div style={{ fontSize: '46px', fontFamily: 'var(--font-headings)', color: 'var(--gold)', letterSpacing: '0.05em', fontWeight: 'bold' }}>
                        {utmLinks.length}
                      </div>
                    </div>
                  </GlowingCard>

                  {/* Metric 3: Top Campaign */}
                  <GlowingCard title="Champion Campaign" subtitle="Highest generating cohort">
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '110px' }}>
                      <div style={{ 
                        fontSize: '24px', 
                        fontFamily: 'var(--font-headings)', 
                        color: 'var(--gold)', 
                        letterSpacing: '0.02em', 
                        fontWeight: 'bold', 
                        textAlign: 'center',
                        textTransform: 'uppercase',
                        maxWidth: '260px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {topCampaignName}
                      </div>
                      {sortedCampaigns[0] && (
                        <div style={{ fontSize: '12px', color: 'var(--sand-dim)', marginTop: '4px' }}>
                          Generated {sortedCampaigns[0][1]} signups
                        </div>
                      )}
                    </div>
                  </GlowingCard>

                </div>

                {/* Workspace grid for Builder & Top Lists */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '24px' }}>
                  
                  {/* Left Column: UTM Link Builder */}
                  <GlowingCard title="UTM Campaign Builder" subtitle="Carve UTM parameters into sharing links">
                    <form onSubmit={handleSaveUtmLink} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      
                      {/* Base URL */}
                      <div>
                        <label className="kemet-label">Base URL</label>
                        <input
                          type="url"
                          required
                          className="kemet-input"
                          placeholder="e.g. https://tjesa.com"
                          value={baseUrl}
                          onChange={(e) => setBaseUrl(e.target.value)}
                        />
                      </div>

                      {/* Source */}
                      <div>
                        <label className="kemet-label">Campaign Source (utm_source)</label>
                        <input
                          type="text"
                          required
                          className="kemet-input"
                          placeholder="e.g. newsletter, twitter, producthunt"
                          value={utmSource}
                          onChange={(e) => setUtmSource(e.target.value)}
                        />
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                          {['newsletter', 'twitter', 'linkedin', 'google', 'producthunt'].map(preset => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => setUtmSource(preset)}
                              style={{
                                fontSize: '10px',
                                padding: '4px 8px',
                                border: '1px solid rgba(212,175,55,0.25)',
                                background: 'transparent',
                                borderRadius: '4px',
                                color: utmSource === preset ? 'var(--gold)' : 'var(--sand-dim)',
                                cursor: 'pointer',
                                background: utmSource === preset ? 'rgba(212,175,55,0.08)' : 'transparent',
                              }}
                            >
                              {preset}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Medium */}
                      <div>
                        <label className="kemet-label">Campaign Medium (utm_medium)</label>
                        <input
                          type="text"
                          required
                          className="kemet-input"
                          placeholder="e.g. email, social, cpc, referral"
                          value={utmMedium}
                          onChange={(e) => setUtmMedium(e.target.value)}
                        />
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                          {['email', 'social', 'cpc', 'referral', 'banner'].map(preset => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => setUtmMedium(preset)}
                              style={{
                                fontSize: '10px',
                                padding: '4px 8px',
                                border: '1px solid rgba(212,175,55,0.25)',
                                background: 'transparent',
                                borderRadius: '4px',
                                color: utmMedium === preset ? 'var(--gold)' : 'var(--sand-dim)',
                                cursor: 'pointer',
                                background: utmMedium === preset ? 'rgba(212,175,55,0.08)' : 'transparent',
                              }}
                            >
                              {preset}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Campaign Name */}
                      <div>
                        <label className="kemet-label">Campaign Name (utm_campaign)</label>
                        <input
                          type="text"
                          required
                          className="kemet-input"
                          placeholder="e.g. launch_june, summer_promo"
                          value={utmCampaign}
                          onChange={(e) => setUtmCampaign(e.target.value)}
                        />
                      </div>

                      {/* Term & Content */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                          <label className="kemet-label">Campaign Term (Optional)</label>
                          <input
                            type="text"
                            className="kemet-input"
                            placeholder="e.g. notion_creators"
                            value={utmTerm}
                            onChange={(e) => setUtmTerm(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="kemet-label">Campaign Content (Optional)</label>
                          <input
                            type="text"
                            className="kemet-input"
                            placeholder="e.g. sidebar_logo"
                            value={utmContent}
                            onChange={(e) => setUtmContent(e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Generated Preview */}
                      {generatedUrl && (
                        <div style={{
                          marginTop: '8px',
                          padding: '12px',
                          background: 'rgba(13,13,11,0.5)',
                          borderRadius: '8px',
                          border: '1px solid rgba(212,175,55,0.15)',
                          wordBreak: 'break-all'
                        }}>
                          <div style={{ fontSize: '11px', color: 'var(--gold)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Generated Papyrus Scroll Link
                          </div>
                          <div style={{ fontSize: '13px', color: 'var(--sand-light)', fontFamily: 'monospace', marginBottom: '12px' }}>
                            {generatedUrl}
                          </div>

                          <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(generatedUrl, true)}
                              className="kemet-btn-secondary"
                              style={{ padding: '8px 16px', fontSize: '11px', flex: 1, height: 'auto', minHeight: 'unset' }}
                            >
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                {formCopied ? <Check size={12} /> : <Copy size={12} />}
                                {formCopied ? 'Copied!' : 'Copy Link'}
                              </span>
                            </button>

                            <button
                              type="submit"
                              disabled={isSavingUtm}
                              className="kemet-btn"
                              style={{ padding: '8px 16px', fontSize: '11px', flex: 1, height: 'auto', minHeight: 'unset' }}
                            >
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                <Plus size={12} />
                                {isSavingUtm ? 'Saving...' : 'Save & Track Link'}
                              </span>
                            </button>
                          </div>
                        </div>
                      )}

                    </form>
                  </GlowingCard>

                  {/* Right Column: UTM Stats & Performance */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    
                    {/* Performance widget: Top Campaigns */}
                    <GlowingCard title="Top Conversion Campaigns" subtitle="Signups generated by cohort name">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '220px', overflowY: 'auto' }} className="sacred-scroll-list">
                        {sortedCampaigns.length === 0 ? (
                          <div style={{ color: 'var(--sand-dark)', fontSize: '12px', textAlign: 'center', padding: '48px 0' }}>No campaign signups recorded yet.</div>
                        ) : (
                          sortedCampaigns.map(([cmp, count]) => {
                            const percentage = Math.round((count / utmTrackedSignupsCount) * 100) || 0;
                            return (
                              <div key={cmp} style={{ fontSize: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                  <span style={{ color: 'var(--sand)', fontWeight: '500', textTransform: 'uppercase' }}>{cmp}</span>
                                  <span style={{ color: 'var(--gold-dim)' }}>{count} signups ({percentage}%)</span>
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

                    {/* Performance widget: Top Mediums */}
                    <GlowingCard title="Performance by Medium" subtitle="Performance by distribution medium">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '220px', overflowY: 'auto' }} className="sacred-scroll-list">
                        {sortedMediums.length === 0 ? (
                          <div style={{ color: 'var(--sand-dark)', fontSize: '12px', textAlign: 'center', padding: '48px 0' }}>No medium stats recorded yet.</div>
                        ) : (
                          sortedMediums.map(([med, count]) => {
                            const percentage = Math.round((count / utmTrackedSignupsCount) * 100) || 0;
                            return (
                              <div key={med} style={{ fontSize: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                  <span style={{ color: 'var(--sand)', fontWeight: '500', textTransform: 'capitalize' }}>{med}</span>
                                  <span style={{ color: 'var(--gold-dim)' }}>{count} signups ({percentage}%)</span>
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

                </div>

                {/* Bottom Section: UTM Links Registry */}
                <GlowingCard title="UTM Campaign Registry" subtitle="Active scrolls ledger history">
                  {isUtmLoading ? (
                    <div style={{ padding: '24px 0', textAlign: 'center' }}>
                      <EyeOfHorusLoader size={40} text="Deciphering UTM campaign scrolls..." />
                    </div>
                  ) : utmLinks.length === 0 ? (
                    <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--sand-dark)', padding: '24px 0', margin: 0 }}>
                      No UTM campaign links have been created in the registry scrolls.
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
                            <th style={{ padding: '10px 12px', fontWeight: 'bold' }}>CAMPAIGN NAME</th>
                            <th style={{ padding: '10px 12px', fontWeight: 'bold' }}>SOURCE</th>
                            <th style={{ padding: '10px 12px', fontWeight: 'bold' }}>MEDIUM</th>
                            <th style={{ padding: '10px 12px', fontWeight: 'bold' }}>SIGNUPS</th>
                            <th style={{ padding: '10px 12px', fontWeight: 'bold' }}>BASE URL</th>
                            <th style={{ padding: '10px 12px', fontWeight: 'bold', textAlign: 'right' }}>ACTIONS</th>
                          </tr>
                        </thead>
                        <tbody>
                          {utmLinks.map((link, idx) => {
                            const fullUrl = getFullGeneratedUrl(link);
                            const conversions = getConversionsForLink(link);
                            return (
                              <tr 
                                key={link.id || idx}
                                style={{
                                  borderBottom: '1px solid rgba(255,255,255,0.03)',
                                  background: idx % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent',
                                  transition: 'background 0.2s ease'
                                }}
                                onMouseOver={e => e.currentTarget.style.background = 'rgba(212,175,55,0.04)'}
                                onMouseOut={e => e.currentTarget.style.background = idx % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent'}
                              >
                                <td style={{ padding: '12px', color: 'var(--sand)', fontWeight: 'bold' }}>
                                  {link.utm_campaign}
                                </td>
                                <td style={{ padding: '12px', color: 'var(--sand)' }}>
                                  <span style={{
                                    padding: '2px 6px',
                                    background: 'rgba(212,175,55,0.06)',
                                    border: '1px solid rgba(212,175,55,0.12)',
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                    color: 'var(--gold-dim)'
                                  }}>
                                    {link.utm_source}
                                  </span>
                                </td>
                                <td style={{ padding: '12px', color: 'var(--sand)' }}>
                                  {link.utm_medium}
                                </td>
                                <td style={{ padding: '12px', color: 'var(--gold)', fontWeight: 'bold' }}>
                                  {conversions}
                                </td>
                                <td style={{ padding: '12px', color: 'var(--sand-dim)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {link.url}
                                </td>
                                <td style={{ padding: '12px', textAlign: 'right' }}>
                                  <div style={{ display: 'inline-flex', gap: '8px' }}>
                                    
                                    <button
                                      title="Copy full campaign URL"
                                      onClick={() => copyToClipboard(fullUrl, false, link.id)}
                                      style={{
                                        background: 'transparent',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: copiedLinkId === link.id ? '#34D399' : 'var(--sand-dim)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '4px'
                                      }}
                                    >
                                      {copiedLinkId === link.id ? <Check size={14} /> : <Copy size={14} />}
                                    </button>

                                    <a
                                      href={fullUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      title="Open campaign link"
                                      style={{
                                        color: 'var(--sand-dim)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '4px'
                                      }}
                                    >
                                      <ExternalLink size={14} />
                                    </a>

                                    <button
                                      title="Delete campaign link"
                                      onClick={() => handleDeleteUtmLink(link.id)}
                                      style={{
                                        background: 'transparent',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: 'rgba(168, 36, 36, 0.7)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '4px'
                                      }}
                                      onMouseOver={e => e.currentTarget.style.color = 'var(--scarab-red)'}
                                      onMouseOut={e => e.currentTarget.style.color = 'rgba(168, 36, 36, 0.7)'}
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                    
                                  </div>
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

            {/* TAB 3: NOTION WORKSPACES GATEWAY */}
            {activeTab === 'workspaces' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Workspaces Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '10px' }}>
                  
                  {/* Stat 1: Total connected workspaces */}
                  <GlowingCard title="Integrations Active" subtitle="Notion workspaces connected">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '110px' }}>
                      <div style={{ fontSize: '46px', fontFamily: 'var(--font-headings)', color: 'var(--gold)', letterSpacing: '0.05em', fontWeight: 'bold' }}>
                        {workspaces.length}
                      </div>
                    </div>
                  </GlowingCard>

                  {/* Stat 2: Active Tool Categories */}
                  <GlowingCard title="Active Tools Deployed" subtitle="Tools being actively utilized">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '110px' }}>
                      <div style={{ fontSize: '18px', fontFamily: 'var(--font-headings)', color: 'var(--sand)', letterSpacing: '0.05em', fontWeight: 'bold', textTransform: 'uppercase', textAlign: 'center' }}>
                        {Array.from(new Set(workspaces.map(w => w.tool || 'Global'))).join(', ') || 'None'}
                      </div>
                    </div>
                  </GlowingCard>

                  {/* Stat 3: Security Status */}
                  <GlowingCard title="Ankh Security State" subtitle="Credentials vulnerability health">
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '110px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--scarab-green)' }}>
                        <span style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: 'var(--scarab-green)',
                          boxShadow: '0 0 10px var(--scarab-green)'
                        }} />
                        <span style={{ fontSize: '20px', fontFamily: 'var(--font-headings)', fontWeight: 'bold', letterSpacing: '0.05em' }}>SECURE</span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--sand-dim)', marginTop: '4px' }}>
                        All keys stored server-side only
                      </div>
                    </div>
                  </GlowingCard>

                </div>

                {/* Filter and Search Bar */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '16px'
                }}>
                  <div style={{ flex: 1, minWidth: '260px' }}>
                    <input 
                      className="kemet-input"
                      type="text"
                      placeholder="Search workspace name, owner details, or tool..."
                      value={workspaceSearch}
                      onChange={(e) => setWorkspaceSearch(e.target.value)}
                      style={{ padding: '10px 14px', fontSize: '14px' }}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--sand-dim)', fontFamily: 'var(--font-headings)', letterSpacing: '0.05em' }}>
                      SHOWING: <strong style={{ color: 'var(--gold)', fontSize: '14px' }}>{filteredWorkspaces.length}</strong> of {workspaces.length}
                    </div>
                  </div>
                </div>

                {/* Workspaces List Table */}
                <GlowingCard title="Notion Connections Ledger" subtitle="Govern active integrations and credentials">
                  {isWorkspacesLoading ? (
                    <div style={{ padding: '24px 0', textAlign: 'center' }}>
                      <EyeOfHorusLoader size={40} text="Deciphering Notion workspaces registry..." />
                    </div>
                  ) : filteredWorkspaces.length === 0 ? (
                    <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--sand-dark)', padding: '24px 0', margin: 0 }}>
                      {workspaces.length === 0 ? 'No Notion workspaces are currently bound to the gateway.' : 'No workspace matches your search query.'}
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
                            <th style={{ padding: '10px 12px', fontWeight: 'bold' }}>WORKSPACE</th>
                            <th style={{ padding: '10px 12px', fontWeight: 'bold' }}>INTEGRATION OWNER</th>
                            <th style={{ padding: '10px 12px', fontWeight: 'bold' }}>ACTIVE TOOL</th>
                            <th style={{ padding: '10px 12px', fontWeight: 'bold' }}>WORKSPACE ID</th>
                            <th style={{ padding: '10px 12px', fontWeight: 'bold' }}>CONNECTED AT</th>
                            <th style={{ padding: '10px 12px', fontWeight: 'bold', textAlign: 'right' }}>GATEWAY CONTROL</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredWorkspaces.map((item, idx) => {
                            const ownerName = item.owner?.user?.name || 'Unknown User';
                            const ownerEmail = item.owner?.user?.person?.email || 'N/A';
                            const toolLabel = item.tool === 'qr' ? 'Glyph Carver (QR)' : item.tool === 'forms' ? 'Nile Scribe (Forms)' : item.tool || 'Global Sync';
                            
                            return (
                              <tr 
                                key={item.workspace_id || idx}
                                style={{
                                  borderBottom: '1px solid rgba(255,255,255,0.03)',
                                  background: idx % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent',
                                  transition: 'background 0.2s ease'
                                }}
                                onMouseOver={e => e.currentTarget.style.background = 'rgba(212,175,55,0.04)'}
                                onMouseOut={e => e.currentTarget.style.background = idx % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent'}
                              >
                                <td style={{ padding: '12px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {item.workspace_icon ? (
                                      <img 
                                        src={item.workspace_icon} 
                                        alt="Workspace Icon" 
                                        style={{ width: '20px', height: '20px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)' }}
                                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                      />
                                    ) : (
                                      <div style={{ width: '20px', height: '20px', borderRadius: '4px', background: 'var(--gold-dim)', display: 'inline-block' }} />
                                    )}
                                    <span style={{ color: 'var(--sand)', fontWeight: 'bold' }}>
                                      {item.workspace_name || 'Notion Workspace'}
                                    </span>
                                  </div>
                                </td>
                                <td style={{ padding: '12px', color: 'var(--sand)' }}>
                                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontWeight: '500' }}>{ownerName}</span>
                                    <span style={{ fontSize: '11px', color: 'var(--sand-dim)' }}>{ownerEmail}</span>
                                  </div>
                                </td>
                                <td style={{ padding: '12px', color: 'var(--sand)' }}>
                                  <span style={{
                                    padding: '3px 8px',
                                    background: 'rgba(212,175,55,0.08)',
                                    border: '1px solid rgba(212,175,55,0.15)',
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                    color: 'var(--gold-dim)'
                                  }}>
                                    {toolLabel}
                                  </span>
                                </td>
                                <td style={{ padding: '12px', color: 'var(--sand-dim)', fontFamily: 'monospace', fontSize: '11px' }}>
                                  {item.workspace_id?.split('_')[0] || item.workspace_id}
                                </td>
                                <td style={{ padding: '12px', color: 'var(--sand-dim)' }}>
                                  {item.connected_at ? new Date(item.connected_at).toLocaleDateString() : 'N/A'}
                                </td>
                                <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                                  <button
                                    onClick={() => handleDisconnectWorkspace(item.workspace_id)}
                                    disabled={isDisconnectingId === item.workspace_id}
                                    className="kemet-btn-secondary"
                                    style={{
                                      padding: '4px 12px',
                                      fontSize: '10px',
                                      height: 'auto',
                                      minHeight: 'unset',
                                      textTransform: 'uppercase',
                                      color: 'rgba(168, 36, 36, 0.7)',
                                      borderColor: 'rgba(168, 36, 36, 0.3)',
                                      cursor: 'pointer',
                                    }}
                                    onMouseOver={e => {
                                      e.currentTarget.style.color = '#FF7F7F';
                                      e.currentTarget.style.borderColor = 'var(--scarab-red)';
                                      e.currentTarget.style.background = 'rgba(168, 36, 36, 0.08)';
                                    }}
                                    onMouseOut={e => {
                                      e.currentTarget.style.color = 'rgba(168, 36, 36, 0.7)';
                                      e.currentTarget.style.borderColor = 'rgba(168, 36, 36, 0.3)';
                                      e.currentTarget.style.background = 'transparent';
                                    }}
                                  >
                                    {isDisconnectingId === item.workspace_id ? 'Dissolving...' : 'Disconnect'}
                                  </button>
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

            {/* TAB 4: TICKETING SYSTEM */}
            {activeTab === 'feedback' && (() => {
              const CATEGORIES = ['All', 'Bug Report', 'Feature Request', 'General Feedback', 'Account Issue'];
              const STATUSES = ['All', 'open', 'in_progress', 'resolved'];
              const statusFilter = ticketStatusFilter;
              const setStatusFilter = setTicketStatusFilter;
              const savingId = ticketSavingId;
              const draftNotes = ticketDraftNotes;
              const setDraftNotes = setTicketDraftNotes;

              const STATUS_META = {
                open:        { label: 'Open',        bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.3)',   text: '#FCA5A5' },
                in_progress: { label: 'In Progress', bg: 'rgba(251,146,60,0.1)',  border: 'rgba(251,146,60,0.3)',  text: '#FB923C' },
                resolved:    { label: 'Resolved',    bg: 'rgba(52,211,153,0.08)', border: 'rgba(52,211,153,0.25)', text: '#34D399' },
              };
              const PRIORITY_META = {
                low:    { label: 'Low',    color: '#6B7280' },
                medium: { label: 'Medium', color: '#F59E0B' },
                high:   { label: 'High',   color: '#EF4444' },
                urgent: { label: 'Urgent', color: '#DC2626' },
              };
              const CATEGORY_COLORS = {
                'Bug Report':        { bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.25)',  text: '#FCA5A5' },
                'Feature Request':   { bg: 'rgba(212,175,55,0.08)', border: 'rgba(212,175,55,0.25)', text: 'var(--gold)' },
                'General Feedback':  { bg: 'rgba(52,211,153,0.08)', border: 'rgba(52,211,153,0.25)', text: '#34D399' },
                'Account Issue':     { bg: 'rgba(251,146,60,0.08)', border: 'rgba(251,146,60,0.25)', text: '#FB923C' },
              };

              const formatDate = (d) => {
                if (!d) return '—';
                return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
              };
              const ticketId = (id) => `TKT-${(id || '').slice(0, 6).toUpperCase()}`;

              const openCount = feedback.filter(f => f.status === 'open').length;
              const inProgressCount = feedback.filter(f => f.status === 'in_progress').length;
              const resolvedCount = feedback.filter(f => f.status === 'resolved').length;

              const filtered = feedback.filter(f => {
                const matchesSearch = !feedbackSearch ||
                  f.subject?.toLowerCase().includes(feedbackSearch.toLowerCase()) ||
                  f.message?.toLowerCase().includes(feedbackSearch.toLowerCase()) ||
                  f.user_email?.toLowerCase().includes(feedbackSearch.toLowerCase());
                const matchesCat = feedbackCategoryFilter === 'All' || f.category === feedbackCategoryFilter;
                const matchesStatus = statusFilter === 'All' || f.status === statusFilter;
                return matchesSearch && matchesCat && matchesStatus;
              });

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                  {/* Stats Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                    {[
                      { label: 'Total Tickets', value: feedback.length, color: 'var(--gold)' },
                      { label: 'Open', value: openCount, color: '#FCA5A5' },
                      { label: 'In Progress', value: inProgressCount, color: '#FB923C' },
                      { label: 'Resolved', value: resolvedCount, color: '#34D399' },
                    ].map(stat => (
                      <GlowingCard key={stat.label} title={stat.label} subtitle="">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '70px' }}>
                          <div style={{ fontSize: '40px', fontFamily: 'var(--font-headings)', color: stat.color, fontWeight: 'bold', letterSpacing: '0.05em' }}>
                            {stat.value}
                          </div>
                        </div>
                      </GlowingCard>
                    ))}
                  </div>

                  {/* Filters */}
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ flex: 1, minWidth: '220px' }}>
                      <input
                        className="kemet-input"
                        type="text"
                        placeholder="Search subject, message, or email…"
                        value={feedbackSearch}
                        onChange={e => setFeedbackSearch(e.target.value)}
                        style={{ padding: '9px 14px', fontSize: '13px' }}
                      />
                    </div>

                    {/* Status filter */}
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {STATUSES.map(s => {
                        const meta = STATUS_META[s];
                        return (
                          <button key={s} onClick={() => setStatusFilter(s)} style={{
                            padding: '6px 12px', borderRadius: '6px', fontSize: '11px',
                            fontFamily: 'var(--font-headings)', cursor: 'pointer', letterSpacing: '0.04em',
                            border: statusFilter === s ? `1px solid ${meta?.border || 'rgba(212,175,55,0.4)'}` : '1px solid rgba(212,175,55,0.12)',
                            background: statusFilter === s ? (meta?.bg || 'rgba(212,175,55,0.1)') : 'transparent',
                            color: statusFilter === s ? (meta?.text || 'var(--gold)') : 'var(--sand-dark)',
                          }}>
                            {meta?.label || 'All'}
                          </button>
                        );
                      })}
                    </div>

                    {/* Category filter */}
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {CATEGORIES.map(cat => (
                        <button key={cat} onClick={() => setFeedbackCategoryFilter(cat)} style={{
                          padding: '6px 10px', borderRadius: '6px', fontSize: '10px',
                          fontFamily: 'var(--font-headings)', cursor: 'pointer', letterSpacing: '0.04em',
                          border: feedbackCategoryFilter === cat ? '1px solid rgba(212,175,55,0.4)' : '1px solid rgba(212,175,55,0.08)',
                          background: feedbackCategoryFilter === cat ? 'rgba(212,175,55,0.08)' : 'transparent',
                          color: feedbackCategoryFilter === cat ? 'var(--gold)' : 'var(--sand-dark)',
                        }}>
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Ticket List */}
                  <GlowingCard title="Support Tickets" subtitle={`${filtered.length} of ${feedback.length} tickets`}>
                    {isFeedbackLoading ? (
                      <div style={{ padding: '24px 0', textAlign: 'center' }}>
                        <EyeOfHorusLoader size={40} text="Opening ticket scrolls…" />
                      </div>
                    ) : filtered.length === 0 ? (
                      <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--sand-dark)', padding: '32px 0', margin: 0 }}>
                        {feedback.length === 0 ? 'No tickets submitted yet.' : 'No tickets match your filters.'}
                      </p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {filtered.map((item, idx) => {
                          const catCol = CATEGORY_COLORS[item.category] || { bg: 'rgba(212,175,55,0.06)', border: 'rgba(212,175,55,0.12)', text: 'var(--gold-dim)' };
                          const statusMeta = STATUS_META[item.status] || STATUS_META.open;
                          const priorityMeta = PRIORITY_META[item.priority || 'medium'];
                          const isExpanded = expandedFeedbackId === item.id;
                          const notesDraft = draftNotes[item.id] !== undefined ? draftNotes[item.id] : (item.admin_notes || '');
                          const notesDirty = notesDraft !== (item.admin_notes || '');

                          return (
                            <div key={item.id || idx} style={{
                              border: `1px solid ${isExpanded ? 'rgba(212,175,55,0.25)' : 'rgba(212,175,55,0.1)'}`,
                              borderRadius: '10px',
                              overflow: 'hidden',
                              transition: 'border-color 0.2s ease',
                            }}>
                              {/* Header row */}
                              <div
                                onClick={() => setExpandedFeedbackId(isExpanded ? null : item.id)}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: '12px',
                                  padding: '13px 16px', cursor: 'pointer', flexWrap: 'wrap',
                                  background: isExpanded ? 'rgba(212,175,55,0.03)' : 'transparent',
                                }}
                              >
                                {/* Ticket ID */}
                                <span style={{ fontSize: '10px', fontFamily: 'monospace', color: 'var(--gold-dim)', flexShrink: 0 }}>
                                  {ticketId(item.id)}
                                </span>

                                {/* Status badge */}
                                <span style={{
                                  padding: '2px 8px', borderRadius: '4px', fontSize: '10px',
                                  fontFamily: 'var(--font-headings)', letterSpacing: '0.06em', flexShrink: 0,
                                  background: statusMeta.bg, border: `1px solid ${statusMeta.border}`, color: statusMeta.text,
                                }}>
                                  {statusMeta.label}
                                </span>

                                {/* Priority dot */}
                                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: priorityMeta.color, flexShrink: 0, boxShadow: `0 0 5px ${priorityMeta.color}` }} title={`Priority: ${priorityMeta.label}`} />

                                {/* Category */}
                                <span style={{
                                  padding: '2px 7px', borderRadius: '4px', fontSize: '10px',
                                  fontFamily: 'var(--font-headings)', letterSpacing: '0.04em', flexShrink: 0,
                                  background: catCol.bg, border: `1px solid ${catCol.border}`, color: catCol.text,
                                }}>
                                  {item.category}
                                </span>

                                {/* Subject */}
                                <span style={{ flex: 1, fontSize: '13px', color: 'var(--sand-light)', fontFamily: 'var(--font-headings)', minWidth: '100px' }}>
                                  {item.subject}
                                </span>

                                {/* From + date */}
                                <span style={{ fontSize: '11px', color: 'var(--sand-dark)', flexShrink: 0 }}>{item.user_email}</span>
                                <span style={{ fontSize: '10px', color: 'var(--sand-dark)', flexShrink: 0, fontFamily: 'monospace' }}>{formatDate(item.submitted_at)}</span>

                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--gold-dim)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                  style={{ flexShrink: 0, transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}>
                                  <polyline points="6 9 12 15 18 9" />
                                </svg>
                              </div>

                              {/* Expanded panel */}
                              {isExpanded && (
                                <div style={{ borderTop: '1px solid rgba(212,175,55,0.08)', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

                                  {/* Message */}
                                  <div>
                                    <div style={{ fontSize: '10px', color: 'var(--gold-dim)', fontFamily: 'var(--font-headings)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>
                                      Message
                                    </div>
                                    <div style={{ fontSize: '13px', color: 'var(--sand-dim)', lineHeight: 1.7, fontFamily: 'var(--font-body)', whiteSpace: 'pre-wrap', padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px', border: '1px solid rgba(212,175,55,0.06)' }}>
                                      {item.message}
                                    </div>
                                  </div>

                                  {/* Controls row */}
                                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>

                                    {/* Status */}
                                    <div style={{ flex: 1, minWidth: '160px' }}>
                                      <div style={{ fontSize: '10px', color: 'var(--gold-dim)', fontFamily: 'var(--font-headings)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px' }}>Status</div>
                                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                        {Object.entries(STATUS_META).map(([val, meta]) => (
                                          <button
                                            key={val}
                                            disabled={savingId === item.id + 'status'}
                                            onClick={(e) => { e.stopPropagation(); handleTicketUpdate(item.id, 'status', val); }}
                                            style={{
                                              padding: '5px 12px', borderRadius: '5px', fontSize: '11px',
                                              fontFamily: 'var(--font-headings)', cursor: 'pointer', letterSpacing: '0.04em',
                                              border: item.status === val ? `1px solid ${meta.border}` : '1px solid rgba(212,175,55,0.1)',
                                              background: item.status === val ? meta.bg : 'transparent',
                                              color: item.status === val ? meta.text : 'var(--sand-dark)',
                                              opacity: savingId === item.id + 'status' ? 0.5 : 1,
                                            }}
                                          >
                                            {meta.label}
                                          </button>
                                        ))}
                                      </div>
                                    </div>

                                    {/* Priority */}
                                    <div style={{ flex: 1, minWidth: '160px' }}>
                                      <div style={{ fontSize: '10px', color: 'var(--gold-dim)', fontFamily: 'var(--font-headings)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px' }}>Priority</div>
                                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                        {Object.entries(PRIORITY_META).map(([val, meta]) => (
                                          <button
                                            key={val}
                                            disabled={savingId === item.id + 'priority'}
                                            onClick={(e) => { e.stopPropagation(); handleTicketUpdate(item.id, 'priority', val); }}
                                            style={{
                                              padding: '5px 10px', borderRadius: '5px', fontSize: '11px',
                                              fontFamily: 'var(--font-headings)', cursor: 'pointer', letterSpacing: '0.04em',
                                              border: (item.priority || 'medium') === val ? `1px solid ${meta.color}55` : '1px solid rgba(212,175,55,0.1)',
                                              background: (item.priority || 'medium') === val ? `${meta.color}18` : 'transparent',
                                              color: (item.priority || 'medium') === val ? meta.color : 'var(--sand-dark)',
                                              opacity: savingId === item.id + 'priority' ? 0.5 : 1,
                                            }}
                                          >
                                            {meta.label}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Admin Notes */}
                                  <div>
                                    <div style={{ fontSize: '10px', color: 'var(--gold-dim)', fontFamily: 'var(--font-headings)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px' }}>
                                      Admin Notes (internal)
                                    </div>
                                    <textarea
                                      value={notesDraft}
                                      onChange={e => setDraftNotes(prev => ({ ...prev, [item.id]: e.target.value }))}
                                      onClick={e => e.stopPropagation()}
                                      placeholder="Add internal notes about this ticket…"
                                      rows={3}
                                      style={{
                                        width: '100%', boxSizing: 'border-box',
                                        background: 'rgba(0,0,0,0.25)', border: notesDirty ? '1px solid rgba(212,175,55,0.3)' : '1px solid rgba(212,175,55,0.1)',
                                        borderRadius: '6px', padding: '10px 12px', color: 'var(--sand-dim)',
                                        fontFamily: 'var(--font-body)', fontSize: '13px', lineHeight: 1.6,
                                        resize: 'vertical', minHeight: '72px', outline: 'none',
                                      }}
                                    />
                                    {notesDirty && (
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleTicketUpdate(item.id, 'admin_notes', notesDraft); }}
                                        disabled={savingId === item.id + 'admin_notes'}
                                        style={{
                                          marginTop: '8px', padding: '6px 16px', borderRadius: '6px', fontSize: '11px',
                                          fontFamily: 'var(--font-headings)', letterSpacing: '0.06em', cursor: 'pointer',
                                          background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)', color: 'var(--gold)',
                                        }}
                                      >
                                        {savingId === item.id + 'admin_notes' ? 'Saving…' : 'Save Notes'}
                                      </button>
                                    )}
                                  </div>

                                  {/* Meta footer */}
                                  <div style={{ display: 'flex', gap: '20px', fontSize: '10px', color: 'var(--sand-dark)', fontFamily: 'monospace', paddingTop: '8px', borderTop: '1px solid rgba(212,175,55,0.05)', flexWrap: 'wrap' }}>
                                    <span>ID: {item.id}</span>
                                    {item.user_id && <span>User ID: {item.user_id}</span>}
                                    {item.resolved_at && <span>Resolved: {formatDate(item.resolved_at)}</span>}
                                    {item.updated_at && <span>Updated: {formatDate(item.updated_at)}</span>}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </GlowingCard>

                </div>
              );
            })()}

          </div>
        )}

      </div>
    </div>
  );
}
