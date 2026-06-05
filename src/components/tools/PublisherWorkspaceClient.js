'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../Header';
import GlowingCard from '../GlowingCard';
import EyeOfHorusLoader from '../EyeOfHorusLoader';
import CustomSelect from '../CustomSelect';

export default function PublisherWorkspaceClient({ account, initialConfigs, oauthUrl }) {
  const router = useRouter();
  const [databases, setDatabases] = useState([]);
  const [configs, setConfigs] = useState(initialConfigs || []);
  
  const [editingDbId, setEditingDbId] = useState(null); // Database ID currently being configured
  const [dbDetails, setDbDetails] = useState(null);
  
  // Publisher Config States
  const [siteTitle, setSiteTitle] = useState('');
  const [siteDescription, setSiteDescription] = useState('');
  const [statusColumn, setStatusColumn] = useState('');
  const [statusValue, setStatusValue] = useState('Published');
  const [dateColumn, setDateColumn] = useState('');
  const [slugColumn, setSlugColumn] = useState('');
  const [theme, setTheme] = useState('egyptian_dark');

  // Preview States (fetched posts for the active config)
  const [posts, setPosts] = useState([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [postsError, setPostsError] = useState('');
  const [activeConfigIdForPosts, setActiveConfigIdForPosts] = useState(null);

  // UI General States
  const [isFetchingDbs, setIsFetchingDbs] = useState(true);
  const [isFetchingSchema, setIsFetchingSchema] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Custom confirmation modal states
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [configToDelete, setConfigToDelete] = useState(null);

  // 1. Fetch user's shared Notion databases on mount
  useEffect(() => {
    async function loadDatabases() {
      try {
        const response = await fetch('/api/databases?tool=publisher');
        if (!response.ok) {
          throw new Error('Failed to fetch databases');
        }
        const data = await response.json();
        setDatabases(data.databases || []);
      } catch (err) {
        setError('Failed to load your databases from Notion.');
        console.error(err);
      } finally {
        setIsFetchingDbs(false);
      }
    }
    loadDatabases();
  }, []);

  // 2. Fetch schema when a database is selected for configuration
  useEffect(() => {
    if (!editingDbId) {
      setDbDetails(null);
      setSiteTitle('');
      setSiteDescription('');
      setStatusColumn('');
      setStatusValue('Published');
      setDateColumn('');
      setSlugColumn('');
      setTheme('egyptian_dark');
      return;
    }

    async function loadDbSchema() {
      setIsFetchingSchema(true);
      setError('');
      setSuccessMsg('');
      try {
        const response = await fetch(`/api/databases?database_id=${editingDbId}&tool=publisher`);
        if (!response.ok) {
          throw new Error('Failed to fetch database schema');
        }
        const data = await response.json();
        setDbDetails(data);
        
        // Find if we already have an existing publisher configuration for this database
        const existingConfig = configs.find(c => c.database_id === editingDbId);
        
        if (existingConfig) {
          const settings = existingConfig.settings || {};
          setSiteTitle(settings.site_title || data.title);
          setSiteDescription(settings.site_description || '');
          setStatusColumn(settings.status_column || '');
          setStatusValue(settings.status_value || 'Published');
          setDateColumn(settings.date_column || '');
          setSlugColumn(settings.slug_column || '');
          setTheme(settings.theme || 'egyptian_dark');
        } else {
          // Defaults
          setSiteTitle(data.title);
          setSiteDescription('');
          setTheme('egyptian_dark');
          setStatusValue('Published');

          // Auto-select status column
          const firstSelectCol = data.selectColumns?.[0] || data.checkboxColumns?.[0];
          setStatusColumn(firstSelectCol ? firstSelectCol.name : '');
          
          // Auto-select date column
          const firstDateCol = data.dateColumns?.[0];
          setDateColumn(firstDateCol ? firstDateCol.name : '');

          // Auto-select slug column (look for title or url or rich text)
          const firstSlugCol = data.urlColumns?.find(c => c.type === 'url') || data.urlColumns?.[0];
          setSlugColumn(firstSlugCol ? firstSlugCol.name : '');
        }
      } catch (err) {
        setError('Failed to fetch Notion database columns.');
        console.error(err);
      } finally {
        setIsFetchingSchema(false);
      }
    }

    loadDbSchema();
  }, [editingDbId, configs]);

  // Fetch posts for the active config
  const loadConfigPosts = async (configId) => {
    setIsLoadingPosts(true);
    setPostsError('');
    setPosts([]);
    setActiveConfigIdForPosts(configId);
    try {
      const response = await fetch(`/api/tools/publisher/posts?config_id=${configId}`);
      const data = await response.json();
      if (response.ok && data.success) {
        setPosts(data.posts || []);
      } else {
        setPostsError(data.error || 'Failed to load published posts.');
      }
    } catch (err) {
      setPostsError('Connection error while fetching published pages.');
      console.error(err);
    } finally {
      setIsLoadingPosts(false);
    }
  };

  const handleSaveConfig = async () => {
    setIsSaving(true);
    setError('');
    setSuccessMsg('');

    const existing = configs.find(c => c.database_id === editingDbId);
    const configId = existing ? existing.id : null;
    const dbName = dbDetails?.title || 'Publisher Database';

    if (!siteTitle) {
      setError('You must specify a Site Title.');
      setIsSaving(false);
      return;
    }

    if (!statusColumn) {
      setError('You must select a status or publishing filter column.');
      setIsSaving(false);
      return;
    }

    if (!statusValue) {
      setError('You must specify a status publishing value.');
      setIsSaving(false);
      return;
    }

    if (!dateColumn) {
      setError('You must select a publication date column.');
      setIsSaving(false);
      return;
    }

    if (!slugColumn) {
      setError('You must select a slug mapping column.');
      setIsSaving(false);
      return;
    }

    try {
      const response = await fetch('/api/tools/publisher/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          configId,
          databaseId: editingDbId,
          databaseName: dbName,
          siteTitle,
          siteDescription,
          statusColumn,
          statusValue,
          dateColumn,
          slugColumn,
          theme,
          active: true
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMsg('✨ CMS site configuration saved successfully!');
        
        // Refresh configs list
        setConfigs(prev => {
          const idx = prev.findIndex(c => c.database_id === data.config.database_id);
          if (idx >= 0) {
            const updated = [...prev];
            updated[idx] = data.config;
            return updated;
          }
          return [data.config, ...prev];
        });

        // Trigger load of posts for the saved configuration
        loadConfigPosts(data.config.id);

        // Close editor panel after a slight delay
        setTimeout(() => {
          setEditingDbId(null);
        }, 1200);
      } else {
        setError(data.error || 'Failed to save CMS configuration.');
      }
    } catch (err) {
      setError('Connection error. Failed to save CMS settings.');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfig = async () => {
    if (!configToDelete) return;
    
    setError('');
    setSuccessMsg('');
    
    try {
      const res = await fetch(`/api/configs?id=${configToDelete.id}`, { method: 'DELETE' });
      if (res.ok) {
        setConfigs(prev => prev.filter(c => c.id !== configToDelete.id));
        setSuccessMsg('✨ Publisher configuration dissolved successfully.');
        if (activeConfigIdForPosts === configToDelete.id) {
          setPosts([]);
          setActiveConfigIdForPosts(null);
        }
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to delete configuration.');
      }
    } catch (err) {
      setError('Connection error while dissolving configuration.');
      console.error(err);
    } finally {
      setDeleteConfirmOpen(false);
      setConfigToDelete(null);
    }
  };

  const handleCopyUrl = (configId) => {
    const url = `${window.location.origin}/sites/${configId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(configId);
    setTimeout(() => setCopiedId(null), 2000);
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', zIndex: 1 }}>
      <Header account={account} onDisconnect={handleDisconnect} />

      <div className="container" style={{ padding: '40px 24px', flex: 1, maxWidth: '1200px' }}>
        
        {/* Hub Header */}
        <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--gold)', letterSpacing: '0.2em', fontFamily: 'var(--font-headings)' }}>
              THE PAPYRUS PUBLISHER
            </span>
            <h1 style={{ fontSize: '32px', marginTop: '4px', textTransform: 'uppercase', fontFamily: 'var(--font-headings)', margin: 0 }}>
              Publisher Chambers
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--sand-dim)', marginTop: '4px', margin: 0 }}>
              Convert Notion database scrolls into public-facing themed blogs & CMS websites instantly.
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <a href={oauthUrl} className="kemet-btn-secondary" style={{ textDecoration: 'none' }}>
              Reconnect Notion
            </a>
            <button onClick={() => router.push('/dashboard')} className="kemet-btn-secondary">
              Hall of Instruments
            </button>
          </div>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            color: '#F87171',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '24px',
            fontSize: '14px',
            animation: 'fadeIn 0.3s ease'
          }}>
            Error: {error}
          </div>
        )}

        {successMsg && (
          <div style={{
            background: 'rgba(52, 211, 153, 0.08)',
            border: '1px solid rgba(52, 211, 153, 0.25)',
            color: '#34D399',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '24px',
            fontSize: '14px',
            animation: 'fadeIn 0.3s ease'
          }}>
            {successMsg}
          </div>
        )}

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: editingDbId ? '1fr' : 'repeat(auto-fit, minmax(350px, 1fr))', 
          gap: '32px',
          alignItems: 'start'
        }}>
          
          {/* Editor Panel (Active when editingDbId is set) */}
          {editingDbId && (
            <GlowingCard title={dbDetails ? `Configure: ${dbDetails.title}` : 'Consulting Database...'} subtitle="SCROLL CONFIGURATOR">
              {isFetchingSchema ? (
                <div style={{ padding: '60px 0' }}>
                  <EyeOfHorusLoader size={50} text="Decrypting Notion database schema..." />
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '12px' }}>
                  
                  {/* Site Title */}
                  <div>
                    <label className="kemet-label">Blog/Website Title</label>
                    <input 
                      type="text" 
                      className="kemet-input"
                      value={siteTitle}
                      onChange={(e) => setSiteTitle(e.target.value)}
                      placeholder="e.g. The Papyrus Chronicler"
                    />
                  </div>

                  {/* Site Description */}
                  <div>
                    <label className="kemet-label">Website Description</label>
                    <textarea 
                      className="kemet-input"
                      rows="2"
                      value={siteDescription}
                      onChange={(e) => setSiteDescription(e.target.value)}
                      placeholder="e.g. Thoughts, histories, and translations from the ancient Nile valley."
                      style={{ resize: 'vertical', minHeight: '60px' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    {/* Status Column Select */}
                    <div>
                      <CustomSelect
                        label="Status Column (Filter)"
                        value={statusColumn}
                        onChange={setStatusColumn}
                        options={(dbDetails?.selectColumns || []).concat(dbDetails?.checkboxColumns || []).map(c => c.name)}
                        placeholder="Select column"
                      />
                    </div>

                    {/* Status Value */}
                    <div>
                      <label className="kemet-label">Publish Value</label>
                      <input 
                        type="text" 
                        className="kemet-input"
                        value={statusValue}
                        onChange={(e) => setStatusValue(e.target.value)}
                        placeholder="e.g. Published or Checked"
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    {/* Date Column Select */}
                    <div>
                      <CustomSelect
                        label="Publish Date Column"
                        value={dateColumn}
                        onChange={setDateColumn}
                        options={(dbDetails?.dateColumns || []).map(c => c.name)}
                        placeholder="Select column"
                      />
                    </div>

                    {/* Slug Column Select */}
                    <div>
                      <CustomSelect
                        label="URL Slug Column"
                        value={slugColumn}
                        onChange={setSlugColumn}
                        options={(dbDetails?.urlColumns || []).map(c => c.name)}
                        placeholder="Select column"
                      />
                    </div>
                  </div>

                  {/* Theme Selector */}
                  <div>
                    <CustomSelect
                      label="Visual Theme"
                      value={theme}
                      onChange={setTheme}
                      options={[
                        { value: 'egyptian_dark', label: 'Egyptian Dark (Obsidian & Gold)' },
                        { value: 'egyptian_light', label: 'Egyptian Light (Desert Sand)' },
                        { value: 'minimalist', label: 'Modern Minimalist' }
                      ]}
                      placeholder="Select a theme"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                    <button 
                      className="kemet-btn" 
                      onClick={handleSaveConfig}
                      disabled={isSaving}
                      style={{ flex: 1, justifyContent: 'center' }}
                    >
                      {isSaving ? 'Engraving...' : 'Activate Website'}
                    </button>
                    <button 
                      className="kemet-btn-secondary" 
                      onClick={() => setEditingDbId(null)}
                      disabled={isSaving}
                    >
                      Cancel
                    </button>
                  </div>
                  
                </div>
              )}
            </GlowingCard>
          )}

          {/* Databases Grid / Configurations Grid */}
          {!editingDbId && (
            <>
              {/* Left Column: Active Web Sites */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <h2 style={{ fontSize: '18px', textTransform: 'uppercase', fontFamily: 'var(--font-headings)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Active Websites ({configs.length})
                </h2>
                
                {configs.length === 0 ? (
                  <div style={{
                    padding: '40px 24px',
                    textAlign: 'center',
                    border: '1px dashed rgba(212, 175, 55, 0.15)',
                    borderRadius: '12px',
                    background: 'rgba(13, 13, 11, 0.4)'
                  }}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 12px', display: 'block', opacity: 0.5 }}>
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <polyline points="10 9 9 9 8 9" />
                    </svg>
                    <h3 style={{ fontSize: '16px', marginTop: '12px', color: 'var(--sand-light)' }}>No Active Publications</h3>
                    <p style={{ fontSize: '12px', color: 'var(--sand-dark)', maxWidth: '300px', margin: '8px auto 0' }}>
                      Select a Notion database scroll from the list on the right to configure and publish your blog site.
                    </p>
                  </div>
                ) : (
                  configs.map(cfg => {
                    const isSelectedForPosts = activeConfigIdForPosts === cfg.id;
                    return (
                      <GlowingCard 
                        key={cfg.id} 
                        title={cfg.settings?.site_title || 'The Papyrus Scroll'} 
                        subtitle={`DATABASE: ${cfg.database_name}`}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '10px' }}>
                          <p style={{ fontSize: '13px', color: 'var(--sand-dim)', margin: 0 }}>
                            {cfg.settings?.site_description || 'No site description provided.'}
                          </p>

                          <div style={{ 
                            background: 'rgba(13, 13, 11, 0.6)', 
                            border: '1px solid rgba(212, 175, 55, 0.1)', 
                            borderRadius: '6px',
                            padding: '10px 12px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '8px'
                          }}>
                            <code style={{ fontSize: '11px', color: 'var(--gold)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                              /sites/{cfg.id}
                            </code>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button 
                                onClick={() => handleCopyUrl(cfg.id)}
                                className="kemet-btn-secondary"
                                style={{ padding: '6px 10px', fontSize: '11px' }}
                              >
                                {copiedId === cfg.id ? 'Copied!' : 'Copy Link'}
                              </button>
                              <a 
                                href={`/sites/${cfg.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="kemet-btn"
                                style={{ padding: '6px 12px', fontSize: '11px', textDecoration: 'none' }}
                              >
                                Visit Site
                              </a>
                            </div>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button 
                                onClick={() => setEditingDbId(cfg.database_id)}
                                className="kemet-btn-secondary"
                                style={{ padding: '6px 12px', fontSize: '12px' }}
                              >
                                Configure
                              </button>
                              <button 
                                onClick={() => isSelectedForPosts ? setActiveConfigIdForPosts(null) : loadConfigPosts(cfg.id)}
                                className="kemet-btn-secondary"
                                style={{ padding: '6px 12px', fontSize: '12px', background: isSelectedForPosts ? 'rgba(212, 175, 55, 0.08)' : 'transparent' }}
                              >
                                {isSelectedForPosts ? 'Hide Posts' : 'View Posts'}
                              </button>
                            </div>
                            
                            <button 
                              onClick={() => {
                                setConfigToDelete(cfg);
                                setDeleteConfirmOpen(true);
                              }}
                              className="kemet-btn-secondary"
                              style={{ padding: '6px 12px', fontSize: '12px', color: '#EF4444', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                            >
                              Dissolve
                            </button>
                          </div>

                          {/* Nested Post Listing for this config */}
                          {isSelectedForPosts && (
                            <div style={{ 
                              marginTop: '12px', 
                              borderTop: '1px solid rgba(212, 175, 55, 0.1)', 
                              paddingTop: '16px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '12px'
                            }}>
                              <h4 style={{ fontSize: '13px', textTransform: 'uppercase', color: 'var(--gold)', margin: 0, fontFamily: 'var(--font-headings)' }}>
                                Published Scroll Pages
                              </h4>
                              
                              {isLoadingPosts ? (
                                <EyeOfHorusLoader size={30} text="Retrieving posts..." />
                              ) : postsError ? (
                                <div style={{ fontSize: '12px', color: '#F87171' }}>{postsError}</div>
                              ) : posts.length === 0 ? (
                                <div style={{ fontSize: '12px', color: 'var(--sand-dark)', fontStyle: 'italic' }}>
                                  No posts matching publishing status ({cfg.settings?.status_column} = "{cfg.settings?.status_value}") were found.
                                </div>
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto', paddingRight: '4px' }}>
                                  {posts.map(post => (
                                    <div key={post.id} style={{ 
                                      padding: '8px 12px', 
                                      background: 'rgba(255, 255, 255, 0.02)', 
                                      border: '1px solid rgba(255, 255, 255, 0.05)',
                                      borderRadius: '6px',
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center'
                                    }}>
                                      <div>
                                        <div style={{ fontSize: '13px', color: 'var(--sand-light)', fontWeight: 'bold' }}>{post.title}</div>
                                        <div style={{ fontSize: '11px', color: 'var(--sand-dark)' }}>
                                          Published: {post.date} &nbsp;•&nbsp; Slug: {post.slug}
                                        </div>
                                      </div>
                                      <a 
                                        href={`/sites/${cfg.id}/${post.id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ fontSize: '11px', color: 'var(--gold)', textDecoration: 'none' }}
                                      >
                                        Preview ↗
                                      </a>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                        </div>
                      </GlowingCard>
                    );
                  })
                )}
              </div>

              {/* Right Column: Database Archive */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <h2 style={{ fontSize: '18px', textTransform: 'uppercase', fontFamily: 'var(--font-headings)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Notion Database Archives
                </h2>
                
                {isFetchingDbs ? (
                  <div style={{ padding: '40px 0' }}>
                    <EyeOfHorusLoader size={50} text="Scanning shared portal records..." />
                  </div>
                ) : databases.length === 0 ? (
                  <div style={{
                    padding: '40px 24px',
                    textAlign: 'center',
                    border: '1px dashed rgba(212, 175, 55, 0.15)',
                    borderRadius: '12px',
                    background: 'rgba(13, 13, 11, 0.4)'
                  }}>
                    <p style={{ fontSize: '13px', color: 'var(--sand-dim)' }}>
                      No databases found. Make sure you shared databases with the integration during setup.
                    </p>
                    <a href={oauthUrl} className="kemet-btn" style={{ display: 'inline-flex', marginTop: '16px', textDecoration: 'none' }}>
                      Share Database Scrolls
                    </a>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {databases.map(db => {
                      const isConfigured = configs.some(c => c.database_id === db.id);
                      return (
                        <div 
                          key={db.id}
                          className="kemet-card"
                          style={{
                            padding: '20px',
                            background: 'rgba(13, 13, 11, 0.65)',
                            border: isConfigured ? '1px solid rgba(212, 175, 55, 0.4)' : '1px solid rgba(255, 255, 255, 0.05)',
                            boxShadow: isConfigured ? '0 0 15px rgba(212, 175, 55, 0.05)' : 'none',
                            borderRadius: '10px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '16px',
                            transition: 'var(--transition-smooth)'
                          }}
                        >
                          <div style={{ flex: 1, minWidth: '220px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
                                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                              </svg>
                              <h3 style={{ fontSize: '16px', margin: 0, color: 'var(--sand-light)' }}>
                                {db.title}
                              </h3>
                            </div>
                            <p style={{ fontSize: '11px', color: 'var(--sand-dark)', marginTop: '6px', margin: 0 }}>
                              ID: <code style={{ fontSize: '10px' }}>{db.id}</code>
                            </p>
                          </div>

                          <div>
                            <button
                              onClick={() => setEditingDbId(db.id)}
                              className={isConfigured ? 'kemet-btn-secondary' : 'kemet-btn'}
                              style={{ padding: '8px 16px', fontSize: '12px' }}
                            >
                              {isConfigured ? 'Edit Portal Settings' : 'Publish Scroll'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

        </div>

      </div>

      {/* Confirmation Modal */}
      {deleteConfirmOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(3, 3, 2, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            background: 'var(--obsidian-mid)',
            border: '1px solid rgba(212, 175, 55, 0.3)',
            borderRadius: '12px',
            padding: '32px',
            maxWidth: '450px',
            width: '90%',
            boxShadow: '0 15px 40px rgba(0,0,0,0.8), 0 0 25px rgba(212, 175, 55, 0.1)'
          }}>
            <h3 style={{ fontSize: '20px', textTransform: 'uppercase', fontFamily: 'var(--font-headings)', margin: 0, color: 'var(--gold)' }}>
              Dissolve Website
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--sand-dim)', lineHeight: 1.6, marginTop: '16px', marginBottom: '24px' }}>
              Are you certain you wish to dissolve the publication <strong>{configToDelete?.settings?.site_title}</strong>? 
              This will disable the public URL and tear down the rendering gateway. The source Notion database will remain completely untouched.
            </p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteConfirmOpen(false)} className="kemet-btn-secondary">
                Cancel
              </button>
              <button onClick={handleDeleteConfig} className="kemet-btn" style={{ background: '#EF4444', color: '#FFF', boxShadow: 'none' }}>
                Confirm Dissolve
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
