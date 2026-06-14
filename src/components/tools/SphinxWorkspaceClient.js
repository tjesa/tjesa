'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../Header';
import GlowingCard from '../GlowingCard';
import EyeOfHorusLoader from '../EyeOfHorusLoader';
import CustomSelect from '../CustomSelect';

export default function SphinxWorkspaceClient({ account, initialConfigs, oauthUrl }) {
  const router = useRouter();
  const [configs, setConfigs] = useState(initialConfigs || []);
  
  // Filter out QR generator since it is internal to Notion databases
  const securablePortals = configs.filter(c => c.tool !== 'qr_generator');

  const [selectedConfigId, setSelectedConfigId] = useState(null);
  
  // Gate Config States
  const [gateActive, setGateActive] = useState(false);
  const [gateType, setGateType] = useState('password');
  const [gatePassword, setGatePassword] = useState('');
  const [gateAllowedEmails, setGateAllowedEmails] = useState('');

  // General UI States
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const activeConfig = securablePortals.find(c => c.id === selectedConfigId);

  const handleSelectPortal = (config) => {
    setSelectedConfigId(config.id);
    const settings = config.settings || {};
    setGateActive(!!settings.gate_active);
    setGateType(settings.gate_type || 'password');
    setGatePassword(settings.gate_password || '');
    setGateAllowedEmails(settings.gate_allowed_emails || '');
    setError('');
    setSuccessMsg('');
  };

  const handleSaveGateSettings = async () => {
    if (!selectedConfigId) return;
    
    setIsSaving(true);
    setError('');
    setSuccessMsg('');

    if (gateActive) {
      if (!gatePassword.trim()) {
        setError('You must specify a gate password.');
        setIsSaving(false);
        return;
      }
      if (gateType === 'email_whitelist' && !gateAllowedEmails.trim()) {
        setError('You must list at least one authorized email for Client Portal whitelist.');
        setIsSaving(false);
        return;
      }
    }

    try {
      const response = await fetch('/api/tools/sphinx/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          configId: selectedConfigId,
          gateActive,
          gateType,
          gatePassword: gatePassword.trim(),
          gateAllowedEmails: gateAllowedEmails.trim()
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMsg('Gate protection settings engraved successfully.');
        
        // Update local configs state
        setConfigs(prev => prev.map(c => c.id === data.config.id ? data.config : c));
        
        // Close settings drawer after a short delay
        setTimeout(() => {
          setSelectedConfigId(null);
        }, 1200);
      } else {
        setError(data.error || 'Failed to save gate security settings.');
      }
    } catch (err) {
      setError('Connection disrupted. Failed to save security settings.');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const getToolLabel = (tool) => {
    if (tool === 'charts_observatory') return 'Aten Observatory (Chart)';
    if (tool === 'form_builder') return 'Nile Scribe (Form)';
    if (tool === 'papyrus_publisher') return 'Papyrus Website (CMS)';
    return tool;
  };

  const getPortalTitle = (cfg) => {
    const settings = cfg.settings || {};
    if (cfg.tool === 'charts_observatory') return settings.chart_title || cfg.database_name;
    if (cfg.tool === 'form_builder') return settings.form_title || cfg.database_name;
    if (cfg.tool === 'papyrus_publisher') return settings.site_title || cfg.database_name;
    return cfg.database_name;
  };

  const handleDisconnect = async () => {
    try {
      const response = await fetch('/api/auth/disconnect?tool=sphinx', { method: 'POST' });
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
              THE SPHINX SHIELD
            </span>
            <h1 style={{ fontSize: '32px', marginTop: '4px', textTransform: 'uppercase', fontFamily: 'var(--font-headings)', margin: 0 }}>
              Shield Chambers
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--sand-dim)', marginTop: '4px', margin: 0 }}>
              Protect public charts, websites, and survey forms with password gates and client whitelists.
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
          gridTemplateColumns: activeConfig ? '1fr' : '1fr', 
          gap: '32px',
          alignItems: 'start'
        }}>

          {/* Active Config Gate Settings Panel */}
          {activeConfig && (
            <GlowingCard title={`Configure Shield: ${getPortalTitle(activeConfig)}`} subtitle="PORTAL VAULT PROTECTION">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '12px' }}>
                
                {/* Gate Protection Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input
                    type="checkbox"
                    id="gateActive"
                    checked={gateActive}
                    onChange={(e) => setGateActive(e.target.checked)}
                    style={{
                      width: '20px',
                      height: '20px',
                      accentColor: 'var(--gold)',
                      cursor: 'pointer'
                    }}
                  />
                  <label htmlFor="gateActive" style={{ fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', userSelect: 'none', color: 'var(--sand-light)' }}>
                    Enable Sphinx Vault Gate Protection
                  </label>
                </div>

                {gateActive && (
                  <>
                    {/* Gate Type Select */}
                    <div>
                      <CustomSelect
                        label="Gate Protection Type"
                        value={gateType}
                        onChange={setGateType}
                        options={[
                          { value: 'password', label: 'Master Password Key' },
                          { value: 'email_whitelist', label: 'Client Portal (Email Whitelist)' }
                        ]}
                        placeholder="Select gate type"
                      />
                    </div>

                    {/* Password Input */}
                    <div>
                      <label className="kemet-label">Access Password</label>
                      <input
                        type="text"
                        className="kemet-input"
                        value={gatePassword}
                        onChange={(e) => setGatePassword(e.target.value)}
                        placeholder="Enter secure password"
                      />
                    </div>

                    {/* Whitelisted Emails */}
                    {gateType === 'email_whitelist' && (
                      <div>
                        <label className="kemet-label">Authorized Client Emails</label>
                        <textarea
                          className="kemet-input"
                          rows="3"
                          value={gateAllowedEmails}
                          onChange={(e) => setGateAllowedEmails(e.target.value)}
                          placeholder="e.g. client1@example.com, visitor2@company.com (comma separated)"
                          style={{ resize: 'vertical' }}
                        />
                        <p style={{ fontSize: '11px', color: 'var(--sand-dark)', marginTop: '6px', margin: 0 }}>
                          Only users with these email addresses will be authorized to unlock this portal.
                        </p>
                      </div>
                    )}
                  </>
                )}

                {/* Save Buttons */}
                <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                  <button
                    className="kemet-btn"
                    onClick={handleSaveGateSettings}
                    disabled={isSaving}
                    style={{ flex: 1, justifyContent: 'center' }}
                  >
                    {isSaving ? 'Engraving...' : 'Engrave Security Settings'}
                  </button>
                  <button
                    className="kemet-btn-secondary"
                    onClick={() => setSelectedConfigId(null)}
                    disabled={isSaving}
                  >
                    Cancel
                  </button>
                </div>

              </div>
            </GlowingCard>
          )}

          {/* List of Securable Portals */}
          {!activeConfig && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <h2 style={{ fontSize: '18px', textTransform: 'uppercase', fontFamily: 'var(--font-headings)', margin: 0 }}>
                Public Portals Registry
              </h2>

              {securablePortals.length === 0 ? (
                <div style={{
                  padding: '50px 24px',
                  textAlign: 'center',
                  border: '1px dashed rgba(212, 175, 55, 0.15)',
                  borderRadius: '12px',
                  background: 'rgba(var(--obsidian-rgb), 0.4)'
                }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 12px', display: 'block', opacity: 0.5 }}>
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  <h3 style={{ fontSize: '16px', marginTop: '12px', color: 'var(--sand-light)' }}>No Public Portals Registered</h3>
                  <p style={{ fontSize: '12px', color: 'var(--sand-dark)', maxWidth: '300px', margin: '8px auto 0' }}>
                    You must first configure a public website, chart observatory, or Nile survey form to enable gate protection.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '24px' }}>
                  {securablePortals.map(cfg => {
                    const isProtected = !!cfg.settings?.gate_active;
                    return (
                      <GlowingCard
                        key={cfg.id}
                        title={getPortalTitle(cfg)}
                        subtitle={getToolLabel(cfg.tool)}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '10px', height: '100%', justifyContent: 'space-between' }}>
                          <div>
                            <span style={{
                              fontSize: '10px',
                              padding: '3px 8px',
                              borderRadius: '20px',
                              fontFamily: 'var(--font-headings)',
                              letterSpacing: '0.05em',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              background: isProtected ? 'rgba(212, 175, 55, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                              color: isProtected ? 'var(--gold)' : 'var(--sand-dark)',
                              border: isProtected ? '1px solid rgba(212, 175, 55, 0.2)' : '1px solid rgba(255, 255, 255, 0.05)'
                            }}>
                              {isProtected ? (
                                <>
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                  </svg>
                                  SECURED BY SPHINX
                                </>
                              ) : (
                                <>
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                    <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                                  </svg>
                                  UNPROTECTED GATE
                                </>
                              )}
                            </span>
                            <p style={{ fontSize: '12px', color: 'var(--sand-dark)', marginTop: '8px', margin: '8px 0 0 0' }}>
                              ID: <code>{cfg.id}</code>
                            </p>
                          </div>

                          <button
                            onClick={() => handleSelectPortal(cfg)}
                            className="kemet-btn"
                            style={{ width: '100%', justifyContent: 'center', fontSize: '12px', padding: '10px 16px' }}
                          >
                            Manage Security Gate
                          </button>
                        </div>
                      </GlowingCard>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
