'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../Header';
import GlowingCard from '../GlowingCard';
import EyeOfHorusLoader from '../EyeOfHorusLoader';
import CustomSelect from '../CustomSelect';
import EgyptChart from './EgyptChart';
import { useToast } from '@/hooks/useToast';
import { Link, AlertTriangle } from 'lucide-react';

export default function ChartsWorkspaceClient({ account, initialConfigs, oauthUrl }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [databases, setDatabases] = useState([]);
  const [configs, setConfigs] = useState(initialConfigs || []);
  
  const [editingDbId, setEditingDbId] = useState(null); // Database ID currently being configured
  const [dbDetails, setDbDetails] = useState(null);
  
  // Chart Config States
  const [chartTitle, setChartTitle] = useState('');
  const [chartType, setChartType] = useState('bar');
  const [groupByColumn, setGroupByColumn] = useState('');
  const [aggregateOp, setAggregateOp] = useState('count');
  const [aggregateColumn, setAggregateColumn] = useState('');
  const [colorPalette, setColorPalette] = useState('egyptian_gold');

  // Preview States
  const [previewData, setPreviewData] = useState(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState('');

  // UI General States
  const [isFetchingDbs, setIsFetchingDbs] = useState(true);
  const [isFetchingSchema, setIsFetchingSchema] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Custom confirmation modal states
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [configToDelete, setConfigToDelete] = useState(null);

  const closeEditor = () => {
    setEditingDbId(null);
    setDbDetails(null);
    setChartTitle('');
    setChartType('bar');
    setGroupByColumn('');
    setAggregateOp('count');
    setAggregateColumn('');
    setColorPalette('egyptian_gold');
    setPreviewData(null);
    setPreviewError('');
  };

  // 1. Fetch user's shared Notion databases on mount
  useEffect(() => {
    async function loadDatabases() {
      try {
        const response = await fetch('/api/databases?tool=charts');
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
    if (!editingDbId) return;

    async function loadDbSchema() {
      setIsFetchingSchema(true);
      setError('');
      setSuccessMsg('');
      setPreviewData(null);
      setPreviewError('');
      try {
        // Use the general database route to fetch properties
        const response = await fetch(`/api/databases?database_id=${editingDbId}&tool=charts`);
        if (!response.ok) {
          throw new Error('Failed to fetch database schema');
        }
        const data = await response.json();
        setDbDetails(data);
        
        // Find if we already have an existing chart configuration for this database
        const existingConfig = configs.find(c => c.database_id === editingDbId);
        
        if (existingConfig) {
          const settings = existingConfig.settings || {};
          setChartTitle(settings.chart_title || data.title);
          setChartType(settings.chart_type || 'bar');
          setGroupByColumn(settings.group_by_column || '');
          setAggregateOp(settings.aggregate_op || 'count');
          setAggregateColumn(settings.aggregate_column || '');
          setColorPalette(settings.color_palette || 'egyptian_gold');
        } else {
          // Defaults
          setChartTitle(data.title);
          setChartType('bar');
          setColorPalette('egyptian_gold');
          setAggregateOp('count');

          // Auto-select a group by column (UX Polish: look for status or select columns)
          const firstSelectCol = data.selectColumns?.[0] || data.urlColumns?.[0];
          setGroupByColumn(firstSelectCol ? firstSelectCol.name : '');
          
          // Auto-select a numeric aggregate column
          const numberCols = data.numberColumns || [];
          setAggregateColumn(numberCols[0] ? numberCols[0].name : '');
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

  // 3. Load live preview from Notion data
  const loadLivePreview = async () => {
    if (!editingDbId || !groupByColumn) return;

    setIsPreviewLoading(true);
    setPreviewError('');
    setPreviewData(null);

    try {
      const url = `/api/tools/charts/data?database_id=${editingDbId}&group_by_column=${encodeURIComponent(groupByColumn)}&aggregate_op=${aggregateOp}&aggregate_column=${encodeURIComponent(aggregateColumn)}`;
      const response = await fetch(url);
      const data = await response.json();

      if (response.ok && data.success) {
        setPreviewData(data.chartData);
      } else {
        setPreviewError(data.error || 'Failed to fetch preview data from Notion.');
      }
    } catch (err) {
      setPreviewError('Connection disrupted while loading chart preview.');
      console.error(err);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  // Trigger preview when columns/aggregation change in the editor
  useEffect(() => {
    if (editingDbId && groupByColumn && (!['sum', 'avg'].includes(aggregateOp) || aggregateColumn)) {
      // Small delay to prevent double queries during initial select load
      const timer = setTimeout(() => {
        loadLivePreview();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [editingDbId, groupByColumn, aggregateOp, aggregateColumn]);

  // 4. Save chart settings
  const handleSaveConfig = async () => {
    setIsSaving(true);
    setError('');
    setSuccessMsg('');

    const existing = configs.find(c => c.database_id === editingDbId);
    const configId = existing ? existing.id : null;
    const dbName = dbDetails?.title || 'Chart Database';

    if (!groupByColumn) {
      setError('You must select a column to group your data by.');
      setIsSaving(false);
      return;
    }

    if (['sum', 'avg'].includes(aggregateOp) && !aggregateColumn) {
      setError('You must select a numeric column to aggregate.');
      setIsSaving(false);
      return;
    }

    try {
      const response = await fetch('/api/tools/charts/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          configId,
          databaseId: editingDbId,
          databaseName: dbName,
          chartTitle,
          chartType,
          groupByColumn,
          aggregateOp,
          aggregateColumn,
          colorPalette,
          active: true
        })
      });

      const data = await response.json();

      if (response.ok) {
        showToast('Chart configuration saved successfully', 'success');
        
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

        // Close config panel
        closeEditor();
      } else {
        setError(data.error || 'Failed to save chart configuration.');
        showToast(data.error || 'Failed to save chart configuration.', 'error');
      }
    } catch (err) {
      setError('Connection error. Failed to save chart settings.');
      showToast('Connection error. Failed to save chart settings.', 'error');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  // 5. Delete configuration
  const handleDeleteConfig = async () => {
    if (!configToDelete) return;
    
    setError('');
    
    try {
      const res = await fetch(`/api/configs?id=${configToDelete.id}`, { method: 'DELETE' });
      if (res.ok) {
        setConfigs(prev => prev.filter(c => c.id !== configToDelete.id));
        showToast('Observatory configuration dissolved', 'success');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to delete configuration.');
        showToast(data.error || 'Failed to delete configuration.', 'error');
      }
    } catch (err) {
      setError('Connection disrupted. Failed to sever configuration.');
      showToast('Connection disrupted. Failed to sever configuration.', 'error');
      console.error(err);
    } finally {
      setDeleteConfirmOpen(false);
      setConfigToDelete(null);
    }
  };

  const handleDisconnect = async () => {
    try {
      const response = await fetch('/api/auth/disconnect?tool=charts', { method: 'POST' });
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

  const handleCopyLink = (url) => {
    navigator.clipboard.writeText(url).then(() => {
      showToast('Chart link copied to clipboard', 'success', 2500);
    }).catch(() => {
      showToast('Failed to copy link', 'error');
    });
  };

  const getPublicUrl = (id) => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/charts/${id}`;
  };

  // Get options for column selects
  const getGroupByOptions = () => {
    if (!dbDetails) return [];
    
    // Combine all schemas for grouping options
    const allCols = [
      ...(dbDetails.urlColumns || []),
      ...(dbDetails.checkboxColumns || []),
      ...(dbDetails.selectColumns || []),
      ...(dbDetails.numberColumns || []),
      ...(dbDetails.dateColumns || [])
    ];

    // Remove duplicates
    const seen = new Set();
    const uniqueCols = [];
    allCols.forEach(c => {
      if (!seen.has(c.name)) {
        seen.add(c.name);
        uniqueCols.push({
          value: c.name,
          label: `${c.name} (${c.type.toUpperCase()})`
        });
      }
    });

    return uniqueCols;
  };

  const getAggregateColumnOptions = () => {
    if (!dbDetails || !dbDetails.numberColumns) return [];
    
    return dbDetails.numberColumns.map(c => ({
      value: c.name,
      label: `${c.name} (NUMBER)`
    }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', zIndex: 1 }}>
      <Header account={account} onDisconnect={handleDisconnect} />
      
      <div className="container" style={{ padding: '40px 24px', flex: 1, maxWidth: '1100px' }}>
        
        {/* Page Header */}
        <div style={{ marginBottom: '32px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: 'var(--gold)', letterSpacing: '0.15em', fontFamily: 'var(--font-headings)' }}>
            THE ATEN GAZER OBSERVATORY
          </span>
          <h2 style={{ fontSize: '32px', marginTop: '4px', textTransform: 'uppercase' }}>
            Database Charts & Observatories
          </h2>
          <p style={{ maxWidth: '600px', fontSize: '14px', marginTop: '8px', color: 'var(--sand-dim)' }}>
            Transform your Notion database columns into dynamic, visual charts. Configure aggregations, group statuses, and inspect metrics inside a themed observatory.
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
            maxWidth: '900px',
            marginLeft: 'auto',
            marginRight: 'auto'
          }}>
            {error}
          </div>
        )}

        {successMsg && (
          <div style={{
            padding: '16px',
            background: 'rgba(43, 122, 75, 0.1)',
            border: '1px solid var(--scarab-green)',
            borderRadius: '8px',
            color: '#7FFF7F',
            fontSize: '14px',
            marginBottom: '24px',
            maxWidth: '900px',
            marginLeft: 'auto',
            marginRight: 'auto'
          }}>
            {successMsg}
          </div>
        )}

        {/* Database Selection & Layout Grid */}
        {isFetchingDbs ? (
          <div style={{ padding: '48px 0', textAlign: 'center' }}>
            <EyeOfHorusLoader size={60} text="Summoning Database Scrolls..." />
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
            <p style={{ fontSize: '14px', color: 'var(--sand-dim)', marginBottom: '16px' }}>
              No databases found. Share databases with the Tjesa integration inside your Notion workspace!
            </p>
            {oauthUrl && (
              <a href={oauthUrl} className="kemet-btn" style={{ padding: '8px 20px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <Link size={14} /> Connect Notion Database
              </a>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '950px', margin: '0 auto' }}>
            
            {/* 1. Databases List Grid (When not configuring a database) */}
            {!editingDbId && databases.map(db => {
              const config = configs.find(c => c.database_id === db.id);
              
              return (
                <GlowingCard 
                  key={db.id} 
                  title={db.title} 
                  subtitle={`Notion Database ID: ${db.id}`}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                      {config ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
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
                            OBSERVATORY ACTIVE
                          </span>
                          <span style={{ fontSize: '12px', color: 'var(--sand-dim)' }}>
                            Chart: <strong style={{ color: 'var(--gold)' }}>{config.settings?.chart_title} ({config.settings?.chart_type?.toUpperCase()})</strong>
                          </span>
                        </div>
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
                          NO VISUALIZATIONS
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      {config ? (
                        <>
                          <button
                            className="kemet-btn"
                            style={{ padding: '6px 14px', fontSize: '11px', height: 'auto', minHeight: 'unset' }}
                            onClick={() => setEditingDbId(db.id)}
                          >
                            Open Observatory
                          </button>
                          <button
                            className="kemet-btn-secondary"
                            style={{ padding: '6px 14px', fontSize: '11px', borderColor: 'var(--scarab-red)', color: '#FF7F7F' }}
                            onClick={() => {
                              setConfigToDelete(config);
                              setDeleteConfirmOpen(true);
                            }}
                          >
                            Delete Chart
                          </button>
                        </>
                      ) : (
                        <button
                          className="kemet-btn"
                          style={{ padding: '6px 16px', fontSize: '11px', height: 'auto', minHeight: 'unset' }}
                          onClick={() => setEditingDbId(db.id)}
                        >
                          Setup Charts Observatory
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Active Chart Display Inline */}
                  {config && !editingDbId && (
                    <div style={{ marginTop: '20px', borderTop: '1px solid rgba(212,175,55,0.08)', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <ActiveChartLoader configId={config.id} settings={config.settings} />
                      
                      {/* Embed and copy panel */}
                      <div style={{ 
                        padding: '16px', 
                        background: 'rgba(var(--obsidian-rgb), 0.7)', 
                        borderRadius: '6px', 
                        border: '1px solid rgba(212, 175, 55, 0.1)', 
                        fontSize: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                      }}>
                        <div>
                          <span style={{ color: 'var(--gold)', fontSize: '10px', display: 'block', marginBottom: '4px', fontFamily: 'var(--font-headings)' }}>
                            PUBLIC CHART URL
                          </span>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <input 
                              readOnly 
                              value={getPublicUrl(config.id)}
                              style={{
                                flex: 1,
                                background: 'var(--obsidian)',
                                border: 'none',
                                color: 'var(--sand-dim)',
                                padding: '6px 8px',
                                borderRadius: '4px',
                                fontFamily: 'monospace',
                                fontSize: '10px'
                              }}
                              onClick={(e) => e.target.select()}
                            />
                            <button 
                              className="kemet-btn-secondary" 
                              style={{ padding: '4px 12px', fontSize: '10px' }}
                              onClick={(e) => {
                                navigator.clipboard.writeText(getPublicUrl(config.id));
                                const btn = e.currentTarget;
                                btn.innerText = 'Copied!';
                                setTimeout(() => { btn.innerText = 'Copy'; }, 2000);
                              }}
                            >
                              Copy
                            </button>
                          </div>
                        </div>

                        <div>
                          <span style={{ color: 'var(--gold)', fontSize: '10px', display: 'block', marginBottom: '4px', fontFamily: 'var(--font-headings)' }}>
                            IFRAME EMBED CODE
                          </span>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <input 
                              readOnly 
                              value={`<iframe src="${getPublicUrl(config.id)}" style="width:100%; min-height:380px; border:none; border-radius:12px; background:transparent;"></iframe>`}
                              style={{
                                flex: 1,
                                background: 'var(--obsidian)',
                                border: 'none',
                                color: 'var(--sand-dim)',
                                padding: '6px 8px',
                                borderRadius: '4px',
                                fontFamily: 'monospace',
                                fontSize: '10px'
                              }}
                              onClick={(e) => e.target.select()}
                            />
                            <button 
                              className="kemet-btn-secondary" 
                              style={{ padding: '4px 12px', fontSize: '10px' }}
                              onClick={(e) => {
                                navigator.clipboard.writeText(`<iframe src="${getPublicUrl(config.id)}" style="width:100%; min-height:380px; border:none; border-radius:12px; background:transparent;"></iframe>`);
                                const btn = e.currentTarget;
                                btn.innerText = 'Copied!';
                                setTimeout(() => { btn.innerText = 'Copy'; }, 2000);
                              }}
                            >
                              Copy
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </GlowingCard>
              );
            })}

            {/* 2. Interactive Charts Editor Panel */}
            {editingDbId && (
              <div style={{ 
                animation: 'fadeIn 0.3s ease-out',
                display: 'flex',
                flexDirection: 'column',
                gap: '24px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ textTransform: 'uppercase', fontSize: '18px', color: 'var(--gold)', letterSpacing: '0.05em' }}>
                    Aten Editor: {dbDetails?.title || 'Loading Schema...'}
                  </h3>
                  <button 
                    className="kemet-btn-secondary" 
                    style={{ padding: '6px 16px', fontSize: '11px' }}
                    onClick={closeEditor}
                  >
                    ◄ Back to List
                  </button>
                </div>

                {isFetchingSchema ? (
                  <div style={{ padding: '48px 0', textAlign: 'center' }}>
                    <EyeOfHorusLoader size={45} text="Consulting Notion database properties..." />
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))', gap: '32px', alignItems: 'start' }}>
                    
                    {/* Left Panel: Configuration Form */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                      <GlowingCard title="Chart Configuration" subtitle="Choose grouping, data operation & theme">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                          <div>
                            <label className="kemet-label" htmlFor="chart-title">CHART TITLE</label>
                            <input 
                              id="chart-title"
                              className="kemet-input"
                              type="text"
                              value={chartTitle}
                              onChange={(e) => setChartTitle(e.target.value)}
                              placeholder="e.g. Sales Metrics, Tasks by Status"
                            />
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '16px' }}>
                            <div>
                              <CustomSelect
                                label="CHART TYPE"
                                placeholder="-- Select Chart --"
                                options={[
                                  { value: 'bar', label: 'Bar Chart' },
                                  { value: 'pie', label: 'Donut / Pie' },
                                  { value: 'line', label: 'Line Chart' }
                                ]}
                                value={chartType}
                                onChange={setChartType}
                              />
                            </div>
                            <div>
                              <CustomSelect
                                label="COLOR PALETTE"
                                placeholder="-- Choose Palette --"
                                options={[
                                  { value: 'egyptian_gold', label: 'Egyptian Gold' },
                                  { value: 'desert_rose', label: 'Desert Rose' },
                                  { value: 'nile_blue', label: 'Nile Blue' }
                                ]}
                                value={colorPalette}
                                onChange={setColorPalette}
                              />
                            </div>
                          </div>

                          <div>
                            <CustomSelect
                              label="GROUP BY COLUMN"
                              placeholder="-- Select Grouping Column --"
                              options={getGroupByOptions()}
                              value={groupByColumn}
                              onChange={setGroupByColumn}
                            />
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '16px' }}>
                            <div>
                              <CustomSelect
                                label="AGGREGATION OPERATOR"
                                placeholder="-- Select Operator --"
                                options={[
                                  { value: 'count', label: 'Count Rows' },
                                  { value: 'sum', label: 'Sum (Number Column)' },
                                  { value: 'avg', label: 'Average (Number Column)' }
                                ]}
                                value={aggregateOp}
                                onChange={(val) => {
                                  setAggregateOp(val);
                                  if (val === 'count') {
                                    setAggregateColumn('');
                                  }
                                }}
                              />
                            </div>
                            {['sum', 'avg'].includes(aggregateOp) && (
                              <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
                                <CustomSelect
                                  label="AGGREGATE VALUE COLUMN"
                                  placeholder="-- Select Number Column --"
                                  options={getAggregateColumnOptions()}
                                  value={aggregateColumn}
                                  onChange={setAggregateColumn}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </GlowingCard>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <button 
                          className="kemet-btn-secondary" 
                          style={{ padding: '8px 24px' }}
                          disabled={isSaving}
                          onClick={closeEditor}
                        >
                          Cancel
                        </button>
                        <button 
                          className="kemet-btn" 
                          style={{ padding: '8px 24px', height: 'auto', minHeight: 'unset' }}
                          disabled={isSaving || !groupByColumn || (['sum', 'avg'].includes(aggregateOp) && !aggregateColumn)}
                          onClick={handleSaveConfig}
                        >
                          {isSaving ? 'Aligning Aten...' : 'Activate Chart'}
                        </button>
                      </div>
                    </div>

                    {/* Right Panel: Live Interactive Preview */}
                    <div style={{ position: 'sticky', top: '24px' }}>
                      <GlowingCard title="Observatory Live Preview" subtitle="See aggregated data results in real time">
                        {isPreviewLoading ? (
                          <div style={{ height: '280px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                            <EyeOfHorusLoader size={40} text="Aggregating Notion data..." />
                          </div>
                        ) : previewError ? (
                          <div style={{
                            height: '280px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '20px',
                            border: '1px dashed var(--scarab-red)',
                            borderRadius: '8px',
                            background: 'rgba(168, 36, 36, 0.04)',
                            textAlign: 'center',
                            gap: '12px'
                          }}>
                            <span style={{ color: '#FF7F7F' }}><AlertTriangle size={36} /></span>
                            <p style={{ fontSize: '13px', color: '#FF7F7F', margin: 0 }}>{previewError}</p>
                            <button className="kemet-btn-secondary" style={{ padding: '4px 12px', fontSize: '11px' }} onClick={loadLivePreview}>
                              Retry Query
                            </button>
                          </div>
                        ) : previewData ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <EgyptChart 
                              title={chartTitle || dbDetails?.title}
                              type={chartType}
                              data={previewData}
                              palette={colorPalette}
                            />
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--sand-dark)' }}>
                              <span>📊 Scanned {previewData.values.reduce((a,b)=>a+b, 0)} records in this view</span>
                              <button 
                                className="kemet-btn-secondary" 
                                style={{ padding: '2px 8px', fontSize: '9px', borderColor: 'rgba(212,175,55,0.1)' }}
                                onClick={loadLivePreview}
                              >
                                Refresh Data
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div style={{
                            height: '280px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--sand-dark)',
                            fontSize: '13px',
                            border: '1px dashed rgba(212,175,55,0.15)',
                            borderRadius: '8px',
                            background: 'rgba(7,7,6,0.5)',
                            textAlign: 'center',
                            padding: '20px'
                          }}>
                            Configure the Group By column on the left to initialize the Aten Observatory.
                          </div>
                        )}
                      </GlowingCard>
                    </div>

                  </div>
                )}
              </div>
            )}

          </div>
        )}

      </div>

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

              <h4 style={{ color: 'var(--gold)', fontSize: '18px', textTransform: 'uppercase', fontFamily: 'var(--font-headings)', margin: '0 0 8px 0', letterSpacing: '0.05em' }}>
                Sever Observatory Config?
              </h4>
              
              <p style={{ fontSize: '13px', color: 'var(--sand-dim)', lineHeight: 1.5, margin: '0 0 24px 0' }}>
                Are you sure you want to delete the chart configuration for <strong>{configToDelete?.database_name}</strong>? This cannot be undone.
              </p>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button 
                  className="kemet-btn-secondary" 
                  style={{ padding: '8px 20px', minWidth: '100px' }}
                  onClick={() => {
                    setDeleteConfirmOpen(false);
                    setConfigToDelete(null);
                  }}
                >
                  Keep It
                </button>
                <button 
                  className="kemet-btn" 
                  style={{ padding: '8px 20px', minWidth: '100px', background: 'rgba(168, 36, 36, 0.9)', color: '#FFF', border: '1px solid var(--scarab-red)', height: 'auto', minHeight: 'unset' }}
                  onClick={handleDeleteConfig}
                >
                  Delete Chart
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helper component to render active chart configurations inline in list view
// ---------------------------------------------------------------------------
function ActiveChartLoader({ configId, settings }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchChartData() {
      try {
        const response = await fetch(`/api/tools/charts/data?config_id=${configId}`);
        const result = await response.json();
        if (response.ok && result.success) {
          setData(result.chartData);
        } else {
          setError(result.error || 'Failed to fetch data');
        }
      } catch (err) {
        setError('Network error');
      } finally {
        setLoading(false);
      }
    }
    fetchChartData();
  }, [configId]);

  if (loading) {
    return (
      <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <EyeOfHorusLoader size={35} text="Consulting coordinates..." />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FF7F7F', fontSize: '12px', gap: '6px' }}>
        <AlertTriangle size={14} /> Failed to display chart: {error}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '650px', margin: '0 auto' }}>
      <EgyptChart 
        title={settings.chart_title}
        type={settings.chart_type}
        data={data}
        palette={settings.color_palette}
      />
    </div>
  );
}
