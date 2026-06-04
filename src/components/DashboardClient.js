'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from './Header';
import GlowingCard from './GlowingCard';
import EyeOfHorusLoader from './EyeOfHorusLoader';
import CustomSelect from './CustomSelect';

export default function DashboardClient({ account, initialConfigs, oauthUrl }) {
  const router = useRouter();
  const [databases, setDatabases] = useState([]);
  const [configs, setConfigs] = useState(initialConfigs || []);
  const [editingDbId, setEditingDbId] = useState(null); // Database ID currently being edited/configured
  const [dbDetails, setDbDetails] = useState(null);
  
  const [sourceColumn, setSourceColumn] = useState('');
  const [targetColumn, setTargetColumn] = useState('');
  const [triggerType, setTriggerType] = useState('full');
  const [triggerColumn, setTriggerColumn] = useState('');
  const [triggerValue, setTriggerValue] = useState('');
  
  // Custom styling settings for QR code
  const [foregroundColor, setForegroundColor] = useState('#141311');
  const [backgroundColor, setBackgroundColor] = useState('#F6F0E0');
  const [size, setSize] = useState(250);
  const [margin, setMargin] = useState(2);
  const [isStylingOpen, setIsStylingOpen] = useState(false);

  // Custom confirmation modal states
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [configToDelete, setConfigToDelete] = useState(null);

  const [isFetchingDbs, setIsFetchingDbs] = useState(true);
  const [isFetchingSchema, setIsFetchingSchema] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const [syncResult, setSyncResult] = useState(null);
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState('');

  // 1. Fetch user's shared Notion databases (Papyri) on mount
  useEffect(() => {
    async function loadDatabases() {
      try {
        const response = await fetch('/api/databases?tool=qr');
        if (!response.ok) {
          throw new Error('Failed to fetch databases');
        }
        const data = await response.json();
        setDatabases(data.databases || []);
      } catch (err) {
        setError('Failed to load your Papyri (databases) from Notion.');
        console.error(err);
      } finally {
        setIsFetchingDbs(false);
      }
    }
    loadDatabases();
  }, []);

  // 2. Fetch column schemas when a database is selected for configuration
  useEffect(() => {
    if (!editingDbId) {
      setDbDetails(null);
      setSourceColumn('');
      setTargetColumn('');
      return;
    }

    async function loadDbSchema() {
      setIsFetchingSchema(true);
      setError('');
      setSyncResult(null);
      setLogs([]);
      try {
        const response = await fetch(`/api/databases?database_id=${editingDbId}&tool=qr`);
        if (!response.ok) {
          throw new Error('Failed to fetch database schema');
        }
        const data = await response.json();
        setDbDetails(data);
        
        // Pre-populate if there is an existing config for this database
        const existingConfig = configs.find(c => c.database_id === editingDbId);
        if (existingConfig) {
          const settings = existingConfig.settings || {};
          setSourceColumn(settings.source_column || '');
          setTargetColumn(settings.target_column || '');
          setTriggerType(settings.trigger_type || 'full');
          setTriggerColumn(settings.trigger_column || '');
          setTriggerValue(settings.trigger_value || '');
          setForegroundColor(settings.foreground_color || '#141311');
          setBackgroundColor(settings.background_color || '#F6F0E0');
          setSize(settings.size || 250);
          setMargin(settings.margin !== undefined ? settings.margin : 2);
        } else {
          // Auto-select default columns (UX polish)
          const defaultSource = data.urlColumns.find(col => 
            ['url', 'link', 'website', 'source'].includes(col.name.toLowerCase())
          ) || data.urlColumns[0];
          
          const defaultTarget = data.fileColumns.find(col => 
            ['qr', 'qrcode', 'qr code', 'glyp', 'image'].includes(col.name.toLowerCase())
          ) || data.fileColumns[0];

          setSourceColumn(defaultSource ? defaultSource.name : '');
          setTargetColumn(defaultTarget ? defaultTarget.name : '');
          setTriggerType('full');
          setTriggerColumn('');
          setTriggerValue('');
          setForegroundColor('#141311');
          setBackgroundColor('#F6F0E0');
          setSize(250);
          setMargin(2);
        }
      } catch (err) {
        setError('Failed to fetch database properties schema.');
        console.error(err);
      } finally {
        setIsFetchingSchema(false);
      }
    }

    loadDbSchema();
  }, [editingDbId, configs]);

  // 3. Handle Sync trigger (Carving Glyphs)
  const handleSync = async (configPayload = null) => {
    setIsSyncing(true);
    setError('');
    setSyncResult(null);
    
    const dbId = configPayload ? configPayload.database_id : editingDbId;
    const dbName = configPayload ? configPayload.database_name : dbDetails?.title;
    
    const existing = configs.find(c => c.database_id === dbId);
    const configId = configPayload ? configPayload.id : (existing ? existing.id : null);
    
    const settings = configPayload ? (configPayload.settings || {}) : {};
    const srcCol = configPayload ? settings.source_column : sourceColumn;
    const tgtCol = configPayload ? settings.target_column : targetColumn;
    const trigType = configPayload ? settings.trigger_type : triggerType;
    const trigCol = configPayload ? settings.trigger_column : triggerColumn;
    const trigVal = configPayload ? settings.trigger_value : triggerValue;

    const fgColor = configPayload ? (settings.foreground_color || '#141311') : foregroundColor;
    const bgColor = configPayload ? (settings.background_color || '#F6F0E0') : backgroundColor;
    const qrSize = configPayload ? (settings.size || 250) : size;
    const qrMargin = configPayload ? (settings.margin !== undefined ? settings.margin : 2) : margin;

    setLogs([`Initiating sync for database: "${dbName}"...`, `Extracting source URLs from "${srcCol}"...`]);

    try {
      const response = await fetch('/api/tools/qr/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          configId,
          databaseId: dbId,
          databaseName: dbName,
          sourceColumn: srcCol,
          targetColumn: tgtCol,
          triggerType: trigType,
          triggerColumn: trigCol,
          triggerValue: trigVal,
          foregroundColor: fgColor,
          backgroundColor: bgColor,
          size: qrSize,
          margin: qrMargin
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSyncResult(data.stats);
        
        // Append sync logs
        setLogs(prev => [
          ...prev,
          `Query successful. Carved ${data.stats.synced} glyphs.`,
          `Skipped ${data.stats.skipped} unchanged rows.`,
          data.stats.failed > 0 ? `⚠️ Encountered ${data.stats.failed} errors during sync.` : `✨ Sacred task completed successfully!`
        ]);

        // Refresh configs list
        setConfigs(prev => {
          const index = prev.findIndex(c => c.database_id === data.config.database_id);
          if (index >= 0) {
            const updated = [...prev];
            updated[index] = data.config;
            return updated;
          }
          return [data.config, ...prev];
        });

        // Close inline edit panel
        setEditingDbId(null);
      } else {
        setError(data.error || 'Failed to synchronize.');
        setLogs(prev => [...prev, `❌ Error: ${data.error}`]);
      }
    } catch (err) {
      setError('A cosmic alignment error occurred while carving. Try again.');
      setLogs(prev => [...prev, `❌ Exception: Connection disrupted.`]);
      console.error(err);
    } finally {
      setIsSyncing(false);
    }
  };

  // 4. Handle Disconnect / Logout
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
      
      <div className="container" style={{ padding: '40px 24px', flex: 1, maxWidth: '1000px' }}>
        
        {/* Tool Header */}
        <div style={{ marginBottom: '32px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: 'var(--gold)', letterSpacing: '0.15em', fontFamily: 'var(--font-headings)' }}>
            THE GLYPH CARVER WORKSTATION
          </span>
          <h2 style={{ fontSize: '32px', marginTop: '4px', textTransform: 'uppercase' }}>
            Sacred Scrolls & Databases
          </h2>
          <p style={{ maxWidth: '600px', fontSize: '14px', marginTop: '8px', color: 'var(--sand-dim)' }}>
            Configure dynamic QR code generation for any of your shared Notion databases. View statuses, copy webhooks, and trigger carvings directly from their scrolls below.
          </p>
          {oauthUrl && (
            <div style={{ marginTop: '12px' }}>
              <a href={oauthUrl} className="kemet-btn" style={{ padding: '8px 18px', fontSize: '12px' }}>
                🔗 Connect Notion Database / Add Pages
              </a>
            </div>
          )}
        </div>

        {error && (
          <div style={{
            padding: '16px',
            background: 'rgba(168, 36, 36, 0.1)',
            border: '1px solid var(--scarab-red)',
            borderRadius: '8px',
            color: '#FF7F7F',
            fontSize: '14px',
            marginBottom: '24px',
            maxWidth: '800px',
            marginLeft: 'auto',
            marginRight: 'auto'
          }}>
            {error}
          </div>
        )}

        {/* Databases List */}
        {isFetchingDbs ? (
          <div style={{ padding: '48px 0', textAlign: 'center' }}>
            <EyeOfHorusLoader size={60} text="Summoning Notion Papyri..." />
          </div>
        ) : databases.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '48px 24px', 
            border: '1px dashed rgba(212,175,55,0.15)', 
            borderRadius: '8px', 
            maxWidth: '600px', 
            margin: '0 auto' 
          }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--sand-dark)" strokeWidth="1.5" style={{ marginBottom: '12px' }}>
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="9" y1="9" x2="15" y2="15" />
              <line x1="15" y1="9" x2="9" y2="15" />
            </svg>
            <p style={{ fontSize: '14px', color: 'var(--sand-dim)', marginBottom: '16px' }}>
              No databases found. Make sure you have shared databases with the Tjesa connection in Notion!
            </p>
            {oauthUrl && (
              <a href={oauthUrl} className="kemet-btn" style={{ padding: '8px 20px', fontSize: '12px' }}>
                🔗 Connect Notion Database
              </a>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px', margin: '0 auto' }}>
            {databases.map(db => {
              const config = configs.find(c => c.database_id === db.id);
              const isEditing = editingDbId === db.id;
              
              return (
                <GlowingCard 
                  key={db.id} 
                  title={db.title} 
                  subtitle={`Notion Database ID: ${db.id}`}
                >
                  {/* Status & Action Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                      {config ? (
                        <span style={{ 
                          fontSize: '10px', 
                          padding: '4px 10px', 
                          background: 'rgba(52, 211, 153, 0.1)', 
                          border: '1px solid rgba(52, 211, 153, 0.3)', 
                          borderRadius: '20px', 
                          color: '#34D399',
                          fontFamily: 'var(--font-headings)',
                          letterSpacing: '0.05em'
                        }}>
                          ACTIVE SYNC
                        </span>
                      ) : (
                        <span style={{ 
                          fontSize: '10px', 
                          padding: '4px 10px', 
                          background: 'rgba(212, 175, 55, 0.05)', 
                          border: '1px solid rgba(212, 175, 55, 0.2)', 
                          borderRadius: '20px', 
                          color: 'var(--sand-dim)',
                          fontFamily: 'var(--font-headings)',
                          letterSpacing: '0.05em'
                        }}>
                          NOT CONFIGURED
                        </span>
                      )}
                      
                      {config && (
                        <span style={{ fontSize: '12px', color: 'var(--sand-dim)' }}>
                          Trigger: <strong style={{ color: 'var(--gold)' }}>
                            {config.settings?.trigger_type === 'checkbox' ? `Checkbox (${config.settings.trigger_column})` : config.settings?.trigger_type === 'select' ? `Status (${config.settings.trigger_column} = ${config.settings.trigger_value})` : config.settings?.trigger_type === 'webhook' ? 'Button / Webhook' : 'Always'}
                          </strong>
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      {config ? (
                        <>
                          <button
                            className="kemet-btn"
                            style={{ padding: '6px 14px', fontSize: '11px', height: 'auto', minHeight: 'unset' }}
                            disabled={isSyncing}
                            onClick={() => handleSync(config)}
                          >
                            Sync Now
                          </button>
                          <button
                            className="kemet-btn-secondary"
                            style={{ padding: '6px 14px', fontSize: '11px' }}
                            disabled={isSyncing}
                            onClick={() => setEditingDbId(isEditing ? null : db.id)}
                          >
                            {isEditing ? 'Close' : 'Configure'}
                          </button>
                          <button
                            className="kemet-btn-secondary"
                            style={{ padding: '6px 14px', fontSize: '11px', borderColor: 'var(--scarab-red)', color: '#FF7F7F' }}
                            disabled={isSyncing}
                            onClick={() => {
                              setConfigToDelete(config);
                              setDeleteConfirmOpen(true);
                            }}
                          >
                            Delete
                          </button>
                        </>
                      ) : (
                        <button
                          className="kemet-btn"
                          style={{ padding: '6px 16px', fontSize: '11px', height: 'auto', minHeight: 'unset' }}
                          disabled={isSyncing}
                          onClick={() => setEditingDbId(isEditing ? null : db.id)}
                        >
                          {isEditing ? 'Cancel Setup' : 'Setup QR Generator'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Inline Configuration / Editor Panel */}
                  {isEditing && (
                    <div style={{ 
                      marginTop: '20px', 
                      paddingTop: '20px', 
                      borderTop: '1px solid rgba(212, 175, 55, 0.12)',
                      animation: 'fadeIn 0.3s ease-out'
                    }}>
                      {isFetchingSchema ? (
                        <div style={{ padding: '20px 0', textAlign: 'center' }}>
                          <EyeOfHorusLoader size={40} text="Reading database properties..." />
                        </div>
                      ) : dbDetails ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                          
                          {/* Columns selectors */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div>
                              <CustomSelect
                                label="SOURCE COLUMN (URL / Text)"
                                placeholder="-- Select Source Column --"
                                options={dbDetails.urlColumns.map(col => ({ 
                                  value: col.name, 
                                  label: `${col.name} (${col.type})` 
                                }))}
                                value={sourceColumn}
                                onChange={setSourceColumn}
                              />
                            </div>
                            <div>
                              <CustomSelect
                                label="TARGET COLUMN (Files & Media)"
                                placeholder="-- Select Destination Column --"
                                options={dbDetails.fileColumns.map(col => ({ 
                                  value: col.name, 
                                  label: `${col.name} (${col.type})` 
                                }))}
                                value={targetColumn}
                                onChange={setTargetColumn}
                              />
                            </div>
                          </div>

                          {/* Trigger selector */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <CustomSelect
                              label="SYNC TRIGGER MODE"
                              placeholder="Select Trigger Mode"
                              options={[
                                { value: 'full', label: 'Always Generate (Full Sync)' },
                                { value: 'checkbox', label: 'Checkbox Trigger (Only if checked)' },
                                { value: 'select', label: 'Select / Status Trigger' },
                                { value: 'webhook', label: 'Button Webhook Trigger (On-Demand)' }
                              ]}
                              value={triggerType}
                              onChange={(val) => {
                                setTriggerType(val);
                                setTriggerColumn('');
                                setTriggerValue('');
                              }}
                            />

                            {triggerType === 'checkbox' && (
                              <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
                                <CustomSelect
                                  label="TRIGGER CHECKBOX COLUMN"
                                  placeholder="Choose Checkbox column"
                                  options={dbDetails.checkboxColumns?.map(col => ({ value: col.name, label: col.name })) || []}
                                  value={triggerColumn}
                                  onChange={setTriggerColumn}
                                />
                              </div>
                            )}

                            {triggerType === 'select' && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeIn 0.2s ease-out' }}>
                                <CustomSelect
                                  label="TRIGGER STATUS / SELECT COLUMN"
                                  placeholder="Choose Select/Status column"
                                  options={dbDetails.selectColumns?.map(col => ({ value: col.name, label: `${col.name} (${col.type})` })) || []}
                                  value={triggerColumn}
                                  onChange={setTriggerColumn}
                                />
                                <div>
                                  <label className="kemet-label" htmlFor="trigger-val">TRIGGER VALUE (Case Sensitive)</label>
                                  <input 
                                    id="trigger-val"
                                    className="kemet-input"
                                    type="text"
                                    placeholder="e.g. Sync, Done, Active"
                                    value={triggerValue}
                                    onChange={(e) => setTriggerValue(e.target.value)}
                                  />
                                </div>
                              </div>
                            )}

                            {triggerType === 'webhook' && (
                              <div style={{
                                animation: 'fadeIn 0.2s ease-out',
                                padding: '12px',
                                background: 'rgba(212, 175, 55, 0.05)',
                                border: '1px solid rgba(212, 175, 55, 0.15)',
                                borderRadius: '6px',
                                fontSize: '12px',
                                color: 'var(--sand-dim)',
                                lineHeight: '1.4'
                              }}>
                                <span style={{ color: 'var(--gold)', fontWeight: 'bold', display: 'block', marginBottom: '4px', fontFamily: 'var(--font-headings)' }}>
                                  ⚡ BUTTON WEBHOOK MODE ACTIVE
                                </span>
                                This mode stops background polling. QR codes will only be generated when a <strong>Notion Button</strong> sends a POST request to this configuration's unique webhook URL.
                              </div>
                            )}
                          </div>

                          {/* Sacred Glyph Styling Accordion */}
                          <div style={{
                            border: '1px solid rgba(212, 175, 55, 0.15)',
                            borderRadius: '8px',
                            background: 'rgba(20, 19, 17, 0.4)',
                            overflow: 'hidden',
                            marginTop: '10px'
                          }}>
                            {/* Accordion Header */}
                            <button
                              type="button"
                              onClick={() => setIsStylingOpen(!isStylingOpen)}
                              style={{
                                width: '100%',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '12px 16px',
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--gold)',
                                fontFamily: 'var(--font-headings)',
                                fontSize: '13px',
                                letterSpacing: '0.05em',
                                cursor: 'pointer',
                                textAlign: 'left'
                              }}
                            >
                              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>🎨 SACRED GLYPH STYLING</span>
                              <span>{isStylingOpen ? '▲' : '▼'}</span>
                            </button>

                            {/* Accordion Content */}
                            {isStylingOpen && (
                              <div style={{
                                padding: '16px',
                                borderTop: '1px solid rgba(212, 175, 55, 0.12)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '20px',
                                animation: 'fadeIn 0.2s ease-out'
                              }}>
                                {/* Colors Grid */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                  <div>
                                    <label className="kemet-label" htmlFor="fg-color">GLYPH COLOR (FOREGROUND)</label>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                      <input
                                        id="fg-color"
                                        type="color"
                                        value={foregroundColor}
                                        onChange={(e) => setForegroundColor(e.target.value)}
                                        style={{
                                          width: '40px',
                                          height: '40px',
                                          border: '1px solid rgba(212, 175, 55, 0.3)',
                                          borderRadius: '4px',
                                          background: 'transparent',
                                          cursor: 'pointer'
                                        }}
                                      />
                                      <input
                                        type="text"
                                        className="kemet-input"
                                        value={foregroundColor}
                                        onChange={(e) => setForegroundColor(e.target.value)}
                                        style={{ height: '40px', padding: '8px', fontSize: '14px', fontFamily: 'monospace' }}
                                      />
                                    </div>
                                  </div>

                                  <div>
                                    <label className="kemet-label" htmlFor="bg-color">PAPYRUS COLOR (BACKGROUND)</label>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                      <input
                                        id="bg-color"
                                        type="color"
                                        value={backgroundColor}
                                        onChange={(e) => setBackgroundColor(e.target.value)}
                                        style={{
                                          width: '40px',
                                          height: '40px',
                                          border: '1px solid rgba(212, 175, 55, 0.3)',
                                          borderRadius: '4px',
                                          background: 'transparent',
                                          cursor: 'pointer'
                                        }}
                                      />
                                      <input
                                        type="text"
                                        className="kemet-input"
                                        value={backgroundColor}
                                        onChange={(e) => setBackgroundColor(e.target.value)}
                                        style={{ height: '40px', padding: '8px', fontSize: '14px', fontFamily: 'monospace' }}
                                      />
                                    </div>
                                  </div>
                                </div>

                                {/* Size & Margin Grid */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'end' }}>
                                  <div>
                                    <label className="kemet-label" htmlFor="qr-size">SIZE: {size}px</label>
                                    <input
                                      id="qr-size"
                                      type="range"
                                      min="100"
                                      max="500"
                                      step="50"
                                      value={size}
                                      onChange={(e) => setSize(parseInt(e.target.value, 10))}
                                      style={{
                                        width: '100%',
                                        accentColor: 'var(--gold)',
                                        height: '6px',
                                        background: 'rgba(212, 175, 55, 0.1)',
                                        borderRadius: '3px',
                                        cursor: 'pointer'
                                      }}
                                    />
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--sand-dark)', marginTop: '4px' }}>
                                      <span>100px</span>
                                      <span>500px</span>
                                    </div>
                                  </div>

                                  <div>
                                    <CustomSelect
                                      label="MARGIN (QUILL BORDER)"
                                      placeholder="Select Margin"
                                      options={[
                                        { value: '0', label: '0 (No border)' },
                                        { value: '1', label: '1 (Thin)' },
                                        { value: '2', label: '2 (Standard)' },
                                        { value: '4', label: '4 (Wide)' },
                                        { value: '6', label: '6 (Extra Wide)' }
                                      ]}
                                      value={String(margin)}
                                      onChange={(val) => setMargin(parseInt(val, 10))}
                                    />
                                  </div>
                                </div>

                                {/* Live Preview Panel */}
                                <div style={{
                                  padding: '16px',
                                  background: 'rgba(13, 13, 11, 0.8)',
                                  borderRadius: '6px',
                                  border: '1px dashed rgba(212, 175, 55, 0.2)',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  gap: '12px'
                                }}>
                                  <span style={{ fontSize: '10px', color: 'var(--gold)', letterSpacing: '0.05em', fontFamily: 'var(--font-headings)' }}>
                                    SACRED GLYPH PREVIEW
                                  </span>
                                  <div style={{
                                    width: '150px',
                                    height: '150px',
                                    background: backgroundColor,
                                    borderRadius: '6px',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    border: '1px solid rgba(212, 175, 55, 0.1)',
                                    overflow: 'hidden',
                                    position: 'relative'
                                  }}>
                                    <img
                                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https%3A%2F%2Ftjesa.com&color=${foregroundColor.replace('#', '')}&bgcolor=${backgroundColor.replace('#', '')}&margin=${margin}`}
                                      alt="QR Code Preview"
                                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                      key={`${foregroundColor}-${backgroundColor}-${margin}`}
                                    />
                                  </div>
                                  <span style={{ fontSize: '10px', color: 'var(--sand-dark)', textAlign: 'center' }}>
                                    Previewing "https://tjesa.com" in custom colors & margin.
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Submit Actions */}
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                            <button
                              className="kemet-btn-secondary"
                              style={{ padding: '6px 16px', fontSize: '11px' }}
                              onClick={() => setEditingDbId(null)}
                              disabled={isSyncing}
                            >
                              Cancel
                            </button>
                            <button
                              className="kemet-btn"
                              style={{ padding: '6px 16px', fontSize: '11px', height: 'auto', minHeight: 'unset' }}
                              disabled={isSyncing || !sourceColumn || !targetColumn}
                              onClick={() => handleSync()}
                            >
                              {isSyncing ? 'Carving Settings...' : 'Save Settings'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p style={{ fontSize: '12px', color: '#FF7F7F' }}>Failed to read columns schema.</p>
                      )}
                    </div>
                  )}

                  {/* Webhook copy block (Only visible for Webhook trigger type and when not editing) */}
                  {config && config.settings?.trigger_type === 'webhook' && !isEditing && (
                    <div style={{ 
                      marginTop: '16px', 
                      padding: '12px', 
                      background: 'rgba(13, 13, 11, 0.7)', 
                      borderRadius: '6px', 
                      border: '1px solid rgba(212, 175, 55, 0.1)', 
                      fontSize: '12px',
                      animation: 'fadeIn 0.3s ease-out'
                    }}>
                      <span style={{ color: 'var(--gold)', fontSize: '11px', display: 'block', marginBottom: '6px', fontFamily: 'var(--font-headings)', letterSpacing: '0.05em' }}>
                        ANKH WEBHOOK INSTANT CARVER URL
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input 
                          readOnly 
                          value={`${typeof window !== 'undefined' ? window.location.origin : ''}/api/tools/qr/webhook?config_id=${config.id}`}
                          style={{
                            flex: 1,
                            background: '#070706',
                            border: 'none',
                            color: 'var(--sand-dim)',
                            padding: '6px',
                            borderRadius: '4px',
                            fontFamily: 'monospace',
                            fontSize: '10px'
                          }}
                          onClick={(e) => e.target.select()}
                        />
                        <button 
                          className="kemet-btn-secondary" 
                          style={{ padding: '4px 12px', fontSize: '10px', textTransform: 'uppercase' }}
                          onClick={(e) => {
                            const url = `${window.location.origin}/api/tools/qr/webhook?config_id=${config.id}`;
                            navigator.clipboard.writeText(url);
                            const btn = e.currentTarget;
                            btn.innerText = 'Copied!';
                            setTimeout(() => { btn.innerText = 'Copy'; }, 2000);
                          }}
                        >
                          Copy
                        </button>
                      </div>
                      <p style={{ fontSize: '9px', marginTop: '6px', color: 'var(--sand-dark)', lineHeight: 1.3 }}>
                        💡 In Notion, set a button to <strong>Send web request</strong> POST to this URL with JSON body: <code>{`{"page_id": "Page ID"}`}</code>
                      </p>
                    </div>
                  )}

                  {/* Sync Timestamp info */}
                  {config && config.last_sync && !isEditing && (
                    <div style={{ fontSize: '10px', marginTop: '12px', color: 'var(--sand-dark)', textAlign: 'right' }}>
                      Last carved: {new Date(config.last_sync).toLocaleString()} 
                      {config.last_sync_success_count !== undefined && (
                        <span> ({config.last_sync_success_count}/{config.last_sync_total_count} rows processed)</span>
                      )}
                    </div>
                  )}
                </GlowingCard>
              );
            })}
          </div>
        )}

        {/* Scribe Ledger console logs */}
        {(logs.length > 0 || isSyncing) && (
          <div style={{ maxWidth: '800px', margin: '32px auto 0 auto' }}>
            <GlowingCard title="Scribe Ledger" subtitle="Real-time execution logs of the carving process">
              <div style={{
                background: '#070706',
                fontFamily: 'monospace',
                fontSize: '12px',
                padding: '16px',
                borderRadius: '6px',
                border: '1px solid rgba(212, 175, 55, 0.1)',
                maxHeight: '160px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                color: '#C2A67D'
              }}>
                {logs.map((log, i) => (
                  <div key={i} style={{ 
                    color: log.includes('❌') ? '#FF7F7F' : log.includes('✨') ? 'var(--gold)' : '#C2A67D'
                  }}>
                    {log}
                  </div>
                ))}
                {isSyncing && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--gold)' }}>
                    <span>⚡ Communicating with Notion API...</span>
                  </div>
                )}
              </div>
            </GlowingCard>
          </div>
        )}

        {/* Custom Confirmation Modal */}
        {deleteConfirmOpen && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(7, 7, 6, 0.85)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
            animation: 'fadeIn 0.2s ease-out',
            padding: '20px'
          }}>
            <div style={{
              background: 'var(--obsidian-mid)',
              border: '1px solid var(--gold)',
              borderRadius: '12px',
              maxWidth: '450px',
              width: '100%',
              boxShadow: '0 0 30px rgba(212, 175, 55, 0.25), 0 20px 40px rgba(0, 0, 0, 0.8)',
              position: 'relative',
              overflow: 'hidden',
              animation: 'scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}>
              {/* Top gold bar */}
              <div style={{ height: '4px', background: 'var(--gold-gradient)' }} />
              
              {/* Modal Content */}
              <div style={{ padding: '28px 24px', textAlign: 'center' }}>
                {/* Warning Icon */}
                <div style={{ 
                  margin: '0 auto 16px auto',
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: 'rgba(168, 36, 36, 0.1)',
                  border: '1px solid rgba(168, 36, 36, 0.3)',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  color: '#FF7F7F'
                }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 9v4M12 17h.01" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>

                <h3 style={{ 
                  fontSize: '20px', 
                  color: 'var(--gold)', 
                  fontFamily: 'var(--font-headings)', 
                  marginBottom: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em'
                }}>
                  Sever Sacred Sync?
                </h3>
                
                <p style={{ 
                  fontSize: '14px', 
                  color: 'var(--sand-dim)', 
                  lineHeight: '1.5',
                  marginBottom: '24px'
                }}>
                  Are you sure you want to stop QR Code generation for the database <strong style={{ color: 'var(--sand-light)' }}>"{configToDelete?.database_name}"</strong>? This will permanently delete the configuration.
                </p>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                  <button
                    className="kemet-btn-secondary"
                    style={{ 
                      flex: 1, 
                      justifyContent: 'center', 
                      padding: '10px 20px', 
                      fontSize: '11px',
                      borderColor: 'rgba(212, 175, 55, 0.4)',
                      color: 'var(--sand-dim)',
                      height: 'auto',
                      minHeight: 'unset'
                    }}
                    onClick={() => {
                      setDeleteConfirmOpen(false);
                      setConfigToDelete(null);
                    }}
                  >
                    Keep Active
                  </button>
                  <button
                    className="kemet-btn"
                    style={{ 
                      flex: 1, 
                      justifyContent: 'center', 
                      padding: '10px 20px', 
                      fontSize: '11px',
                      background: 'linear-gradient(135deg, #A82424 0%, #7A1919 100%)',
                      boxShadow: '0 4px 15px rgba(168, 36, 36, 0.2)',
                      color: '#FFF',
                      height: 'auto',
                      minHeight: 'unset'
                    }}
                    onClick={async () => {
                      if (configToDelete) {
                        try {
                          const res = await fetch(`/api/configs?id=${configToDelete.id}`, { method: 'DELETE' });
                          if (res.ok) {
                            setConfigs(prev => prev.filter(c => c.id !== configToDelete.id));
                          }
                        } catch (err) {
                          console.error('Failed to delete config:', err);
                        } finally {
                          setDeleteConfirmOpen(false);
                          setConfigToDelete(null);
                        }
                      }
                    }}
                  >
                    Delete Sync
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
