'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../Header';
import GlowingCard from '../GlowingCard';
import EyeOfHorusLoader from '../EyeOfHorusLoader';
import CustomSelect from '../CustomSelect';

export default function FormWorkspaceClient({ account, initialConfigs, oauthUrl }) {
  const router = useRouter();
  const [databases, setDatabases] = useState([]);
  const [configs, setConfigs] = useState(initialConfigs || []);
  
  const [editingDbId, setEditingDbId] = useState(null); // Database ID currently being configured
  const [dbDetails, setDbDetails] = useState(null);
  
  // Form Config States
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formFields, setFormFields] = useState([]); // List of mappable fields from Notion schema
  
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
        const response = await fetch('/api/databases?tool=forms');
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
      setFormTitle('');
      setFormDescription('');
      setFormFields([]);
      return;
    }

    async function loadDbSchema() {
      setIsFetchingSchema(true);
      setError('');
      setSuccessMsg('');
      try {
        const response = await fetch(`/api/tools/forms/schema?database_id=${editingDbId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch database schema');
        }
        const data = await response.json();
        setDbDetails(data);
        
        // Find if we already have an existing form configuration for this database
        const existingConfig = configs.find(c => c.database_id === editingDbId);
        
        if (existingConfig) {
          const settings = existingConfig.settings || {};
          setFormTitle(settings.form_title || data.title);
          setFormDescription(settings.form_description || '');
          
          // Map schema fields to form fields and apply saved overrides
          const savedFields = settings.fields || [];
          const combinedFields = data.fields.map(schemaField => {
            const saved = savedFields.find(f => f.column_name === schemaField.name);
            return {
              column_name: schemaField.name,
              column_type: schemaField.type,
              options: schemaField.options || [],
              enabled: saved ? !!saved.enabled : false,
              field_label: saved ? saved.field_label : schemaField.name,
              field_placeholder: saved ? saved.field_placeholder : '',
              required: saved ? !!saved.required : false
            };
          });
          setFormFields(combinedFields);
        } else {
          // Initialize default form fields (disabled by default, with defaults set)
          setFormTitle(data.title);
          setFormDescription('Please fill out this form.');
          const initialFields = data.fields.map(schemaField => ({
            column_name: schemaField.name,
            column_type: schemaField.type,
            options: schemaField.options || [],
            enabled: schemaField.type === 'title', // Enable Title/Name field by default
            field_label: schemaField.name,
            field_placeholder: `Enter ${schemaField.name.toLowerCase()}...`,
            required: schemaField.type === 'title' // Title is usually required in Notion
          }));
          setFormFields(initialFields);
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

  // 3. Toggle field properties
  const handleFieldToggle = (index, key, val) => {
    setFormFields(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [key]: val };
      return updated;
    });
  };

  // 4. Save form settings
  const handleSaveConfig = async () => {
    setIsSaving(true);
    setError('');
    setSuccessMsg('');

    const existing = configs.find(c => c.database_id === editingDbId);
    const configId = existing ? existing.id : null;
    const dbName = dbDetails?.title || 'Form Database';

    // Only submit fields that are enabled
    const enabledFields = formFields.filter(f => f.enabled).map(f => ({
      column_name: f.column_name,
      column_type: f.column_type,
      field_label: f.field_label || f.column_name,
      field_placeholder: f.field_placeholder || '',
      required: !!f.required
    }));

    if (enabledFields.length === 0) {
      setError('You must enable at least one form field.');
      setIsSaving(false);
      return;
    }

    try {
      const response = await fetch('/api/tools/forms/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          configId,
          databaseId: editingDbId,
          databaseName: dbName,
          formTitle,
          formDescription,
          fields: enabledFields,
          active: true
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMsg('✨ Form configuration saved successfully!');
        
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

        // Close config panel after 1 second
        setTimeout(() => {
          setEditingDbId(null);
        }, 1200);
      } else {
        setError(data.error || 'Failed to save form configuration.');
      }
    } catch (err) {
      setError('Connection error. Failed to save form settings.');
      console.error(err);
    } finally {
      setIsSaving(false);
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

  const getPublicUrl = (id) => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/forms/${id}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', zIndex: 1 }}>
      <Header account={account} onDisconnect={handleDisconnect} />
      
      <div className="container" style={{ padding: '40px 24px', flex: 1, maxWidth: '1100px' }}>
        
        {/* Page Header */}
        <div style={{ marginBottom: '32px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: 'var(--gold)', letterSpacing: '0.15em', fontFamily: 'var(--font-headings)' }}>
            THE NILE SCRIBE WORKSTATION
          </span>
          <h2 style={{ fontSize: '32px', marginTop: '4px', textTransform: 'uppercase' }}>
            Notion Web Form Builders
          </h2>
          <p style={{ maxWidth: '600px', fontSize: '14px', marginTop: '8px', color: 'var(--sand-dim)' }}>
            Design public web forms for your shared databases. Map inputs to Notion columns, collect responses, and embed them on any external website.
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

        {/* Database selection and config grid */}
        {isFetchingDbs ? (
          <div style={{ padding: '48px 0', textAlign: 'center' }}>
            <EyeOfHorusLoader size={60} text="Retrieving database archives..." />
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
              No databases found. Make sure you have shared databases with the Tjesa connection in Notion!
            </p>
            {oauthUrl && (
              <a href={oauthUrl} className="kemet-btn" style={{ padding: '8px 20px', fontSize: '12px' }}>
                🔗 Connect Notion Database
              </a>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '900px', margin: '0 auto' }}>
            
            {/* Show list of databases if not editing */}
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
                            FORM ACTIVE
                          </span>
                          <span style={{ fontSize: '12px', color: 'var(--sand-dim)' }}>
                            Title: <strong style={{ color: 'var(--gold)' }}>{config.settings?.form_title}</strong>
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
                          NO FORM GENERATED
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      {config ? (
                        <>
                          <button
                            className="kemet-btn"
                            onClick={() => window.open(getPublicUrl(config.id), '_blank')}
                            style={{ padding: '6px 14px', fontSize: '11px', height: 'auto', minHeight: 'unset' }}
                          >
                            Open Form
                          </button>
                          <button
                            className="kemet-btn-secondary"
                            style={{ padding: '6px 14px', fontSize: '11px' }}
                            onClick={() => setEditingDbId(db.id)}
                          >
                            Edit Fields
                          </button>
                          <button
                            className="kemet-btn-secondary"
                            style={{ padding: '6px 14px', fontSize: '11px', borderColor: 'var(--scarab-red)', color: '#FF7F7F' }}
                            onClick={() => {
                              setConfigToDelete(config);
                              setDeleteConfirmOpen(true);
                            }}
                          >
                            Delete Form
                          </button>
                        </>
                      ) : (
                        <button
                          className="kemet-btn"
                          style={{ padding: '6px 16px', fontSize: '11px', height: 'auto', minHeight: 'unset' }}
                          onClick={() => setEditingDbId(db.id)}
                        >
                          Build Web Form
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Active Form URL and Embed code display */}
                  {config && (
                    <div style={{ 
                      marginTop: '16px', 
                      padding: '16px', 
                      background: 'rgba(13, 13, 11, 0.7)', 
                      borderRadius: '6px', 
                      border: '1px solid rgba(212, 175, 55, 0.1)', 
                      fontSize: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}>
                      <div>
                        <span style={{ color: 'var(--gold)', fontSize: '10px', display: 'block', marginBottom: '4px', fontFamily: 'var(--font-headings)' }}>
                          📜 PUBLIC FORM URL
                        </span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input 
                            readOnly 
                            value={getPublicUrl(config.id)}
                            style={{
                              flex: 1,
                              background: '#070706',
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
                          🌐 IFRAME EMBED CODE
                        </span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input 
                            readOnly 
                            value={`<iframe src="${getPublicUrl(config.id)}" style="width:100%; min-height:600px; border:none; border-radius:12px; background:transparent;"></iframe>`}
                            style={{
                              flex: 1,
                              background: '#070706',
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
                              navigator.clipboard.writeText(`<iframe src="${getPublicUrl(config.id)}" style="width:100%; min-height:600px; border:none; border-radius:12px; background:transparent;"></iframe>`);
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
                  )}
                </GlowingCard>
              );
            })}

            {/* Configurator/Split Editor Mode */}
            {editingDbId && (
              <div style={{ 
                animation: 'fadeIn 0.3s ease-out',
                display: 'flex',
                flexDirection: 'column',
                gap: '24px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3>Form Builder: {dbDetails?.title || 'Loading Database...'}</h3>
                  <button 
                    className="kemet-btn-secondary" 
                    style={{ padding: '6px 16px', fontSize: '11px' }}
                    onClick={() => setEditingDbId(null)}
                  >
                    ◄ Back to List
                  </button>
                </div>

                {isFetchingSchema ? (
                  <div style={{ padding: '48px 0', textAlign: 'center' }}>
                    <EyeOfHorusLoader size={45} text="Consulting Notion scroll schema..." />
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', alignItems: 'start' }}>
                    
                    {/* Left Panel: Form Settings */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                      <GlowingCard title="Form Configuration" subtitle="Define form header metadata & fields">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                          <div>
                            <label className="kemet-label" htmlFor="form-title">FORM DISPLAY TITLE</label>
                            <input 
                              id="form-title"
                              className="kemet-input"
                              type="text"
                              value={formTitle}
                              onChange={(e) => setFormTitle(e.target.value)}
                              placeholder="e.g. Job Application Form"
                            />
                          </div>

                          <div>
                            <label className="kemet-label" htmlFor="form-desc">FORM DESCRIPTION</label>
                            <textarea 
                              id="form-desc"
                              className="kemet-input"
                              rows="3"
                              value={formDescription}
                              onChange={(e) => setFormDescription(e.target.value)}
                              placeholder="Describe what this form is for..."
                              style={{ resize: 'none' }}
                            />
                          </div>
                        </div>
                      </GlowingCard>

                      <GlowingCard title="Database Columns Mapping" subtitle="Choose columns and customize form fields">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '420px', overflowY: 'auto', paddingRight: '8px' }}>
                          {formFields.map((field, i) => (
                            <div 
                              key={field.column_name} 
                              style={{ 
                                padding: '16px', 
                                background: field.enabled ? 'rgba(212,175,55,0.02)' : 'rgba(255,255,255,0.01)', 
                                border: field.enabled ? '1px solid rgba(212,175,55,0.25)' : '1px solid rgba(255,255,255,0.04)', 
                                borderRadius: '8px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              {/* Field Header Row */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>
                                  <input 
                                    type="checkbox" 
                                    checked={field.enabled} 
                                    onChange={(e) => handleFieldToggle(i, 'enabled', e.target.checked)}
                                    style={{ accentColor: 'var(--gold)', cursor: 'pointer' }}
                                  />
                                  {field.column_name}
                                </label>
                                <span style={{ fontSize: '10px', color: 'var(--sand-dark)', textTransform: 'uppercase' }}>
                                  {field.column_type}
                                </span>
                              </div>

                              {/* Field Details Configuration (only visible if field is enabled) */}
                              {field.enabled && (
                                <div style={{ 
                                  display: 'flex', 
                                  flexDirection: 'column', 
                                  gap: '12px',
                                  paddingTop: '8px', 
                                  borderTop: '1px solid rgba(212, 175, 55, 0.08)',
                                  animation: 'fadeIn 0.2s ease-out'
                                }}>
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div>
                                      <label className="kemet-label" style={{ fontSize: '11px' }}>DISPLAY LABEL</label>
                                      <input 
                                        className="kemet-input"
                                        type="text"
                                        style={{ padding: '8px 12px', fontSize: '13px' }}
                                        value={field.field_label}
                                        onChange={(e) => handleFieldToggle(i, 'field_label', e.target.value)}
                                      />
                                    </div>
                                    <div>
                                      <label className="kemet-label" style={{ fontSize: '11px' }}>PLACEHOLDER TEXT</label>
                                      <input 
                                        className="kemet-input"
                                        type="text"
                                        style={{ padding: '8px 12px', fontSize: '13px' }}
                                        value={field.field_placeholder}
                                        onChange={(e) => handleFieldToggle(i, 'field_placeholder', e.target.value)}
                                      />
                                    </div>
                                  </div>

                                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', cursor: 'pointer', color: 'var(--sand-dim)' }}>
                                    <input 
                                      type="checkbox" 
                                      checked={field.required}
                                      onChange={(e) => handleFieldToggle(i, 'required', e.target.checked)}
                                      style={{ accentColor: 'var(--gold)', cursor: 'pointer' }}
                                    />
                                    Mark as Mandatory / Required Field
                                  </label>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </GlowingCard>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <button 
                          className="kemet-btn-secondary" 
                          style={{ padding: '8px 24px' }}
                          disabled={isSaving}
                          onClick={() => setEditingDbId(null)}
                        >
                          Cancel
                        </button>
                        <button 
                          className="kemet-btn" 
                          style={{ padding: '8px 24px', height: 'auto', minHeight: 'unset' }}
                          disabled={isSaving}
                          onClick={handleSaveConfig}
                        >
                          {isSaving ? 'Writing Scroll...' : 'Activate Web Form'}
                        </button>
                      </div>
                    </div>

                    {/* Right Panel: Live Form Preview */}
                    <div style={{ position: 'sticky', top: '24px' }}>
                      <GlowingCard title="Live Layout Preview" subtitle="See what your visitors will see">
                        <div style={{
                          background: 'rgba(7,7,6,0.95)',
                          border: '1px solid rgba(212,175,55,0.15)',
                          borderRadius: '8px',
                          padding: '24px 20px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '20px',
                          maxHeight: '520px',
                          overflowY: 'auto'
                        }}>
                          {/* Form Title & Desc Preview */}
                          <div style={{ textAlign: 'center', borderBottom: '1px solid rgba(212,175,55,0.1)', paddingBottom: '16px' }}>
                            <h3 style={{ fontSize: '20px', color: 'var(--gold)', textTransform: 'uppercase' }}>
                              {formTitle || 'Form Title'}
                            </h3>
                            {formDescription && (
                              <p style={{ fontSize: '12px', marginTop: '6px', color: 'var(--sand-dim)' }}>
                                {formDescription}
                              </p>
                            )}
                          </div>

                          {/* Fields Preview */}
                          {formFields.filter(f => f.enabled).length === 0 ? (
                            <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--sand-dark)', padding: '24px 0' }}>
                              No fields enabled. Toggle database columns on the left panel to build the form layout.
                            </p>
                          ) : (
                            <form style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} onSubmit={e => e.preventDefault()}>
                              {formFields.filter(f => f.enabled).map(field => (
                                <div key={field.column_name}>
                                  <label className="kemet-label" style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    {field.field_label || field.column_name}
                                    {field.required && <span style={{ color: 'var(--scarab-red)' }}>*</span>}
                                  </label>
                                  
                                  {/* Render mock inputs by column type */}
                                  {field.column_type === 'rich_text' ? (
                                    <textarea 
                                      className="kemet-input" 
                                      rows="2" 
                                      disabled
                                      placeholder={field.field_placeholder}
                                      style={{ padding: '8px 12px', fontSize: '13px', resize: 'none' }}
                                    />
                                  ) : field.column_type === 'checkbox' ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0' }}>
                                      <input type="checkbox" disabled style={{ accentColor: 'var(--gold)' }} />
                                      <span style={{ fontSize: '12px', color: 'var(--sand-dim)' }}>Toggled state</span>
                                    </div>
                                  ) : field.column_type === 'select' ? (
                                    <select className="kemet-select" disabled style={{ padding: '8px 12px', fontSize: '13px' }}>
                                      <option>{field.field_placeholder || '-- Choose Option --'}</option>
                                      {field.options?.map(opt => (
                                        <option key={opt}>{opt}</option>
                                      ))}
                                    </select>
                                  ) : field.column_type === 'multi_select' ? (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '4px 0' }}>
                                      {field.options?.slice(0, 3).map(opt => (
                                        <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', background: 'rgba(212,175,55,0.05)', padding: '4px 8px', borderRadius: '4px', border: '1px solid rgba(212,175,55,0.1)' }}>
                                          <input type="checkbox" disabled style={{ accentColor: 'var(--gold)' }} />
                                          {opt}
                                        </label>
                                      ))}
                                      {field.options?.length > 3 && <span style={{ fontSize: '10px', color: 'var(--sand-dark)', alignSelf: 'center' }}>+{field.options.length - 3} more</span>}
                                    </div>
                                  ) : field.column_type === 'date' ? (
                                    <input 
                                      type="date" 
                                      className="kemet-input" 
                                      disabled 
                                      style={{ padding: '8px 12px', fontSize: '13px' }} 
                                    />
                                  ) : (
                                    <input 
                                      type={field.column_type === 'number' ? 'number' : field.column_type === 'email' ? 'email' : field.column_type === 'url' ? 'url' : 'text'} 
                                      className="kemet-input" 
                                      disabled
                                      placeholder={field.field_placeholder}
                                      style={{ padding: '8px 12px', fontSize: '13px' }}
                                    />
                                  )}
                                </div>
                              ))}

                              <button 
                                className="kemet-btn" 
                                style={{ width: '100%', justifyContent: 'center', marginTop: '8px', padding: '10px 0', fontSize: '13px' }}
                                disabled
                              >
                                Submit Record
                              </button>
                            </form>
                          )}
                        </div>
                      </GlowingCard>
                    </div>

                  </div>
                )}
              </div>
            )}

          </div>
        )}

      </div>

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
                Retract Form Scroll?
              </h3>
              
              <p style={{ 
                fontSize: '14px', 
                color: 'var(--sand-dim)', 
                lineHeight: '1.5',
                marginBottom: '24px'
              }}>
                Are you sure you want to stop collecting forms responses for database <strong style={{ color: 'var(--sand-light)' }}>"{configToDelete?.database_name}"</strong>? The public form page will cease to exist.
              </p>

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
                  Keep Form
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
                  Delete Form
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
