'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../Header';
import GlowingCard from '../GlowingCard';
import EyeOfHorusLoader from '../EyeOfHorusLoader';
import CustomSelect from '../CustomSelect';

export default function MailWorkspaceClient({ account, initialConfigs, oauthUrl }) {
  const router = useRouter();
  const [databases, setDatabases] = useState([]);
  const [configs, setConfigs] = useState(initialConfigs || []);
  
  const [editingDbId, setEditingDbId] = useState(null); // Database ID currently being configured
  const [dbDetails, setDbDetails] = useState(null);
  
  // SMTP Config States
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  const [smtpFromEmail, setSmtpFromEmail] = useState('');
  const [smtpFromName, setSmtpFromName] = useState('');
  const [useSandbox, setUseSandbox] = useState(true);

  // Column Mappings Config States
  const [columnEmail, setColumnEmail] = useState('');
  const [columnName, setColumnName] = useState('');
  const [columnStatus, setColumnStatus] = useState('');
  const [statusSentValue, setStatusSentValue] = useState('Sent');

  // Template Config States
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');

  // Contacts States (fetched database contacts for the active config)
  const [contacts, setContacts] = useState([]);
  const [selectedContactIds, setSelectedContactIds] = useState([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [contactsError, setContactsError] = useState('');
  const [activeConfigIdForContacts, setActiveConfigIdForContacts] = useState(null);

  // Dispatch Action States
  const [isSending, setIsSending] = useState(false);
  const [sendStatusMsg, setSendStatusMsg] = useState('');
  
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
        const response = await fetch('/api/databases?tool=mail');
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
      setSmtpHost('');
      setSmtpPort('587');
      setSmtpUser('');
      setSmtpPass('');
      setSmtpFromEmail('');
      setSmtpFromName('');
      setUseSandbox(true);
      setColumnEmail('');
      setColumnName('');
      setColumnStatus('');
      setStatusSentValue('Sent');
      setEmailSubject('');
      setEmailBody('');
      return;
    }

    async function loadDbSchema() {
      setIsFetchingSchema(true);
      setError('');
      setSuccessMsg('');
      try {
        const response = await fetch(`/api/databases?database_id=${editingDbId}&tool=mail`);
        if (!response.ok) {
          throw new Error('Failed to fetch database schema');
        }
        const data = await response.json();
        setDbDetails(data);
        
        // Find if we already have an existing configuration for this database
        const existingConfig = configs.find(c => c.database_id === editingDbId);
        
        if (existingConfig) {
          const settings = existingConfig.settings || {};
          setSmtpHost(settings.smtp_host || '');
          setSmtpPort(settings.smtp_port || '587');
          setSmtpUser(settings.smtp_user || '');
          setSmtpPass(settings.smtp_pass || '');
          setSmtpFromEmail(settings.smtp_from_email || '');
          setSmtpFromName(settings.smtp_from_name || '');
          setUseSandbox(settings.use_sandbox !== undefined ? settings.use_sandbox : true);
          setColumnEmail(settings.column_email || '');
          setColumnName(settings.column_name || '');
          setColumnStatus(settings.column_status || '');
          setStatusSentValue(settings.status_sent_value || 'Sent');
          setEmailSubject(settings.email_subject || '');
          setEmailBody(settings.email_body || '');
        } else {
          // Try to guess default columns based on database schema lists
          const firstEmailCol = data.urlColumns?.find(c => c.type === 'email' || c.name.toLowerCase().includes('email'))?.name || '';
          const firstTitleCol = data.urlColumns?.find(c => c.type === 'title')?.name || '';
          const firstStatusCol = data.checkboxColumns?.[0]?.name || data.selectColumns?.[0]?.name || '';
          
          setColumnEmail(firstEmailCol);
          setColumnName(firstTitleCol);
          setColumnStatus(firstStatusCol);
          
          // SMTP defaults
          setUseSandbox(true);
          setSmtpPort('587');
          setStatusSentValue('Sent');
          setEmailSubject(`Update for {{${firstTitleCol || 'Name'}}}`);
          setEmailBody(`Dear {{${firstTitleCol || 'Name'}}},\n\nThis is a personalized newsletter dispatched from Notion.`);
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

  // Fetch contacts list for the active config
  const loadConfigContacts = async (configId) => {
    setIsLoadingContacts(true);
    setContactsError('');
    setContacts([]);
    setSelectedContactIds([]);
    setActiveConfigIdForContacts(configId);
    try {
      const response = await fetch(`/api/tools/mail/posts?config_id=${configId}`);
      const data = await response.json();
      if (response.ok && data.success) {
        setContacts(data.contacts || []);
      } else {
        setContactsError(data.error || 'Failed to load database contacts.');
      }
    } catch (err) {
      setContactsError('Connection error while fetching database contact records.');
      console.error(err);
    } finally {
      setIsLoadingContacts(false);
    }
  };

  const handleSaveConfig = async () => {
    setIsSaving(true);
    setError('');
    setSuccessMsg('');

    const existing = configs.find(c => c.database_id === editingDbId);
    const configId = existing ? existing.id : null;
    const dbName = dbDetails?.title || 'Contacts Database';

    if (!columnEmail) {
      setError('You must select the Recipient Email Column mapping.');
      setIsSaving(false);
      return;
    }

    if (!emailSubject || !emailBody) {
      setError('You must specify both the Email Subject and Email Body templates.');
      setIsSaving(false);
      return;
    }

    if (!useSandbox && (!smtpHost || !smtpPort || !smtpUser || !smtpPass)) {
      setError('SMTP Host, Port, Username, and Password are required when Sandbox Mode is disabled.');
      setIsSaving(false);
      return;
    }

    try {
      const response = await fetch('/api/tools/mail/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          configId,
          databaseId: editingDbId,
          databaseName: dbName,
          smtpHost,
          smtpPort,
          smtpUser,
          smtpPass,
          smtpFromEmail,
          smtpFromName,
          useSandbox,
          columnEmail,
          columnName,
          columnStatus,
          statusSentValue,
          emailSubject,
          emailBody,
          active: true
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMsg('Mail configuration saved successfully.');
        
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

        // Trigger load of contacts for the saved configuration
        loadConfigContacts(data.config.id);

        // Close editor panel after a slight delay
        setTimeout(() => {
          setEditingDbId(null);
        }, 1200);
      } else {
        setError(data.error || 'Failed to save configuration settings.');
      }
    } catch (err) {
      setError('Connection error. Failed to save Mail dispatcher settings.');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendEmails = async (pageIds) => {
    if (pageIds.length === 0) return;
    setIsSending(true);
    setSendStatusMsg(`Dispatching ${pageIds.length} campaign message(s)...`);
    setError('');
    setSuccessMsg('');

    try {
      const response = await fetch('/api/tools/mail/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          configId: activeConfigIdForContacts,
          pageIds
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccessMsg(`Campaign successfully dispatched: ${data.stats.dispatched} sent, ${data.stats.failed} failed.`);
        
        // Reload contacts list to reflect new sent flags in Notion
        loadConfigContacts(activeConfigIdForContacts);
      } else {
        setError(data.error || 'Failed to execute email dispatch.');
      }
    } catch (err) {
      setError('A connection disruption occurred during bulk mailing.');
      console.error(err);
    } finally {
      setIsSending(false);
      setSendStatusMsg('');
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
        setSuccessMsg('Nile Dispatch configuration dissolved successfully.');
        if (activeConfigIdForContacts === configToDelete.id) {
          setContacts([]);
          setSelectedContactIds([]);
          setActiveConfigIdForContacts(null);
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
      const response = await fetch('/api/auth/disconnect?tool=mail', { method: 'POST' });
      if (response.ok) {
        router.push('/');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleSelectAll = () => {
    if (selectedContactIds.length === contacts.length) {
      setSelectedContactIds([]);
    } else {
      setSelectedContactIds(contacts.map(c => c.id));
    }
  };

  const handleToggleSelectContact = (id) => {
    setSelectedContactIds(prev => 
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
              THE NILE DISPATCH
            </span>
            <h1 style={{ fontSize: '32px', marginTop: '4px', textTransform: 'uppercase', fontFamily: 'var(--font-headings)', margin: 0 }}>
              Mail Chambers
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--sand-dim)', marginTop: '4px', margin: 0 }}>
              Compile template emails and dispatch campaigns to lists inside Notion database scrolls.
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
            <GlowingCard title={dbDetails ? `Configure Dispatch: ${dbDetails.title}` : 'Opening Dispatch Chambers...'} subtitle="CAMPAIGN CONFIGURATOR">
              {isFetchingSchema ? (
                <div style={{ padding: '60px 0' }}>
                  <EyeOfHorusLoader size={50} text="Retrieving contacts schema..." />
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', marginTop: '12px' }}>
                  
                  {/* Delivery Engine */}
                  <div style={{ borderBottom: '1px solid rgba(212, 175, 55, 0.1)', paddingBottom: '24px' }}>
                    <h3 style={{ fontSize: '15px', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '16px', fontFamily: 'var(--font-headings)' }}>
                      1. SMTP Delivery Settings
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
                        Activate Mock Sandbox Mode (No SMTP credentials required)
                      </label>
                    </div>

                    {!useSandbox && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '16px' }}>
                          <div>
                            <label className="kemet-label">SMTP Host</label>
                            <input 
                              type="text" 
                              className="kemet-input"
                              value={smtpHost}
                              onChange={(e) => setSmtpHost(e.target.value)}
                              placeholder="smtp.example.com"
                            />
                          </div>
                          <div>
                            <label className="kemet-label">Port</label>
                            <input 
                              type="text" 
                              className="kemet-input"
                              value={smtpPort}
                              onChange={(e) => setSmtpPort(e.target.value)}
                              placeholder="587"
                            />
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '16px' }}>
                          <div>
                            <label className="kemet-label">SMTP Username</label>
                            <input 
                              type="text" 
                              className="kemet-input"
                              value={smtpUser}
                              onChange={(e) => setSmtpUser(e.target.value)}
                              placeholder="user@example.com"
                            />
                          </div>
                          <div>
                            <label className="kemet-label">SMTP Password</label>
                            <input 
                              type="password" 
                              className="kemet-input"
                              value={smtpPass}
                              onChange={(e) => setSmtpPass(e.target.value)}
                              placeholder="••••••••"
                            />
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '16px' }}>
                          <div>
                            <label className="kemet-label">From Address</label>
                            <input 
                              type="email" 
                              className="kemet-input"
                              value={smtpFromEmail}
                              onChange={(e) => setSmtpFromEmail(e.target.value)}
                              placeholder="sender@domain.com"
                            />
                          </div>
                          <div>
                            <label className="kemet-label">From Name</label>
                            <input 
                              type="text" 
                              className="kemet-input"
                              value={smtpFromName}
                              onChange={(e) => setSmtpFromName(e.target.value)}
                              placeholder="The Nile Dispatcher"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Notion Mappings */}
                  <div style={{ borderBottom: '1px solid rgba(212, 175, 55, 0.1)', paddingBottom: '24px' }}>
                    <h3 style={{ fontSize: '15px', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '16px', fontFamily: 'var(--font-headings)' }}>
                      2. Notion Database Column Mapping
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '16px', marginBottom: '16px' }}>
                      <div>
                        <CustomSelect
                          label="Recipient Email Column *"
                          value={columnEmail}
                          onChange={setColumnEmail}
                          options={(dbDetails?.urlColumns || []).map(c => ({ value: c.name, label: `${c.name} (${c.type})` }))}
                          placeholder="Select Column"
                        />
                      </div>
                      <div>
                        <CustomSelect
                          label="Recipient Name Column"
                          value={columnName}
                          onChange={setColumnName}
                          options={(dbDetails?.urlColumns || []).map(c => ({ value: c.name, label: `${c.name} (${c.type})` }))}
                          placeholder="Select Column"
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '16px' }}>
                      <div>
                        <CustomSelect
                          label="Status / Sent Checker Column"
                          value={columnStatus}
                          onChange={setColumnStatus}
                          options={[
                            { value: '', label: 'None (Do not sync sent flag)' },
                            ...(dbDetails?.checkboxColumns || []).map(c => ({ value: c.name, label: `${c.name} (checkbox)` })),
                            ...(dbDetails?.selectColumns || []).map(c => ({ value: c.name, label: `${c.name} (${c.type})` }))
                          ]}
                          placeholder="Select Column"
                        />
                      </div>
                      {columnStatus && (
                        <div>
                          <label className="kemet-label">Status "Sent" Value</label>
                          <input 
                            type="text" 
                            className="kemet-input"
                            value={statusSentValue}
                            onChange={(e) => setStatusSentValue(e.target.value)}
                            placeholder="e.g. Sent (or checked by default)"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Template Draft */}
                  <div>
                    <h3 style={{ fontSize: '15px', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '16px', fontFamily: 'var(--font-headings)' }}>
                      3. Personalized Email Template
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div>
                        <label className="kemet-label">Email Subject Template *</label>
                        <input 
                          type="text" 
                          className="kemet-input"
                          value={emailSubject}
                          onChange={(e) => setEmailSubject(e.target.value)}
                          placeholder="e.g. Greetings {{Name}}!"
                        />
                      </div>
                      
                      <div>
                        <label className="kemet-label">Email Body Template *</label>
                        <textarea 
                          rows={6}
                          className="kemet-input"
                          value={emailBody}
                          onChange={(e) => setEmailBody(e.target.value)}
                          placeholder="Dear {{Name}},\n\nHere is your update for account {{Email}}..."
                          style={{ resize: 'vertical', fontFamily: 'var(--font-body)' }}
                        />
                        <span style={{ fontSize: '10px', color: 'var(--sand-dark)', marginTop: '6px', display: 'block' }}>
                          Tip: Use variables like <code>{`{{Name}}`}</code> or <code>{`{{Email}}`}</code> which will be compiled dynamically matching individual row properties.
                        </span>
                      </div>
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
                      {isSaving ? 'Engraving...' : 'Activate Mail Dispatch'}
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

          {/* Active Campaigns Panel */}
          {!editingDbId && (
            <>
              {/* Left Column: Active Campaigns */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <h2 style={{ fontSize: '18px', textTransform: 'uppercase', fontFamily: 'var(--font-headings)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Active Courier Gates ({configs.length})
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
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                    <h3 style={{ fontSize: '16px', marginTop: '12px', color: 'var(--sand-light)' }}>No Active Dispatchers</h3>
                    <p style={{ fontSize: '12px', color: 'var(--sand-dark)', maxWidth: '300px', margin: '8px auto 0' }}>
                      Select a Notion contact database archive from the list on the right to build your newsletter dispatcher.
                    </p>
                  </div>
                ) : (
                  configs.map(cfg => {
                    const isSelectedForContacts = activeConfigIdForContacts === cfg.id;
                    return (
                      <GlowingCard 
                        key={cfg.id} 
                        title={cfg.settings?.email_subject || 'Mail Campaign'} 
                        subtitle={`DATABASE: ${cfg.database_name}`}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '10px' }}>
                          <p style={{ fontSize: '12px', color: 'var(--sand-dim)', margin: 0 }}>
                            Mode: {cfg.settings?.use_sandbox ? 'Sandbox' : 'SMTP'} • From: {cfg.settings?.smtp_from_email || cfg.settings?.smtp_user || 'Sandbox'} • Mapped: {cfg.settings?.column_email}
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
                                onClick={() => isSelectedForContacts ? setActiveConfigIdForContacts(null) : loadConfigContacts(cfg.id)}
                                className="kemet-btn-secondary"
                                style={{ padding: '6px 12px', fontSize: '12px', background: isSelectedForContacts ? 'rgba(212, 175, 55, 0.08)' : 'transparent' }}
                              >
                                {isSelectedForContacts ? 'Hide Contacts' : 'View Contacts'}
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

                          {/* Nested Contacts Listing */}
                          {isSelectedForContacts && (
                            <div style={{ 
                              marginTop: '12px', 
                              borderTop: '1px solid rgba(212, 175, 55, 0.1)', 
                              paddingTop: '16px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '12px'
                            }}>
                              <h4 style={{ fontSize: '13px', textTransform: 'uppercase', color: 'var(--gold)', margin: 0, fontFamily: 'var(--font-headings)' }}>
                                Campaign Contacts List
                              </h4>
                              
                              {isLoadingContacts ? (
                                <EyeOfHorusLoader size={30} text="Scanning contact scrolls..." />
                              ) : contactsError ? (
                                <div style={{ fontSize: '12px', color: '#F87171' }}>{contactsError}</div>
                              ) : contacts.length === 0 ? (
                                <div style={{ fontSize: '12px', color: 'var(--sand-dark)', fontStyle: 'italic' }}>
                                  No contact records found.
                                </div>
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                  
                                  {/* List controls */}
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255, 255, 255, 0.02)', padding: '6px 10px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.03)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <input 
                                        type="checkbox"
                                        checked={selectedContactIds.length === contacts.length && contacts.length > 0}
                                        onChange={handleToggleSelectAll}
                                        style={{ cursor: 'pointer' }}
                                      />
                                      <span style={{ fontSize: '11px', color: 'var(--sand-dim)' }}>Select All</span>
                                    </div>
                                    <span style={{ fontSize: '11px', color: 'var(--gold)' }}>
                                      {selectedContactIds.length} of {contacts.length} Selected
                                    </span>
                                  </div>

                                  {/* Table Body */}
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '200px', overflowY: 'auto', paddingRight: '4px' }}>
                                    {contacts.map(c => (
                                      <div key={c.id} style={{ 
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
                                          checked={selectedContactIds.includes(c.id)}
                                          onChange={() => handleToggleSelectContact(c.id)}
                                          style={{ cursor: 'pointer' }}
                                        />
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                          <div style={{ fontSize: '13px', color: 'var(--sand-light)', fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {c.name}
                                          </div>
                                          <div style={{ fontSize: '11px', color: 'var(--sand-dark)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {c.email || 'No email address'}
                                          </div>
                                        </div>
                                        <div>
                                          {c.isSent ? (
                                            <span style={{ 
                                              fontSize: '10px', 
                                              padding: '2px 6px', 
                                              background: 'rgba(52, 211, 153, 0.1)', 
                                              color: '#34D399', 
                                              borderRadius: '4px',
                                              border: '1px solid rgba(52,211,153,0.2)' 
                                            }}>
                                              Sent
                                            </span>
                                          ) : (
                                            <span style={{ 
                                              fontSize: '10px', 
                                              padding: '2px 6px', 
                                              background: 'rgba(255, 255, 255, 0.05)', 
                                              color: 'var(--sand-dim)', 
                                              borderRadius: '4px' 
                                            }}>
                                              Pending
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>

                                  {/* Send Trigger */}
                                  <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                                    <button
                                      onClick={() => handleSendEmails(selectedContactIds)}
                                      disabled={isSending || selectedContactIds.length === 0}
                                      className="kemet-btn"
                                      style={{ flex: 1, justifyContent: 'center', fontSize: '12px', padding: '8px 16px' }}
                                    >
                                      {isSending ? sendStatusMsg : `Dispatch Selection (${selectedContactIds.length})`}
                                    </button>
                                    <button
                                      onClick={() => handleSendEmails(contacts.filter(c => !c.isSent).map(c => c.id))}
                                      disabled={isSending || contacts.filter(c => !c.isSent).length === 0}
                                      className="kemet-btn-secondary"
                                      style={{ justifyContent: 'center', fontSize: '12px', padding: '8px 16px' }}
                                    >
                                      Bulk Dispatch Pending
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
                    <EyeOfHorusLoader size={50} text="Scanning shared database indexes..." />
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
                      No databases found. Make sure you shared contact lists with the integration during setup.
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
              Dissolve Courier Gate
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--sand-dim)', lineHeight: 1.6, marginTop: '16px', marginBottom: '24px' }}>
              Are you certain you wish to dissolve the Nile Dispatch gateway for <strong>{configToDelete?.database_name}</strong>? 
              This will disable campaign updates and dispatch capabilities for this configuration.
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
