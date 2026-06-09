'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../Header';
import GlowingCard from '../GlowingCard';
import EyeOfHorusLoader from '../EyeOfHorusLoader';
import CustomSelect from '../CustomSelect';

export default function PdfWorkspaceClient({ account, initialConfigs, oauthUrl }) {
  const router = useRouter();
  const [databases, setDatabases] = useState([]);
  const [configs, setConfigs] = useState(initialConfigs || []);
  
  const [editingDbId, setEditingDbId] = useState(null); // Database ID currently being configured
  const [dbDetails, setDbDetails] = useState(null);
  
  // PDF Config States
  const [pdfTitle, setPdfTitle] = useState('');
  const [pdfPageSize, setPdfPageSize] = useState('A4');
  const [pdfMargins, setPdfMargins] = useState('standard');
  const [pdfOrientation, setPdfOrientation] = useState('portrait');

  // Preview States (fetched document pages for the active config)
  const [pages, setPages] = useState([]);
  const [isLoadingPages, setIsLoadingPages] = useState(false);
  const [pagesError, setPagesError] = useState('');
  const [activeConfigIdForPages, setActiveConfigIdForPages] = useState(null);

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
        const response = await fetch('/api/databases?tool=pdf');
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
      setPdfTitle('');
      setPdfPageSize('A4');
      setPdfMargins('standard');
      setPdfOrientation('portrait');
      return;
    }

    async function loadDbSchema() {
      setIsFetchingSchema(true);
      setError('');
      setSuccessMsg('');
      try {
        const response = await fetch(`/api/databases?database_id=${editingDbId}&tool=pdf`);
        if (!response.ok) {
          throw new Error('Failed to fetch database schema');
        }
        const data = await response.json();
        setDbDetails(data);
        
        // Find if we already have an existing PDF configuration for this database
        const existingConfig = configs.find(c => c.database_id === editingDbId);
        
        if (existingConfig) {
          const settings = existingConfig.settings || {};
          setPdfTitle(settings.pdf_title || data.title);
          setPdfPageSize(settings.pdf_page_size || 'A4');
          setPdfMargins(settings.pdf_margins || 'standard');
          setPdfOrientation(settings.pdf_orientation || 'portrait');
        } else {
          // Defaults
          setPdfTitle(data.title);
          setPdfPageSize('A4');
          setPdfMargins('standard');
          setPdfOrientation('portrait');
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

  // Fetch document pages for the active config
  const loadConfigPages = async (configId) => {
    setIsLoadingPages(true);
    setPagesError('');
    setPages([]);
    setActiveConfigIdForPages(configId);
    try {
      const response = await fetch(`/api/tools/pdf/posts?config_id=${configId}`);
      const data = await response.json();
      if (response.ok && data.success) {
        setPages(data.pages || []);
      } else {
        setPagesError(data.error || 'Failed to load document pages.');
      }
    } catch (err) {
      setPagesError('Connection error while fetching database pages.');
      console.error(err);
    } finally {
      setIsLoadingPages(false);
    }
  };

  const handleSaveConfig = async () => {
    setIsSaving(true);
    setError('');
    setSuccessMsg('');

    const existing = configs.find(c => c.database_id === editingDbId);
    const configId = existing ? existing.id : null;
    const dbName = dbDetails?.title || 'PDF Database';

    if (!pdfTitle) {
      setError('You must specify a Document Title.');
      setIsSaving(false);
      return;
    }

    try {
      const response = await fetch('/api/tools/pdf/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          configId,
          databaseId: editingDbId,
          databaseName: dbName,
          pdfTitle,
          pdfPageSize,
          pdfMargins,
          pdfOrientation,
          active: true
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMsg('PDF configuration saved successfully.');
        
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

        // Trigger load of pages for the saved configuration
        loadConfigPages(data.config.id);

        // Close editor panel after a slight delay
        setTimeout(() => {
          setEditingDbId(null);
        }, 1200);
      } else {
        setError(data.error || 'Failed to save PDF configuration.');
      }
    } catch (err) {
      setError('Connection error. Failed to save PDF settings.');
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
        setSuccessMsg('Rosetta Press configuration dissolved successfully.');
        if (activeConfigIdForPages === configToDelete.id) {
          setPages([]);
          setActiveConfigIdForPages(null);
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
      const response = await fetch('/api/auth/disconnect?tool=pdf', { method: 'POST' });
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
              THE ROSETTA PRESS
            </span>
            <h1 style={{ fontSize: '32px', marginTop: '4px', textTransform: 'uppercase', fontFamily: 'var(--font-headings)', margin: 0 }}>
              Press Chambers
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--sand-dim)', marginTop: '4px', margin: 0 }}>
              Convert Notion document page scrolls into print-ready PDF files dynamically.
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
          
          {/* Editor Panel (Active when editingDbId is set) */}
          {editingDbId && (
            <GlowingCard title={dbDetails ? `Configure: ${dbDetails.title}` : 'Consulting Database...'} subtitle="PDF PRINT CONFIGURATOR">
              {isFetchingSchema ? (
                <div style={{ padding: '60px 0' }}>
                  <EyeOfHorusLoader size={50} text="Decrypting Notion database schema..." />
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '12px' }}>
                  
                  {/* Document Title */}
                  <div>
                    <label className="kemet-label">PDF Document Title</label>
                    <input 
                      type="text" 
                      className="kemet-input"
                      value={pdfTitle}
                      onChange={(e) => setPdfTitle(e.target.value)}
                      placeholder="e.g. Project Sphinx Specification"
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '16px' }}>
                    {/* Page Size */}
                    <div>
                      <CustomSelect
                        label="Page Size"
                        value={pdfPageSize}
                        onChange={setPdfPageSize}
                        options={[
                          { value: 'A4', label: 'A4 Standard' },
                          { value: 'Letter', label: 'Letter Standard' }
                        ]}
                        placeholder="Select size"
                      />
                    </div>

                    {/* Orientation */}
                    <div>
                      <CustomSelect
                        label="Orientation"
                        value={pdfOrientation}
                        onChange={setPdfOrientation}
                        options={[
                          { value: 'portrait', label: 'Portrait' },
                          { value: 'landscape', label: 'Landscape' }
                        ]}
                        placeholder="Select orientation"
                      />
                    </div>
                  </div>

                  {/* Margins */}
                  <div>
                    <CustomSelect
                      label="Document Margins"
                      value={pdfMargins}
                      onChange={setPdfMargins}
                      options={[
                        { value: 'standard', label: 'Standard (20mm)' },
                        { value: 'narrow', label: 'Narrow (10mm)' },
                        { value: 'none', label: 'None (0mm)' }
                      ]}
                      placeholder="Select margins"
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
                      {isSaving ? 'Engraving...' : 'Activate Exporter'}
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
                  Active Press Gates ({configs.length})
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
                    </svg>
                    <h3 style={{ fontSize: '16px', marginTop: '12px', color: 'var(--sand-light)' }}>No Active Press Portals</h3>
                    <p style={{ fontSize: '12px', color: 'var(--sand-dark)', maxWidth: '300px', margin: '8px auto 0' }}>
                      Select a Notion database scroll from the list on the right to configure your PDF generator.
                    </p>
                  </div>
                ) : (
                  configs.map(cfg => {
                    const isSelectedForPages = activeConfigIdForPages === cfg.id;
                    return (
                      <GlowingCard 
                        key={cfg.id} 
                        title={cfg.settings?.pdf_title || 'The PDF Document'} 
                        subtitle={`DATABASE: ${cfg.database_name}`}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '10px' }}>
                          <p style={{ fontSize: '12px', color: 'var(--sand-dim)', margin: 0 }}>
                            Format: {cfg.settings?.pdf_page_size} • {cfg.settings?.pdf_orientation} • Margins: {cfg.settings?.pdf_margins}
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
                                onClick={() => isSelectedForPages ? setActiveConfigIdForPages(null) : loadConfigPages(cfg.id)}
                                className="kemet-btn-secondary"
                                style={{ padding: '6px 12px', fontSize: '12px', background: isSelectedForPages ? 'rgba(212, 175, 55, 0.08)' : 'transparent' }}
                              >
                                {isSelectedForPages ? 'Hide Pages' : 'View Pages'}
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

                          {/* Nested Document Page Listing */}
                          {isSelectedForPages && (
                            <div style={{ 
                              marginTop: '12px', 
                              borderTop: '1px solid rgba(212, 175, 55, 0.1)', 
                              paddingTop: '16px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '12px'
                            }}>
                              <h4 style={{ fontSize: '13px', textTransform: 'uppercase', color: 'var(--gold)', margin: 0, fontFamily: 'var(--font-headings)' }}>
                                Document Pages
                              </h4>
                              
                              {isLoadingPages ? (
                                <EyeOfHorusLoader size={30} text="Retrieving database pages..." />
                              ) : pagesError ? (
                                <div style={{ fontSize: '12px', color: '#F87171' }}>{pagesError}</div>
                              ) : pages.length === 0 ? (
                                <div style={{ fontSize: '12px', color: 'var(--sand-dark)', fontStyle: 'italic' }}>
                                  No database pages found.
                                </div>
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto', paddingRight: '4px' }}>
                                  {pages.map(p => (
                                    <div key={p.id} style={{ 
                                      padding: '8px 12px', 
                                      background: 'rgba(255, 255, 255, 0.02)', 
                                      border: '1px solid rgba(255, 255, 255, 0.05)',
                                      borderRadius: '6px',
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center'
                                    }}>
                                      <div style={{ fontSize: '13px', color: 'var(--sand-light)', fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '12px', flex: 1 }}>
                                        {p.title}
                                      </div>
                                      <a 
                                        href={`/sites/${cfg.id}/pdf/${p.id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="kemet-btn"
                                        style={{ padding: '6px 12px', fontSize: '11px', textDecoration: 'none' }}
                                      >
                                        Export PDF ↗
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
                <h2 style={{ fontSize: '18px', textTransform: 'uppercase', fontFamily: 'var(--font-headings)', margin: 0 }}>
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
                              {isConfigured ? 'Edit Portal Settings' : 'Publish Exporter'}
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
              Dissolve Portal
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--sand-dim)', lineHeight: 1.6, marginTop: '16px', marginBottom: '24px' }}>
              Are you certain you wish to dissolve the press gateway <strong>{configToDelete?.settings?.pdf_title}</strong>? 
              This will disable PDF exports for this configuration.
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
