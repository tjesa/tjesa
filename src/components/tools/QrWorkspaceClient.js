'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../Header';
import GlowingCard from '../GlowingCard';
import EyeOfHorusLoader from '../EyeOfHorusLoader';
import CustomSelect from '../CustomSelect';
import { useToast } from '@/hooks/useToast';
import { Link, Zap, Palette, Lightbulb, CheckCircle } from 'lucide-react';

export default function QrWorkspaceClient({ account, initialConfigs, oauthUrl }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [databases, setDatabases] = useState([]);
  const [configs, setConfigs] = useState(initialConfigs || []);
  const [editingDbId, setEditingDbId] = useState(null);
  const [dbDetails, setDbDetails] = useState(null);

  const [sourceColumn, setSourceColumn] = useState('');
  const [targetColumn, setTargetColumn] = useState('');
  const [triggerType, setTriggerType] = useState('full');
  const [triggerColumn, setTriggerColumn] = useState('');
  const [triggerValue, setTriggerValue] = useState('');
  const [errorColumn, setErrorColumn] = useState('');

  // QR styling settings
  const [foregroundColor, setForegroundColor] = useState('#D4AF37');
  const [backgroundColor, setBackgroundColor] = useState('#0D0D0B');
  const [margin, setMargin] = useState(2);
  const [errorCorrectionLevel, setErrorCorrectionLevel] = useState('M');
  const [isStylingOpen, setIsStylingOpen] = useState(false);

  // Custom confirmation modal states
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [configToDelete, setConfigToDelete] = useState(null);

  const [isFetchingDbs, setIsFetchingDbs] = useState(true);
  const [isFetchingSchema, setIsFetchingSchema] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const [lastSyncLog, setLastSyncLog] = useState(null);
  const [error, setError] = useState('');

  const closeEditor = () => {
    setEditingDbId(null);
    setDbDetails(null);
    setSourceColumn('');
    setTargetColumn('');
    setTriggerType('full');
    setTriggerColumn('');
    setTriggerValue('');
    setErrorColumn('');
    setForegroundColor('#D4AF37');
    setBackgroundColor('#0D0D0B');
    setMargin(2);
    setErrorCorrectionLevel('M');
    setIsStylingOpen(false);
  };

  useEffect(() => {
    async function loadDatabases() {
      try {
        const response = await fetch('/api/databases?tool=qr');
        if (!response.ok) throw new Error('Failed to fetch databases');
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

  useEffect(() => {
    if (!editingDbId) return;

    async function loadDbSchema() {
      setIsFetchingSchema(true);
      setError('');
      try {
        const response = await fetch(`/api/databases?database_id=${editingDbId}&tool=qr`);
        if (!response.ok) throw new Error('Failed to fetch database schema');
        const data = await response.json();
        setDbDetails(data);

        const existingConfig = configs.find(c => c.database_id === editingDbId);
        if (existingConfig) {
          const s = existingConfig.settings || {};
          setSourceColumn(s.source_column || '');
          setTargetColumn(s.target_column || '');
          setTriggerType(s.trigger_type || 'full');
          setTriggerColumn(s.trigger_column || '');
          setTriggerValue(s.trigger_value || '');
          setErrorColumn(s.error_column || '');
          setForegroundColor(s.foreground_color || '#D4AF37');
          setBackgroundColor(s.background_color || '#0D0D0B');
          setMargin(s.margin !== undefined ? s.margin : 2);
          setErrorCorrectionLevel(s.error_correction_level || 'M');
        } else {
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
          setErrorColumn('');
          setForegroundColor('#D4AF37');
          setBackgroundColor('#0D0D0B');
          setMargin(2);
          setErrorCorrectionLevel('M');
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

  const handleSync = async (configPayload = null) => {
    setIsSyncing(true);
    setError('');

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
    const errCol = configPayload ? (settings.error_column || '') : errorColumn;
    const fgColor = configPayload ? (settings.foreground_color || '#141311') : foregroundColor;
    const bgColor = configPayload ? (settings.background_color || '#F6F0E0') : backgroundColor;
    const qrMargin = configPayload ? (settings.margin !== undefined ? settings.margin : 2) : margin;
    const ecl = configPayload ? (settings.error_correction_level || 'M') : errorCorrectionLevel;

    const syncLogs = [
      `Initiating sync for database: "${dbName}"...`,
      `Extracting source URLs from "${srcCol}"...`
    ];

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
          errorColumn: errCol,
          foregroundColor: fgColor,
          backgroundColor: bgColor,
          margin: qrMargin,
          errorCorrectionLevel: ecl
        }),
      });

      const data = await response.json();

      if (response.ok) {
        syncLogs.push(
          `Query successful. Carved ${data.stats.synced} glyphs.`,
          `Skipped ${data.stats.skipped} unchanged rows.`,
          data.stats.failed > 0
            ? `[ERROR] Encountered ${data.stats.failed} errors during sync.`
            : `[SUCCESS] Sacred task completed successfully!`
        );

        setLastSyncLog({ dbId, stats: data.stats, logs: syncLogs });
        setConfigs(prev => {
          const index = prev.findIndex(c => c.database_id === data.config.database_id);
          if (index >= 0) {
            const updated = [...prev];
            updated[index] = data.config;
            return updated;
          }
          return [data.config, ...prev];
        });

        showToast(`Carved ${data.stats.synced} QR glyph${data.stats.synced !== 1 ? 's' : ''} successfully`, 'success');
        closeEditor();
      } else {
        setError(data.error || 'Failed to synchronize.');
        showToast(data.error || 'Sync failed. Check your configuration.', 'error');
      }
    } catch (err) {
      setError('A cosmic alignment error occurred while carving. Try again.');
      showToast('Connection disrupted. Please try again.', 'error');
      console.error(err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      const response = await fetch('/api/auth/disconnect?tool=qr', { method: 'POST' });
      if (response.ok) {
        showToast('Notion connection severed', 'info');
        router.push('/');
      } else {
        showToast('Failed to disconnect. Try again.', 'error');
      }
    } catch (err) {
      showToast('Network error during disconnect.', 'error');
      console.error(err);
    }
  };

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    setError('');

    const existing = configs.find(c => c.database_id === editingDbId);

    try {
      const response = await fetch('/api/configs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          configId: existing?.id || null,
          databaseId: editingDbId,
          databaseName: dbDetails?.title,
          sourceColumn,
          targetColumn,
          triggerType,
          triggerColumn,
          triggerValue,
          errorColumn,
          foregroundColor,
          backgroundColor,
          margin,
          errorCorrectionLevel
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setConfigs(prev => {
          const index = prev.findIndex(c => c.database_id === data.config.database_id);
          if (index >= 0) {
            const updated = [...prev];
            updated[index] = data.config;
            return updated;
          }
          return [data.config, ...prev];
        });
        showToast('Settings saved. Glyphs will be carved on the next sync cycle.', 'success');
        closeEditor();
      } else {
        setError(data.error || 'Failed to save settings.');
        showToast(data.error || 'Failed to save settings.', 'error');
      }
    } catch (err) {
      setError('Failed to save settings.');
      showToast('Failed to save settings.', 'error');
      console.error(err);
    } finally {
      setIsSavingSettings(false);
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
              <a href={oauthUrl} className="kemet-btn" style={{ padding: '8px 18px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <Link size={14} /> Connect Notion Database / Add Pages
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
              <a href={oauthUrl} className="kemet-btn" style={{ padding: '8px 20px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <Link size={14} /> Connect Notion Database
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
                        <>
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
                          {config.settings?.last_sync_error_count > 0 && (
                            <span style={{
                              fontSize: '10px',
                              padding: '4px 10px',
                              background: 'rgba(168, 36, 36, 0.15)',
                              border: '1px solid rgba(168, 36, 36, 0.4)',
                              borderRadius: '20px',
                              color: '#FF7F7F',
                              fontFamily: 'var(--font-headings)',
                              letterSpacing: '0.05em',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              ⚠️ {config.settings.last_sync_error_count} SYNC ERRORS
                            </span>
                          )}
                        </>
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
                            {config.settings?.trigger_type === 'checkbox'
                              ? `Checkbox (${config.settings.trigger_column})`
                              : config.settings?.trigger_type === 'select'
                                ? `Status (${config.settings.trigger_column} = ${config.settings.trigger_value})`
                                : config.settings?.trigger_type === 'webhook'
                                  ? 'Button / Webhook'
                                  : 'Always'}
                          </strong>
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
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
                            onClick={() => isEditing ? closeEditor() : setEditingDbId(db.id)}
                          >
                            {isEditing ? 'Close' : 'Configure'}
                          </button>
                          {/* Copy Webhook URL inline button */}
                          <button
                            className="kemet-btn-secondary"
                            style={{ padding: '6px 14px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                            disabled={isSyncing}
                            onClick={(e) => {
                              const url = `${window.location.origin}/api/tools/qr/webhook?config_id=${config.id}`;
                              navigator.clipboard.writeText(url);
                              const btn = e.currentTarget;
                              btn.innerText = 'Copied!';
                              setTimeout(() => { btn.innerHTML = 'Webhook'; }, 2000);
                            }}
                          >
                            Webhook
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
                          onClick={() => isEditing ? closeEditor() : setEditingDbId(db.id)}
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

                          {/* Column selectors */}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '20px' }}>
                            <div>
                              <CustomSelect
                                label="SOURCE COLUMN (URL / Text / Formula)"
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
                                lineHeight: '1.4',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '10px'
                              }}>
                                <div>
                                  <span style={{ color: 'var(--gold)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', fontFamily: 'var(--font-headings)' }}>
                                    <Zap size={14} fill="currentColor" /> BUTTON WEBHOOK MODE ACTIVE
                                  </span>
                                  This mode stops background polling. QR codes will only be generated when a <strong>Notion Button</strong> sends a POST request to this configuration's unique webhook URL.
                                </div>

                                {config ? (
                                  <div style={{
                                    padding: '10px',
                                    background: 'rgba(var(--obsidian-rgb), 0.8)',
                                    borderRadius: '4px',
                                    border: '1px solid rgba(212, 175, 55, 0.1)'
                                  }}>
                                    <span style={{ color: 'var(--gold)', fontSize: '10px', display: 'block', marginBottom: '4px', fontFamily: 'var(--font-headings)' }}>
                                      WEBHOOK URL
                                    </span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <input
                                        readOnly
                                        value={`${typeof window !== 'undefined' ? window.location.origin : ''}/api/tools/qr/webhook?config_id=${config.id}`}
                                        style={{
                                          flex: 1,
                                          background: 'var(--obsidian)',
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
                                        type="button"
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
                                  </div>
                                ) : (
                                  <div style={{ fontSize: '10px', color: 'var(--sand-dark)', fontStyle: 'italic' }}>
                                    Save settings first to generate your unique Webhook URL.
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Error Column (optional) */}
                          <div>
                            <CustomSelect
                              label="ERROR COLUMN (Optional — Rich Text)"
                              placeholder="-- None (skip error write-back) --"
                              options={[
                                { value: '', label: 'None' },
                                ...(dbDetails.fileColumns?.filter(col => col.type === 'rich_text').map(col => ({
                                  value: col.name,
                                  label: `${col.name} (rich_text)`
                                })) || [])
                              ]}
                              value={errorColumn}
                              onChange={setErrorColumn}
                            />
                            <p style={{ fontSize: '10px', color: 'var(--sand-dark)', marginTop: '4px', lineHeight: 1.4 }}>
                              When set, sync errors are written to this column in Notion. Cleared automatically on success.
                            </p>
                          </div>

                          {/* Sacred Glyph Styling Accordion */}
                          <div style={{
                            border: '1px solid rgba(212, 175, 55, 0.15)',
                            borderRadius: '8px',
                            background: 'rgba(var(--obsidian-mid-rgb), 0.4)',
                            overflow: 'hidden',
                            marginTop: '10px'
                          }}>
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
                              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Palette size={16} /> SACRED GLYPH STYLING</span>
                              <span>{isStylingOpen ? '▲' : '▼'}</span>
                            </button>

                            {isStylingOpen && (
                              <div style={{
                                padding: '16px',
                                borderTop: '1px solid rgba(212, 175, 75, 0.12)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '20px',
                                animation: 'fadeIn 0.2s ease-out'
                              }}>
                                {/* Colors Grid */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '16px' }}>
                                  <div>
                                    <label className="kemet-label" htmlFor="fg-color">GLYPH COLOR (FOREGROUND)</label>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                      <input
                                        id="fg-color"
                                        type="color"
                                        value={foregroundColor}
                                        onChange={(e) => setForegroundColor(e.target.value)}
                                        style={{ width: '40px', height: '40px', border: '1px solid rgba(212, 175, 55, 0.3)', borderRadius: '4px', background: 'transparent', cursor: 'pointer' }}
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
                                        style={{ width: '40px', height: '40px', border: '1px solid rgba(212, 175, 55, 0.3)', borderRadius: '4px', background: 'transparent', cursor: 'pointer' }}
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

                                {/* Margin & Error Correction Level */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '16px', alignItems: 'end' }}>
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

                                  <div>
                                    <CustomSelect
                                      label="ERROR CORRECTION LEVEL"
                                      placeholder="Select Level"
                                      options={[
                                        { value: 'L', label: 'L — Low (7%)' },
                                        { value: 'M', label: 'M — Medium (15%) — Standard' },
                                        { value: 'Q', label: 'Q — Quartile (25%)' },
                                        { value: 'H', label: 'H — High (30%) — Best for logos' }
                                      ]}
                                      value={errorCorrectionLevel}
                                      onChange={setErrorCorrectionLevel}
                                    />
                                  </div>
                                </div>

                                {/* Live Preview */}
                                <div style={{
                                  padding: '16px',
                                  background: 'rgba(var(--obsidian-rgb), 0.8)',
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
                                    width: '180px',
                                    height: '180px',
                                    background: backgroundColor,
                                    borderRadius: '12px',
                                    border: `2px solid ${foregroundColor}33`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: `0 10px 30px rgba(0,0,0,0.5), 0 0 20px ${foregroundColor}1a`,
                                    overflow: 'hidden',
                                    position: 'relative'
                                  }}>
                                    <img
                                      src={`/api/tools/qr/image?data=${encodeURIComponent('https://tjesa.com')}&fg=${foregroundColor.replace('#', '')}&bg=${backgroundColor.replace('#', '')}&margin=${margin}&ecl=${errorCorrectionLevel}&size=180`}
                                      alt="QR Code Preview"
                                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                      key={`${foregroundColor}-${backgroundColor}-${margin}-${errorCorrectionLevel}`}
                                    />
                                  </div>
                                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
                                    <span style={{ fontSize: '10px', color: 'var(--sand-dark)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                      Previewing "https://tjesa.com" · ECL: {errorCorrectionLevel} ·
                                    </span>
                                    <a
                                      href={`/api/tools/qr/image?data=${encodeURIComponent('https://tjesa.com')}&fg=${foregroundColor.replace('#', '')}&bg=${backgroundColor.replace('#', '')}&margin=${margin}&ecl=${errorCorrectionLevel}&size=400`}
                                      download="tjesa-glyph.png"
                                      style={{ fontSize: '10px', color: foregroundColor, fontFamily: 'var(--font-headings)', letterSpacing: '0.04em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
                                      target="_blank"
                                      rel="noreferrer"
                                    >
                                      Download Glyph
                                    </a>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Submit Actions */}
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px', flexWrap: 'wrap' }}>
                            <button
                              className="kemet-btn-secondary"
                              style={{ padding: '6px 16px', fontSize: '11px' }}
                              onClick={() => closeEditor()}
                              disabled={isSyncing || isSavingSettings}
                            >
                              Cancel
                            </button>
                            <button
                              className="kemet-btn-secondary"
                              style={{ padding: '6px 16px', fontSize: '11px', borderColor: 'rgba(212,175,55,0.5)', color: 'var(--gold)' }}
                              disabled={isSyncing || isSavingSettings || !sourceColumn || !targetColumn}
                              onClick={() => handleSaveSettings()}
                            >
                              {isSavingSettings ? 'Saving...' : 'Save Settings'}
                            </button>
                            <button
                              className="kemet-btn"
                              style={{ padding: '6px 16px', fontSize: '11px', height: 'auto', minHeight: 'unset' }}
                              disabled={isSyncing || isSavingSettings || !sourceColumn || !targetColumn}
                              onClick={() => handleSync()}
                            >
                              {isSyncing ? 'Carving Glyphs...' : 'Save & Sync Now'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p style={{ fontSize: '12px', color: '#FF7F7F' }}>Failed to read columns schema.</p>
                      )}
                    </div>
                  )}

                  {/* Webhook tip (only shown for webhook-mode configs when not editing) */}
                  {config && !isEditing && config.settings?.trigger_type === 'webhook' && (
                    <p style={{ fontSize: '10px', marginTop: '12px', color: 'var(--sand-dark)', lineHeight: 1.35, display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                      <Lightbulb size={12} style={{ flexShrink: 0, marginTop: '1px', color: 'var(--gold)' }} />
                      <span>Click <strong>Webhook</strong> above to copy the URL. In Notion, create a Button or Automation that sends a <strong>POST</strong> to that URL to trigger instant QR generation.</span>
                    </p>
                  )}

                  {/* Last sync result log panel */}
                  {lastSyncLog?.dbId === db.id && !isEditing && (
                    <div style={{
                      marginTop: '16px',
                      padding: '12px 14px',
                      background: 'rgba(var(--obsidian-rgb), 0.8)',
                      border: '1px solid rgba(52, 211, 153, 0.2)',
                      borderRadius: '6px',
                      animation: 'fadeIn 0.3s ease-out'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <span style={{ fontSize: '10px', color: '#34D399', fontFamily: 'var(--font-headings)', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <CheckCircle size={12} /> LAST SYNC RESULT
                        </span>
                        <button
                          onClick={() => setLastSyncLog(null)}
                          style={{ background: 'none', border: 'none', color: 'var(--sand-dark)', cursor: 'pointer', fontSize: '14px', lineHeight: 1, padding: '0 2px' }}
                        >
                          ×
                        </button>
                      </div>
                      <div style={{ display: 'flex', gap: '16px', marginBottom: '10px', flexWrap: 'wrap' }}>
                        {[
                          { label: 'Total', value: lastSyncLog.stats.total },
                          { label: 'Carved', value: lastSyncLog.stats.synced, color: '#34D399' },
                          { label: 'Skipped', value: lastSyncLog.stats.skipped },
                          ...(lastSyncLog.stats.failed > 0 ? [{ label: 'Failed', value: lastSyncLog.stats.failed, color: '#FF7F7F' }] : [])
                        ].map(({ label, value, color }) => (
                          <div key={label} style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '18px', fontWeight: 'bold', color: color || 'var(--gold)', fontFamily: 'var(--font-headings)' }}>{value}</div>
                            <div style={{ fontSize: '9px', color: 'var(--sand-dark)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{label}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        {lastSyncLog.logs.map((line, i) => (
                          <div key={i} style={{
                            fontSize: '10px',
                            fontFamily: 'monospace',
                            color: line.startsWith('[ERROR]') ? '#FF7F7F' : line.startsWith('[SUCCESS]') ? '#34D399' : 'var(--sand-dim)',
                            padding: '1px 0'
                          }}>
                            {line}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sync Timestamp */}
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

        {/* Delete Confirmation Modal */}
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
              <div style={{ height: '4px', background: 'var(--gold-gradient)' }} />
              <div style={{ padding: '28px 24px', textAlign: 'center' }}>
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

                <p style={{ fontSize: '14px', color: 'var(--sand-dim)', lineHeight: '1.5', marginBottom: '24px' }}>
                  Are you sure you want to stop QR Code generation for the database <strong style={{ color: 'var(--sand-light)' }}>"{configToDelete?.database_name}"</strong>? This will permanently delete the configuration.
                </p>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                  <button
                    className="kemet-btn-secondary"
                    style={{ flex: 1, justifyContent: 'center', padding: '10px 20px', fontSize: '11px', borderColor: 'rgba(212, 175, 55, 0.4)', color: 'var(--sand-dim)', height: 'auto', minHeight: 'unset' }}
                    onClick={() => {
                      setDeleteConfirmOpen(false);
                      setConfigToDelete(null);
                    }}
                  >
                    Keep Active
                  </button>
                  <button
                    className="kemet-btn"
                    style={{ flex: 1, justifyContent: 'center', padding: '10px 20px', fontSize: '11px', background: 'linear-gradient(135deg, #A82424 0%, #7A1919 100%)', boxShadow: '0 4px 15px rgba(168, 36, 36, 0.2)', color: '#FFF', height: 'auto', minHeight: 'unset' }}
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
