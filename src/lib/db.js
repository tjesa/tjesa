import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import fs from 'fs';
import path from 'path';
import os from 'os';

// ---------------------------------------------------------------------------
// Supabase client (server-side only)
// All DB access happens in API routes / server components — never in the browser.
// RLS must be DISABLED on accounts, configs, and waitlist tables.
// ---------------------------------------------------------------------------
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseKey
);

const WORKSPACE_DB_FILE = path.join(process.cwd(), 'db.json');
const DB_FILE = path.join(os.homedir(), '.tjesa-db.json');
const TMP_DB_FILE = path.join(os.tmpdir(), 'db.json');

function readLocalDb() {
  try {
    // Seed home directory DB file from workspace db.json if it exists and home DB doesn't
    if (!fs.existsSync(DB_FILE) && fs.existsSync(WORKSPACE_DB_FILE)) {
      try {
        fs.copyFileSync(WORKSPACE_DB_FILE, DB_FILE);
      } catch (copyErr) {
        console.error('[db] Error seeding home directory db.json:', copyErr);
      }
    }

    if (fs.existsSync(TMP_DB_FILE)) {
      return JSON.parse(fs.readFileSync(TMP_DB_FILE, 'utf8'));
    }
    if (fs.existsSync(DB_FILE)) {
      return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    }
    if (fs.existsSync(WORKSPACE_DB_FILE)) {
      return JSON.parse(fs.readFileSync(WORKSPACE_DB_FILE, 'utf8'));
    }
  } catch (err) {
    console.error('[db] Error reading local db:', err);
  }
  return { accounts: [], configs: [], waitlist: [] };
}

function writeLocalDb(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    if (err.code === 'EROFS' || err.code === 'EACCES') {
      try {
        const tmpDir = path.dirname(TMP_DB_FILE);
        if (!fs.existsSync(tmpDir)) {
          fs.mkdirSync(tmpDir, { recursive: true });
        }
        fs.writeFileSync(TMP_DB_FILE, JSON.stringify(data, null, 2), 'utf8');
        console.log('[db] Wrote database updates to temporary storage (/tmp/db.json) due to read-only filesystem');
        return;
      } catch (tmpErr) {
        console.error('[db] Error writing to /tmp/db.json:', tmpErr);
      }
    } else {
      console.error('[db] Error writing local db:', err);
    }
  }
}

async function isBypassActive() {
  try {
    const cookieStore = await cookies();
    return cookieStore.get('tjesa_bypass_active')?.value === 'true';
  } catch {
    return false;
  }
}

function migrateConfig(cfg) {
  if (cfg && !cfg.tool) {
    return {
      ...cfg,
      tool: 'qr_generator',
      settings: {
        source_column: cfg.source_column || '',
        target_column: cfg.target_column || '',
        trigger_type: cfg.trigger_type || 'full',
        trigger_column: cfg.trigger_column || '',
        trigger_value: cfg.trigger_value || ''
      },
      active: cfg.active !== undefined ? cfg.active : true
    };
  }
  return cfg;
}

// ---------------------------------------------------------------------------
// Accounts
// ---------------------------------------------------------------------------

/**
 * Get all accounts
 */
export async function getAccounts() {
  const local = readLocalDb().accounts || [];
  const { data, error } = await supabase.from('accounts').select('*');
  if (error) { 
    console.error('[db] getAccounts error:', error); 
    return local; 
  }
  
  // Merge by workspace_id, prioritizing Supabase data
  const merged = [...(data || [])];
  local.forEach(row => {
    if (!merged.some(m => m.workspace_id === row.workspace_id)) {
      merged.push(row);
    }
  });
  return merged;
}

export async function getAccountsForUser(userId) {
  const db = readLocalDb();
  const local = (db.accounts || []).filter(a => a.user_id === userId);

  if (userId === '00000000-0000-0000-0000-000000000000') {
    return local;
  }
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('user_id', userId);
  if (error) { 
    console.error('[db] getAccountsForUser error:', error); 
    return local; 
  }
  
  const merged = [...(data || [])];
  local.forEach(row => {
    if (!merged.some(m => m.workspace_id === row.workspace_id)) {
      merged.push(row);
    }
  });
  return merged;
}

/**
 * Save or update an account (identified by workspace_id)
 */
export async function saveAccount(account) {
  const bypass = account.user_id === '00000000-0000-0000-0000-000000000000';
  if (bypass) {
    const db = readLocalDb();
    db.accounts = db.accounts || [];
    const index = db.accounts.findIndex(a => a.workspace_id === account.workspace_id);
    if (index >= 0) {
      db.accounts[index] = { ...db.accounts[index], ...account };
    } else {
      db.accounts.push(account);
    }
    writeLocalDb(db);
    return account;
  }

  const { data, error } = await supabase
    .from('accounts')
    .upsert(account, { onConflict: 'workspace_id' })
    .select()
    .single();
  if (error) {
    console.error('[db] saveAccount Supabase error:', error);
    throw new Error('Failed to save account: ' + error.message);
  }
  return data;
}

/**
 * Retrieve a specific account by workspace ID
 */
export async function getAccount(workspaceId) {
  // Check local db first (for bypass/dev accounts)
  const local = (readLocalDb().accounts || []).find(a => a.workspace_id === workspaceId);
  if (local) return local;

  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('workspace_id', workspaceId)
    .maybeSingle();
  if (error) { console.error('[db] getAccount error:', error); return null; }
  return data;
}

/**
 * Retrieve any account that matches or starts with the workspace ID
 */
export async function getAnyAccountForWorkspace(workspaceId) {
  const db = readLocalDb();
  const local = (db.accounts || []).find(a => 
    a.workspace_id === workspaceId || a.workspace_id.startsWith(workspaceId + '_')
  );
  if (local) return local;

  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .or(`workspace_id.eq.${workspaceId},workspace_id.like.${workspaceId}_%`);
  if (error) { console.error('[db] getAnyAccountForWorkspace error:', error); return null; }
  return data?.[0] || null;
}

/**
 * Delete a specific account by workspace ID
 */
export async function deleteAccount(workspaceId) {
  const db = readLocalDb();
  db.accounts = (db.accounts || []).filter(a => a.workspace_id !== workspaceId);
  writeLocalDb(db);

  const { error } = await supabase
    .from('accounts')
    .delete()
    .eq('workspace_id', workspaceId);
  if (error) { console.error('[db] deleteAccount error:', error); throw new Error(error.message); }
}

/**
 * Delete all accounts for a workspace (global disconnect)
 */
export async function deleteWorkspaceAccounts(workspaceId) {
  const db = readLocalDb();
  db.accounts = (db.accounts || []).filter(a => 
    a.workspace_id !== workspaceId && !a.workspace_id.startsWith(workspaceId + '_')
  );
  writeLocalDb(db);

  const { error } = await supabase
    .from('accounts')
    .delete()
    .or(`workspace_id.eq.${workspaceId},workspace_id.like.${workspaceId}_%`);
  if (error) { console.error('[db] deleteWorkspaceAccounts error:', error); throw new Error(error.message); }
}

// ---------------------------------------------------------------------------
// Configs
// ---------------------------------------------------------------------------

/**
 * Get all configurations for a workspace
 */
export async function getConfigs(workspaceId) {
  const db = readLocalDb();
  const local = (db.configs || []).filter(c => c.workspace_id === workspaceId).map(migrateConfig);

  const { data, error } = await supabase
    .from('configs')
    .select('*')
    .eq('workspace_id', workspaceId);
  if (error) { 
    console.error('[db] getConfigs error:', error); 
    return local; 
  }
  
  const merged = [...(data || []).map(migrateConfig)];
  local.forEach(row => {
    if (!merged.some(m => m.id === row.id)) {
      merged.push(row);
    }
  });
  return merged;
}

/**
 * Save or update a database synchronization config
 */
export async function saveConfig(config) {
  const bypass = (readLocalDb().accounts || []).some(a => a.workspace_id.split('_')[0] === config.workspace_id.split('_')[0]);

  // Generate ID for new configs
  if (!config.id) {
    if (bypass) {
      const db = readLocalDb();
      const existing = (db.configs || []).find(c => 
        c.database_id === config.database_id && 
        c.workspace_id === config.workspace_id && 
        c.tool === config.tool
      );
      config.id = existing?.id || Math.random().toString(36).substring(2, 9);
    } else {
      try {
        const { data: existing } = await supabase
          .from('configs')
          .select('id')
          .eq('database_id', config.database_id)
          .eq('workspace_id', config.workspace_id)
          .eq('tool', config.tool)
          .maybeSingle();

        config.id = existing?.id || Math.random().toString(36).substring(2, 9);
      } catch (err) {
        config.id = Math.random().toString(36).substring(2, 9);
      }
    }
  }

  if (bypass) {
    const db = readLocalDb();
    db.configs = db.configs || [];
    const index = db.configs.findIndex(c => c.id === config.id);
    if (index >= 0) {
      db.configs[index] = { ...db.configs[index], ...config };
    } else {
      db.configs.push(config);
    }
    writeLocalDb(db);
    return migrateConfig(config);
  }

  const { data, error } = await supabase
    .from('configs')
    .upsert(config, { onConflict: 'id' })
    .select()
    .single();
  if (error) {
    console.error('[db] saveConfig Supabase error:', error);
    throw new Error('Failed to save config: ' + error.message);
  }
  return migrateConfig(data);
}

/**
 * Delete a config
 */
export async function deleteConfig(id) {
  const db = readLocalDb();
  db.configs = (db.configs || []).filter(c => c.id !== id);
  writeLocalDb(db);

  const { error } = await supabase.from('configs').delete().eq('id', id);
  if (error) throw new Error('[db] deleteConfig error: ' + error.message);
}

/**
 * Retrieve a specific configuration by config ID
 */
export async function getConfig(id) {
  const db = readLocalDb();
  const local = (db.configs || []).find(c => c.id === id);
  if (local) return migrateConfig(local);

  const { data, error } = await supabase
    .from('configs')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) { console.error('[db] getConfig error:', error); return null; }
  return data ? migrateConfig(data) : null;
}

// ---------------------------------------------------------------------------
// Waitlist
// ---------------------------------------------------------------------------

/**
 * Save an email registration to the waitlist
 */
export async function saveWaitlist(email, name = '', excitedTool = '', utmSource = '', utmMedium = '', utmCampaign = '', referrer = 'Direct / Organic') {
  const bypass = await isBypassActive();
  if (bypass) {
    const db = readLocalDb();
    db.waitlist = db.waitlist || [];
    const existing = db.waitlist.find(w => w.email.toLowerCase() === email.trim().toLowerCase());
    if (existing) throw new Error('Email already registered');
    const entry = { 
      id: Date.now(), 
      email: email.trim(), 
      name: name.trim(),
      excited_tool: excitedTool.trim(),
      utm_source: utmSource.trim(),
      utm_medium: utmMedium.trim(),
      utm_campaign: utmCampaign.trim(),
      referrer: referrer.trim(),
      registered_at: new Date().toISOString() 
    };
    db.waitlist.push(entry);
    writeLocalDb(db);
    return entry;
  }

  // Check for duplicates first in Supabase
  const { data: existing } = await supabase
    .from('waitlist')
    .select('id')
    .ilike('email', email.trim())
    .maybeSingle();

  if (existing) throw new Error('Email already registered');

  const entry = { 
    email: email.trim(), 
    name: name.trim(), 
    excited_tool: excitedTool.trim(),
    utm_source: utmSource.trim(),
    utm_medium: utmMedium.trim(),
    utm_campaign: utmCampaign.trim(),
    referrer: referrer.trim(),
    registered_at: new Date().toISOString() 
  };

  // Attempt to write all fields to Supabase, fallback to only email if columns don't exist
  try {
    const { data, error } = await supabase
      .from('waitlist')
      .insert(entry)
      .select()
      .single();
    if (!error && data) return data;
  } catch (err) {
    console.warn('[db] Supabase insert with name/excited_tool/UTMs/referrer failed, falling back to email only. Error:', err.message || err);
  }

  const fallbackEntry = { email: email.trim(), registered_at: entry.registered_at };
  const { data, error } = await supabase
    .from('waitlist')
    .insert(fallbackEntry)
    .select()
    .single();
  if (error) throw new Error('[db] saveWaitlist error: ' + error.message);

  // Still save full details in local db.json database
  try {
    const db = readLocalDb();
    db.waitlist = db.waitlist || [];
    const localEntry = { 
      ...entry,
      id: data.id || Date.now()
    };
    db.waitlist.push(localEntry);
    writeLocalDb(db);
  } catch (e) {
    console.error('[db] Error writing full waitlist entry locally:', e);
  }

  return data;
}

/**
 * Retrieve all emails registered in the waitlist
 */
export async function getWaitlist() {
  const local = readLocalDb().waitlist || [];
  const { data, error } = await supabase
    .from('waitlist')
    .select('*')
    .order('registered_at', { ascending: false });
  if (error) { console.error('[db] getWaitlist error:', error); return local; }
  
  const merged = [...local];
  (data || []).forEach(row => {
    if (!merged.some(m => m.email.toLowerCase() === row.email.toLowerCase())) {
      merged.push(row);
    }
  });
  return merged;
}

// ---------------------------------------------------------------------------
// UTM Links
// ---------------------------------------------------------------------------

/**
 * Retrieve all UTM links
 */
export async function getUtmLinks() {
  const local = readLocalDb().utm_links || [];
  const { data, error } = await supabase
    .from('utm_links')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) {
    console.error('[db] getUtmLinks error:', error);
    if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
      throw error;
    }
    return local;
  }
  
  const merged = [...local];
  (data || []).forEach(row => {
    if (!merged.some(m => m.id === row.id)) {
      merged.push(row);
    }
  });
  return merged;
}

/**
 * Save or update a UTM link
 */
export async function saveUtmLink(utmLink) {
  const bypass = await isBypassActive();
  if (!utmLink.id) {
    utmLink.id = Math.random().toString(36).substring(2, 9);
  }
  if (!utmLink.created_at) {
    utmLink.created_at = new Date().toISOString();
  }

  if (bypass) {
    const db = readLocalDb();
    db.utm_links = db.utm_links || [];
    const index = db.utm_links.findIndex(u => u.id === utmLink.id);
    if (index >= 0) {
      db.utm_links[index] = { ...db.utm_links[index], ...utmLink };
    } else {
      db.utm_links.push(utmLink);
    }
    writeLocalDb(db);
    return utmLink;
  }

  try {
    const { data, error } = await supabase
      .from('utm_links')
      .upsert(utmLink, { onConflict: 'id' })
      .select()
      .single();
    if (!error && data) return data;
    if (error) throw error;
  } catch (err) {
    console.warn('[db] Supabase insert/upsert for utm_links failed, falling back to local DB. Error:', err.message || err);
    if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
      throw err;
    }
  }

  // Fallback to local db.json
  const db = readLocalDb();
  db.utm_links = db.utm_links || [];
  const index = db.utm_links.findIndex(u => u.id === utmLink.id);
  if (index >= 0) {
    db.utm_links[index] = { ...db.utm_links[index], ...utmLink };
  } else {
    db.utm_links.push(utmLink);
  }
  writeLocalDb(db);
  return utmLink;
}

// ---------------------------------------------------------------------------
// Pageview Aggregates & Hit Tracking
// ---------------------------------------------------------------------------

/**
 * Record a pageview in daily aggregate form
 */
export async function recordPageview({ referrer, utmSource, utmMedium, utmCampaign, country }) {
  const bypass = await isBypassActive();
  const date = new Date().toISOString().substring(0, 10); // YYYY-MM-DD
  const ref = (referrer || 'Direct / Organic').trim();
  const src = (utmSource || '').trim();
  const med = (utmMedium || '').trim();
  const cmp = (utmCampaign || '').trim();
  const geo = (country || 'Unknown').trim();

  if (bypass) {
    const db = readLocalDb();
    db.pageview_aggregates = db.pageview_aggregates || [];
    const index = db.pageview_aggregates.findIndex(p => 
      p.date === date &&
      p.referrer.toLowerCase() === ref.toLowerCase() &&
      p.utm_source.toLowerCase() === src.toLowerCase() &&
      p.utm_medium.toLowerCase() === med.toLowerCase() &&
      p.utm_campaign.toLowerCase() === cmp.toLowerCase() &&
      p.country.toLowerCase() === geo.toLowerCase()
    );

    if (index >= 0) {
      db.pageview_aggregates[index].views += 1;
    } else {
      db.pageview_aggregates.push({
        id: Date.now() + Math.random().toString(36).substring(2, 5),
        date,
        referrer: ref,
        utm_source: src,
        utm_medium: med,
        utm_campaign: cmp,
        country: geo,
        views: 1
      });
    }
    writeLocalDb(db);
    return;
  }

  try {
    // Check if matching row exists
    const { data, error: selectError } = await supabase
      .from('pageview_aggregates')
      .select('*')
      .eq('date', date)
      .ilike('referrer', ref)
      .ilike('utm_source', src)
      .ilike('utm_medium', med)
      .ilike('utm_campaign', cmp)
      .ilike('country', geo)
      .maybeSingle();

    if (!selectError) {
      if (data) {
        // Row exists, increment views
        const { error: updateError } = await supabase
          .from('pageview_aggregates')
          .update({ views: data.views + 1 })
          .eq('id', data.id);
        if (!updateError) return;
      } else {
        // Row does not exist, insert it
        const { error: insertError } = await supabase
          .from('pageview_aggregates')
          .insert({
            date,
            referrer: ref,
            utm_source: src,
            utm_medium: med,
            utm_campaign: cmp,
            country: geo,
            views: 1
          });
        if (!insertError) return;
      }
    }
  } catch (err) {
    console.warn('[db] Supabase recordPageview failed, falling back to local DB. Error:', err.message || err);
  }

  // Fallback to local db.json if database write fails
  const db = readLocalDb();
  db.pageview_aggregates = db.pageview_aggregates || [];
  const index = db.pageview_aggregates.findIndex(p => 
    p.date === date &&
    p.referrer.toLowerCase() === ref.toLowerCase() &&
    p.utm_source.toLowerCase() === src.toLowerCase() &&
    p.utm_medium.toLowerCase() === med.toLowerCase() &&
    p.utm_campaign.toLowerCase() === cmp.toLowerCase() &&
    p.country.toLowerCase() === geo.toLowerCase()
  );

  if (index >= 0) {
    db.pageview_aggregates[index].views += 1;
  } else {
    db.pageview_aggregates.push({
      id: Date.now() + Math.random().toString(36).substring(2, 5),
      date,
      referrer: ref,
      utm_source: src,
      utm_medium: med,
      utm_campaign: cmp,
      country: geo,
      views: 1
    });
  }
  writeLocalDb(db);
}

/**
 * Retrieve pageview aggregates
 */
export async function getPageviewAnalytics() {
  const local = readLocalDb().pageview_aggregates || [];
  const { data, error } = await supabase
    .from('pageview_aggregates')
    .select('*')
    .order('date', { ascending: false });
  if (error) {
    console.error('[db] getPageviewAnalytics error:', error);
    return local;
  }
  
  // Merge, prioritizing Supabase database
  const merged = [...(data || [])];
  local.forEach(row => {
    const exists = merged.some(m => 
      m.date === row.date &&
      m.referrer.toLowerCase() === row.referrer.toLowerCase() &&
      m.utm_source.toLowerCase() === row.utm_source.toLowerCase() &&
      m.utm_medium.toLowerCase() === row.utm_medium.toLowerCase() &&
      m.utm_campaign.toLowerCase() === row.utm_campaign.toLowerCase() &&
      m.country.toLowerCase() === row.country.toLowerCase()
    );
    if (!exists) {
      merged.push(row);
    }
  });
  return merged;
}

// ---------------------------------------------------------------------------
// Feedback / Ticketing System
// Required Supabase table:
//   CREATE TABLE feedback (
//     id TEXT PRIMARY KEY,
//     user_id UUID,
//     user_email TEXT NOT NULL,
//     category TEXT NOT NULL,
//     subject TEXT NOT NULL,
//     message TEXT NOT NULL,
//     status TEXT DEFAULT 'open',
//     priority TEXT DEFAULT 'medium',
//     admin_notes TEXT DEFAULT '',
//     resolved_at TIMESTAMPTZ,
//     updated_at TIMESTAMPTZ DEFAULT now(),
//     submitted_at TIMESTAMPTZ DEFAULT now()
//   );
// Migration for existing table:
//   ALTER TABLE feedback
//     ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium',
//     ADD COLUMN IF NOT EXISTS admin_notes TEXT DEFAULT '',
//     ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ,
//     ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
// ---------------------------------------------------------------------------

export async function saveFeedback(entry) {
  const bypass = await isBypassActive();
  if (!entry.id) entry.id = Math.random().toString(36).substring(2, 9);
  if (!entry.submitted_at) entry.submitted_at = new Date().toISOString();

  if (bypass) {
    const db = readLocalDb();
    db.feedback = db.feedback || [];
    db.feedback.push(entry);
    writeLocalDb(db);
    return entry;
  }

  try {
    const { data, error } = await supabase
      .from('feedback')
      .insert(entry)
      .select()
      .single();
    if (!error && data) return data;
    if (error) throw error;
  } catch (err) {
    console.warn('[db] Supabase insert feedback failed, falling back to local DB. Error:', err.message || err);
  }

  const db = readLocalDb();
  db.feedback = db.feedback || [];
  db.feedback.push(entry);
  writeLocalDb(db);
  return entry;
}

export async function getFeedback() {
  const local = readLocalDb().feedback || [];
  const { data, error } = await supabase
    .from('feedback')
    .select('*')
    .order('submitted_at', { ascending: false });
  if (error) { console.error('[db] getFeedback error:', error); return local; }

  const merged = [...(data || [])];
  local.forEach(row => {
    if (!merged.some(m => m.id === row.id)) merged.push(row);
  });
  return merged;
}

export async function getFeedbackForUser(userId) {
  const local = (readLocalDb().feedback || []).filter(f => f.user_id === userId);
  if (userId === '00000000-0000-0000-0000-000000000000') return local;

  const { data, error } = await supabase
    .from('feedback')
    .select('*')
    .eq('user_id', userId)
    .order('submitted_at', { ascending: false });
  if (error) { console.error('[db] getFeedbackForUser error:', error); return local; }

  const merged = [...(data || [])];
  local.forEach(row => {
    if (!merged.some(m => m.id === row.id)) merged.push(row);
  });
  return merged;
}

export async function updateFeedback(id, updates) {
  const bypass = await isBypassActive();
  const payload = { ...updates, updated_at: new Date().toISOString() };
  if (updates.status === 'resolved' && !updates.resolved_at) {
    payload.resolved_at = new Date().toISOString();
  }
  if (updates.status !== 'resolved') {
    payload.resolved_at = null;
  }

  if (bypass) {
    const db = readLocalDb();
    db.feedback = db.feedback || [];
    const idx = db.feedback.findIndex(f => f.id === id);
    if (idx >= 0) {
      db.feedback[idx] = { ...db.feedback[idx], ...payload };
      writeLocalDb(db);
      return db.feedback[idx];
    }
    throw new Error('Ticket not found');
  }

  try {
    const { data, error } = await supabase
      .from('feedback')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (!error && data) {
      const db = readLocalDb();
      db.feedback = db.feedback || [];
      const idx = db.feedback.findIndex(f => f.id === id);
      if (idx >= 0) { db.feedback[idx] = { ...db.feedback[idx], ...payload }; writeLocalDb(db); }
      return data;
    }
    if (error) throw error;
  } catch (err) {
    console.warn('[db] Supabase updateFeedback failed, falling back to local DB. Error:', err.message || err);
  }

  const db = readLocalDb();
  db.feedback = db.feedback || [];
  const idx = db.feedback.findIndex(f => f.id === id);
  if (idx >= 0) {
    db.feedback[idx] = { ...db.feedback[idx], ...payload };
    writeLocalDb(db);
    return db.feedback[idx];
  }
  throw new Error('Ticket not found');
}

export async function voteFeedback(id, val) {
  const bypass = await isBypassActive();
  
  if (bypass) {
    const db = readLocalDb();
    db.feedback = db.feedback || [];
    const idx = db.feedback.findIndex(f => f.id === id);
    if (idx >= 0) {
      const votes = (db.feedback[idx].votes || 0) + val;
      db.feedback[idx].votes = Math.max(0, votes);
      writeLocalDb(db);
      return db.feedback[idx];
    }
    throw new Error('Feedback not found');
  }

  try {
    const { data: current, error: getErr } = await supabase
      .from('feedback')
      .select('votes')
      .eq('id', id)
      .maybeSingle();
    if (getErr) throw getErr;

    const currentVotes = current?.votes || 0;
    const { data, error } = await supabase
      .from('feedback')
      .update({ votes: Math.max(0, currentVotes + val) })
      .eq('id', id)
      .select()
      .single();
    if (!error && data) {
      const db = readLocalDb();
      db.feedback = db.feedback || [];
      const idx = db.feedback.findIndex(f => f.id === id);
      if (idx >= 0) {
        db.feedback[idx] = { ...db.feedback[idx], votes: data.votes };
        writeLocalDb(db);
      }
      return data;
    }
    if (error) throw error;
  } catch (err) {
    console.warn('[db] Supabase voteFeedback failed, falling back to local DB. Error:', err.message || err);
  }

  const db = readLocalDb();
  db.feedback = db.feedback || [];
  const idx = db.feedback.findIndex(f => f.id === id);
  if (idx >= 0) {
    const votes = (db.feedback[idx].votes || 0) + val;
    db.feedback[idx].votes = Math.max(0, votes);
    writeLocalDb(db);
    return db.feedback[idx];
  }
  throw new Error('Feedback not found');
}


/**
 * Delete a UTM link by ID
 */
export async function deleteUtmLink(id) {
  const db = readLocalDb();
  db.utm_links = (db.utm_links || []).filter(u => u.id !== id);
  writeLocalDb(db);

  try {
    const { error } = await supabase.from('utm_links').delete().eq('id', id);
    if (error) console.error('[db] deleteUtmLink Supabase error:', error);
  } catch (err) {
    console.error('[db] deleteUtmLink Supabase catch error:', err);
  }
}

/**
 * Invite a waitlist scribe (updates status to 'invited' and records timestamp)
 */
export async function inviteWaitlistScribe(id) {
  const bypass = await isBypassActive();
  const invitedAt = new Date().toISOString();

  if (bypass) {
    const db = readLocalDb();
    db.waitlist = db.waitlist || [];
    const index = db.waitlist.findIndex(w => String(w.id) === String(id));
    if (index >= 0) {
      db.waitlist[index] = {
        ...db.waitlist[index],
        status: 'invited',
        invited_at: invitedAt
      };
      writeLocalDb(db);
      return db.waitlist[index];
    }
    throw new Error('Scribe not found in local scrolls.');
  }

  // Attempt Supabase update first
  try {
    const { data, error } = await supabase
      .from('waitlist')
      .update({ status: 'invited', invited_at: invitedAt })
      .eq('id', id)
      .select()
      .single();
    if (!error && data) {
      // Sync local DB as well
      try {
        const db = readLocalDb();
        db.waitlist = db.waitlist || [];
        const idx = db.waitlist.findIndex(w => String(w.id) === String(id) || w.email?.toLowerCase() === data.email?.toLowerCase());
        if (idx >= 0) {
          db.waitlist[idx] = { ...db.waitlist[idx], status: 'invited', invited_at: invitedAt };
          writeLocalDb(db);
        }
      } catch (localErr) {
        console.error('[db] Error syncing local waitlist invite status:', localErr);
      }
      return data;
    }
    if (error) throw error;
  } catch (err) {
    console.warn('[db] Supabase update waitlist status failed, falling back to local DB. Error:', err.message || err);
  }

  // Fallback local update
  const db = readLocalDb();
  db.waitlist = db.waitlist || [];
  const index = db.waitlist.findIndex(w => String(w.id) === String(id));
  if (index >= 0) {
    db.waitlist[index] = {
      ...db.waitlist[index],
      status: 'invited',
      invited_at: invitedAt
    };
    writeLocalDb(db);
    return db.waitlist[index];
  }
  throw new Error('Scribe not found in waitlist database.');
}


