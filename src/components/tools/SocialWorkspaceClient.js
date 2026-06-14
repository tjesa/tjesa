'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../Header';
import GlowingCard from '../GlowingCard';
import EyeOfHorusLoader from '../EyeOfHorusLoader';
import CustomSelect from '../CustomSelect';

export default function SocialWorkspaceClient({ account, initialConfigs, oauthUrl }) {
  const router = useRouter();
  const [databases, setDatabases] = useState([]);
  const [configs, setConfigs] = useState(initialConfigs || []);
  
  const [editingDbId, setEditingDbId] = useState(null); // Database ID currently being configured
  const [dbDetails, setDbDetails] = useState(null);
  
  // Webhook Config States
  const [webhookUrl, setWebhookUrl] = useState('');
  const [useSandbox, setUseSandbox] = useState(true);

  // Column Mappings Config States
  const [columnCaption, setColumnCaption] = useState('');
  const [columnImage, setColumnImage] = useState('');
  const [columnTrigger, setColumnTrigger] = useState('');
  const [columnPublish, setColumnPublish] = useState('');
  const [columnDate, setColumnDate] = useState('');
  const [triggerValue, setTriggerValue] = useState('Ready');
  const [statusPublishedValue, setStatusPublishedValue] = useState('Published');

  // Posts States (fetched from the active config)
  const [posts, setPosts] = useState([]);
  const [selectedPostIds, setSelectedPostIds] = useState([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [postsError, setPostsError] = useState('');
  const [activeConfigIdForPosts, setActiveConfigIdForPosts] = useState(null);

  // Dispatch Action States
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishStatusMsg, setPublishStatusMsg] = useState('');
  
  // UI General States
  const [isFetchingDbs, setIsFetchingDbs] = useState(true);
  const [isFetchingSchema, setIsFetchingSchema] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Custom confirmation modal states
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [configToDelete, setConfigToDelete] = useState(null);

  // 1. Fetch user's shared Notion databases on mount
  useEffect(() => {
    async function loadDatabases() {
      try {
        const response = await fetch('/api/databases?tool=social');
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
      setWebhookUrl('');
      setUseSandbox(true);
      setColumnCaption('');
      setColumnImage('');
      setColumnTrigger('');
      setColumnPublish('');
      setColumnDate('');
      setTriggerValue('Ready');
      setStatusPublishedValue('Published');
      return;
    }

    async function loadDbSchema() {
      setIsFetchingSchema(true);
      setError('');
      setSuccessMsg('');
      try {
        const response = await fetch(`/api/databases?database_id=${editingDbId}&tool=social`);
        if (!response.ok) {
          throw new Error('Failed to fetch database schema');
        }
        const data = await response.json();
        setDbDetails(data);
        
        // Find if we already have an existing configuration for this database
        const existingConfig = configs.find(c => c.database_id === editingDbId);
        
        if (existingConfig) {
          const settings = existingConfig.settings || {};
          setWebhookUrl(settings.webhook_url || '');
          setUseSandbox(settings.use_sandbox !== undefined ? settings.use_sandbox : true);
          setColumnCaption(settings.column_caption || '');
          setColumnImage(settings.column_image || '');
          setColumnTrigger(settings.column_trigger || '');
          setColumnPublish(settings.column_publish || '');
          setColumnDate(settings.column_date || '');
          setTriggerValue(settings.trigger_value || 'Ready');
          setStatusPublishedValue(settings.status_published_value || 'Published');
        } else {
          // Attempt default guesses
          const firstCaptionCol = data.urlColumns?.find(c => c.name.toLowerCase().includes('caption') || c.name.toLowerCase().includes('text') || c.type === 'rich_text')?.name || '';
          const firstImageCol = data.fileColumns?.find(c => c.type === 'files' || c.name.toLowerCase().includes('image'))?.name || '';
          const firstTriggerCol = data.selectColumns?.find(c => c.name.toLowerCase().includes('status') || c.name.toLowerCase().includes('trigger'))?.name || '';
          const firstPublishCol = data.checkboxColumns?.[0]?.name || '';
          const firstDateCol = data.dateColumns?.[0]?.name || '';

          setColumnCaption(firstCaptionCol);
          setColumnImage(firstImageCol);
          setColumnTrigger(firstTriggerCol);
          setColumnPublish(firstPublishCol);
          setColumnDate(firstDateCol);
          
          setUseSandbox(true);
          setTriggerValue('Ready');
          setStatusPublishedValue('Published');
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

  // Fetch posts list for the active config
  const loadConfigPosts = async (configId) => {
    setIsLoadingPosts(true);
    setPostsError('');
    setPosts([]);
    setSelectedPostIds([]);
    setActiveConfigIdForPosts(configId);
    try {
      const response = await fetch(`/api/tools/social/posts?config_id=${configId}`);
      const data = await response.json();
      if (response.ok && data.success) {
        setPosts(data.posts || []);
      } else {
        setPostsError(data.error || 'Failed to load social posts.');
      }
    } catch (err) {
      setPostsError('Connection error while fetching database post records.');
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
    const dbName = dbDetails?.title || 'Social Campaigns Database';

    if (!columnCaption) {
      setError('You must select the Post Caption Column mapping.');
      setIsSaving(false);
      return;
    }

    if (!useSandbox && !webhookUrl) {
      setError('Webhook URL is required when Sandbox Mode is deactivated.');
      setIsSaving(false);
      return;
    }

    try {
      const response = await fetch('/api/tools/social/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          configId,
          databaseId: editingDbId,
          databaseName: dbName,
          webhookUrl,
          useSandbox,
          columnCaption,
          columnImage,
          columnTrigger,
          columnPublish,
          columnDate,
          triggerValue,
          statusPublishedValue,
          active: true
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMsg('Social configuration saved successfully.');
        
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
        setError(data.error || 'Failed to save configuration settings.');
      }
    } catch (err) {
      setError('Connection error. Failed to save Social Herald settings.');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublishPosts = async (pageIds) => {
    if (pageIds.length === 0) return;
    setIsPublishing(true);
    setPublishStatusMsg(`Publishing ${pageIds.length} social post(s)...`);
    setError('');
    setSuccessMsg('');

    try {
      const response = await fetch('/api/tools/social/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          configId: activeConfigIdForPosts,
          pageIds
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccessMsg(`Campaign successfully dispatched: ${data.stats.published} published, ${data.stats.failed} failed.`);
        
        // Reload posts list to reflect new published statuses in Notion
        loadConfigPosts(activeConfigIdForPosts);
      } else {
        setError(data.error || 'Failed to execute social auto-publish.');
      }
    } catch (err) {
      setError('A connection disruption occurred during social dispatch.');
      console.error(err);
    } finally {
      setIsPublishing(false);
      setPublishStatusMsg('');
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
        setSuccessMsg('Royal Herald configuration dissolved successfully.');
        if (activeConfigIdForPosts === configToDelete.id) {
          setPosts([]);
          setSelectedPostIds([]);
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

  const handleDisconnect = async () => {
    try {
      const response = await fetch('/api/auth/disconnect?tool=social', { method: 'POST' });
      if (response.ok) {
        router.push('/');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleSelectAll = () => {
    if (selectedPostIds.length === posts.length) {
      setSelectedPostIds([]);
    } else {
      setSelectedPostIds(posts.map(c => c.id));
    }
  };

  const handleToggleSelectPost = (id) => {
    setSelectedPostIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', zIndex: 1 }}>
      <Header account={account} onDisconnect={handleDisconnect} />

      <div className="container" style={{ padding: '40px 24px', flex: 1, maxWidth: '1200px' }}>
        
        {/* Hub Header */}
        <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--gold)', letterSpacing: '0.2em', fontFamily: 'var(--font-headings)' }}>
              THE ROYAL HERALD
            </span>
            <h1 style={{ fontSize: '32px', marginTop: '4px', textTransform: 'uppercase', fontFamily: 'var(--font-headings)', margin: 0 }}>
              Herald Chambers
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--sand-dim)', marginTop: '4px', margin: 0 }}>
              Connect Notion databases containing drafted copy and dispatch them dynamically to your social platforms.
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
          gridTemplateColumns: editingDbId ? '1fr' : 'repeat(auto-fit, minmax(min(100%, 350px), 1fr))', 
          gap: '32px',
          alignItems: 'start'
        }}>
          
          {/* Configurator Panel */}
          {editingDbId && (
            <GlowingCard title={dbDetails ? `Configure Dispatcher: ${dbDetails.title}` : 'Opening Herald Chambers...'} subtitle="AUTO-PUBLISH CONFIGURATOR">
              {isFetchingSchema ? (
                <div style={{ padding: '60px 0' }}>
                  <EyeOfHorusLoader size={50} text="Decrypting database properties..." />
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', marginTop: '12px' }}>
                  
                  {/* Webhook Settings */}
                  <div style={{ borderBottom: '1px solid rgba(212, 175, 55, 0.1)', paddingBottom: '24px' }}>
                    <h3 style={{ fontSize: '15px', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '16px', fontFamily: 'var(--font-headings)' }}>
                      1. Social Dispatch Webhook Engine
                    </h3>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', background: 'rgba(212, 175, 55, 0.03)', padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
                      <input 
                        type="checkbox" 
                        id="sandbox-toggle"
                        checked={useSandbox}
                        onChange={(e) => setUseSandbox(e.target.checked)}
                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                      />
                      <label htmlFor="sandbox-toggle" style={{ fontSize: '13px', color: 'var(--sand-light)', cursor: 'pointer', fontWeight: 'bold' }}>
                        Activate Mock Sandbox Mode (No Webhook required for testing)
                      </label>
                    </div>

                    {!useSandbox && (
                      <div>
                        <label className="kemet-label">Webhook Endpoint URL *</label>
                        <input 
                          type="url" 
                          className="kemet-input"
                          value={webhookUrl}
                          onChange={(e) => setWebhookUrl(e.target.value)}
                          placeholder="https://make.com/incoming/webhook-id-here"
                        />
                        <span style={{ fontSize: '10px', color: 'var(--sand-dark)', marginTop: '6px', display: 'block' }}>
                          Enter your custom webhook listener URL (Zapier, Make.com, or IFTTT) to route posts to Twitter, LinkedIn, etc.
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Notion Mappings */}
                  <div>
                    <h3 style={{ fontSize: '15px', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '16px', fontFamily: 'var(--font-headings)' }}>
                      2. Notion Property Mappings
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '16px', marginBottom: '16px' }}>
                      <div>
                        <CustomSelect
                          label="Post Caption Column *"
                          value={columnCaption}
                          onChange={setColumnCaption}
                          options={(dbDetails?.urlColumns || []).map(c => ({ value: c.name, label: `${c.name} (${c.type})` }))}
                          placeholder="Select Column"
                        />
                      </div>
                      <div>
                        <CustomSelect
                          label="Post Image Column"
                          value={columnImage}
                          onChange={setColumnImage}
                          options={(dbDetails?.fileColumns || []).map(c => ({ value: c.name, label: `${c.name} (files/media)` }))}
                          placeholder="Select Column"
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '16px', marginBottom: '16px' }}>
                      <div>
                        <CustomSelect
                          label="Status Trigger Column"
                          value={columnTrigger}
                          onChange={setColumnTrigger}
                          options={[
                            { value: '', label: 'None (Publish manually or full sync)' },
                            ...(dbDetails?.checkboxColumns || []).map(c => ({ value: c.name, label: `${c.name} (checkbox)` })),
                            ...(dbDetails?.selectColumns || []).map(c => ({ value: c.name, label: `${c.name} (${c.type})` }))
                          ]}
                          placeholder="Select Column"
                        />
                      </div>
                      {columnTrigger && (
                        <div>
                          <label className="kemet-label">Trigger Condition Value</label>
                          <input 
                            type="text" 
                            className="kemet-input"
                            value={triggerValue}
                            onChange={(e) => setTriggerValue(e.target.value)}
                            placeholder="e.g. Ready"
                          />
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '16px' }}>
                      <div>
                        <CustomSelect
                          label="Published Checker Column"
                          value={columnPublish}
                          onChange={setColumnPublish}
                          options={[
                            { value: '', label: 'None' },
                            ...(dbDetails?.checkboxColumns || []).map(c => ({ value: c.name, label: `${c.name} (checkbox)` })),
                            ...(dbDetails?.selectColumns || []).map(c => ({ value: c.name, label: `${c.name} (${c.type})` }))
                          ]}
                          placeholder="Select Column"
                        />
                      </div>
                      {columnPublish && (
                        <div>
                          <label className="kemet-label">Published State Value</label>
                          <input 
                            type="text" 
                            className="kemet-input"
                            value={statusPublishedValue}
                            onChange={(e) => setStatusPublishedValue(e.target.value)}
                            placeholder="e.g. Published"
                          />
                        </div>
                      )}
                    </div>

                    <div style={{ marginTop: '16px' }}>
                      <CustomSelect
                        label="Published Date Column (optional writeback)"
                        value={columnDate}
                        onChange={setColumnDate}
                        options={[
                          { value: '', label: 'None' },
                          ...(dbDetails?.dateColumns || []).map(c => ({ value: c.name, label: `${c.name} (date)` }))
                        ]}
                        placeholder="Select Column"
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                    <button 
                      className="kemet-btn" 
                      onClick={handleSaveConfig}
                      disabled={isSaving}
                      style={{ flex: 1, justifyContent: 'center' }}
                    >
                      {isSaving ? 'Engraving...' : 'Activate Auto-Publisher'}
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

          {/* Active Publishers Grid */}
          {!editingDbId && (
            <>
              {/* Left Column: Active Publishers */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <h2 style={{ fontSize: '18px', textTransform: 'uppercase', fontFamily: 'var(--font-headings)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Active Herald Gates ({configs.length})
                </h2>
                
                {configs.length === 0 ? (
                  <div style={{
                    padding: '40px 24px',
                    textAlign: 'center',
                    border: '1px dashed rgba(212, 175, 55, 0.15)',
                    borderRadius: '12px',
                    background: 'rgba(var(--obsidian-rgb), 0.4)'
                  }}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 12px', display: 'block', opacity: 0.5 }}>
                      <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
                    </svg>
                    <h3 style={{ fontSize: '16px', marginTop: '12px', color: 'var(--sand-light)' }}>No Active Auto-Publishers</h3>
                    <p style={{ fontSize: '12px', color: 'var(--sand-dark)', maxWidth: '300px', margin: '8px auto 0' }}>
                      Select a Notion database archive containing drafted posts from the list on the right to trigger auto-publishing.
                    </p>
                  </div>
                ) : (
                  configs.map(cfg => {
                    const isSelectedForPosts = activeConfigIdForPosts === cfg.id;
                    return (
                      <GlowingCard 
                        key={cfg.id} 
                        title={`Campaign: ${cfg.database_name}`} 
                        subtitle={`MAPPED: ${cfg.settings?.column_caption}`}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '10px' }}>
                          <p style={{ fontSize: '12px', color: 'var(--sand-dim)', margin: 0 }}>
                            Mode: {cfg.settings?.use_sandbox ? 'Sandbox' : 'Webhook'} • Trigger: {cfg.settings?.column_trigger || 'None'} • Writeback: {cfg.settings?.column_publish || 'None'}
                          </p>

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
                                {isSelectedForPosts ? 'Hide Drafts' : 'View Drafts'}
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

                          {/* Nested Drafts Listing */}
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
                                Social Posts Archive
                              </h4>
                              
                              {isLoadingPosts ? (
                                <EyeOfHorusLoader size={30} text="Scanning drafts archive..." />
                              ) : postsError ? (
                                <div style={{ fontSize: '12px', color: '#F87171' }}>{postsError}</div>
                              ) : posts.length === 0 ? (
                                <div style={{ fontSize: '12px', color: 'var(--sand-dark)', fontStyle: 'italic' }}>
                                  No posts found in database.
                                </div>
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                  
                                  {/* List controls */}
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255, 255, 255, 0.02)', padding: '6px 10px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.03)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <input 
                                        type="checkbox"
                                        checked={selectedPostIds.length === posts.length && posts.length > 0}
                                        onChange={handleToggleSelectAll}
                                        style={{ cursor: 'pointer' }}
                                      />
                                      <span style={{ fontSize: '11px', color: 'var(--sand-dim)' }}>Select All</span>
                                    </div>
                                    <span style={{ fontSize: '11px', color: 'var(--gold)' }}>
                                      {selectedPostIds.length} of {posts.length} Selected
                                    </span>
                                  </div>

                                  {/* Posts List */}
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto', paddingRight: '4px' }}>
                                    {posts.map(p => (
                                      <div key={p.id} style={{ 
                                        padding: '8px 12px', 
                                        background: 'rgba(255, 255, 255, 0.02)', 
                                        border: '1px solid rgba(255, 255, 255, 0.05)',
                                        borderRadius: '6px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px'
                                      }}>
                                        <input 
                                          type="checkbox" 
                                          checked={selectedPostIds.includes(p.id)}
                                          onChange={() => handleToggleSelectPost(p.id)}
                                          style={{ cursor: 'pointer' }}
                                        />
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                          <div style={{ fontSize: '13px', color: 'var(--sand-light)', fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {p.title}
                                          </div>
                                          <div style={{ fontSize: '11px', color: 'var(--sand-dark)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {p.caption || 'No caption text'}
                                          </div>
                                        </div>
                                        <div>
                                          {p.isPublished ? (
                                            <span style={{ 
                                              fontSize: '10px', 
                                              padding: '2px 6px', 
                                              background: 'rgba(52, 211, 153, 0.1)', 
                                              color: '#34D399', 
                                              borderRadius: '4px',
                                              border: '1px solid rgba(52,211,153,0.2)' 
                                            }}>
                                              Published
                                            </span>
                                          ) : p.triggerMet ? (
                                            <span style={{ 
                                              fontSize: '10px', 
                                              padding: '2px 6px', 
                                              background: 'rgba(212, 175, 55, 0.1)', 
                                              color: 'var(--gold)', 
                                              borderRadius: '4px',
                                              border: '1px solid rgba(212,175,55,0.2)' 
                                            }}>
                                              Ready
                                            </span>
                                          ) : (
                                            <span style={{ 
                                              fontSize: '10px', 
                                              padding: '2px 6px', 
                                              background: 'rgba(255, 255, 255, 0.05)', 
                                              color: 'var(--sand-dim)', 
                                              borderRadius: '4px' 
                                            }}>
                                              Draft
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>

                                  {/* Send Trigger */}
                                  <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                                    <button
                                      onClick={() => handlePublishPosts(selectedPostIds)}
                                      disabled={isPublishing || selectedPostIds.length === 0}
                                      className="kemet-btn"
                                      style={{ flex: 1, justifyContent: 'center', fontSize: '12px', padding: '8px 16px' }}
                                    >
                                      {isPublishing ? publishStatusMsg : `Publish Selected (${selectedPostIds.length})`}
                                    </button>
                                    <button
                                      onClick={() => handlePublishPosts(posts.filter(p => p.triggerMet && !p.isPublished).map(p => p.id))}
                                      disabled={isPublishing || posts.filter(p => p.triggerMet && !p.isPublished).length === 0}
                                      className="kemet-btn-secondary"
                                      style={{ justifyContent: 'center', fontSize: '12px', padding: '8px 16px' }}
                                    >
                                      Sync Active Queue
                                    </button>
                                  </div>

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
                <h2 style={{ fontSize: '18px', textTransform: 'uppercase', fontFamily: 'var(--font-headings)', margin: 0 }}>
                  Notion Database Archives
                </h2>
                
                {isFetchingDbs ? (
                  <div style={{ padding: '40px 0' }}>
                    <EyeOfHorusLoader size={50} text="Scanning drafts archive records..." />
                  </div>
                ) : databases.length === 0 ? (
                  <div style={{
                    padding: '40px 24px',
                    textAlign: 'center',
                    border: '1px dashed rgba(212, 175, 55, 0.15)',
                    borderRadius: '12px',
                    background: 'rgba(var(--obsidian-rgb), 0.4)'
                  }}>
                    <p style={{ fontSize: '13px', color: 'var(--sand-dim)' }}>
                      No databases found. Make sure you shared database drafts with the integration during setup.
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
                            background: 'rgba(var(--obsidian-rgb), 0.65)',
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
                              {isConfigured ? 'Edit Settings' : 'Create Dispatch'}
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
              Dissolve Herald Gate
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--sand-dim)', lineHeight: 1.6, marginTop: '16px', marginBottom: '24px' }}>
              Are you certain you wish to dissolve the Royal Herald social gate for <strong>{configToDelete?.database_name}</strong>? 
              This will disable campaign dispatches and trigger updates for this configuration.
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
