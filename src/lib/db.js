import { createClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Supabase client (server-side only)
// All DB access happens in API routes / server components — never in the browser.
// RLS must be DISABLED on accounts, configs, and waitlist tables.
// ---------------------------------------------------------------------------
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
);

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
  const { data, error } = await supabase.from('accounts').select('*');
  if (error) { console.error('[db] getAccounts error:', error); return []; }
  return data || [];
}

/**
 * Save or update an account (identified by workspace_id)
 */
export async function saveAccount(account) {
  const { data, error } = await supabase
    .from('accounts')
    .upsert(account, { onConflict: 'workspace_id' })
    .select()
    .single();
  if (error) throw new Error('[db] saveAccount error: ' + error.message);
  return data;
}

/**
 * Retrieve a specific account by workspace ID
 */
export async function getAccount(workspaceId) {
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
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .or(`workspace_id.eq.${workspaceId},workspace_id.like.${workspaceId}_%`);
  if (error) { console.error('[db] getAnyAccountForWorkspace error:', error); return null; }
  return data?.[0] || null;
}

// ---------------------------------------------------------------------------
// Configs
// ---------------------------------------------------------------------------

/**
 * Get all configurations for a workspace
 */
export async function getConfigs(workspaceId) {
  const { data, error } = await supabase
    .from('configs')
    .select('*')
    .eq('workspace_id', workspaceId);
  if (error) { console.error('[db] getConfigs error:', error); return []; }
  return (data || []).map(migrateConfig);
}

/**
 * Save or update a database synchronization config
 */
export async function saveConfig(config) {
  // Generate ID for new configs
  if (!config.id) {
    // Check for existing config matching same database + workspace + tool
    const { data: existing } = await supabase
      .from('configs')
      .select('id')
      .eq('database_id', config.database_id)
      .eq('workspace_id', config.workspace_id)
      .eq('tool', config.tool)
      .maybeSingle();

    config.id = existing?.id || Math.random().toString(36).substring(2, 9);
  }

  const { data, error } = await supabase
    .from('configs')
    .upsert(config, { onConflict: 'id' })
    .select()
    .single();
  if (error) throw new Error('[db] saveConfig error: ' + error.message);
  return data;
}

/**
 * Delete a config
 */
export async function deleteConfig(id) {
  const { error } = await supabase.from('configs').delete().eq('id', id);
  if (error) throw new Error('[db] deleteConfig error: ' + error.message);
}

/**
 * Retrieve a specific configuration by config ID
 */
export async function getConfig(id) {
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
export async function saveWaitlist(email) {
  // Check for duplicates first
  const { data: existing } = await supabase
    .from('waitlist')
    .select('id')
    .ilike('email', email.trim())
    .maybeSingle();

  if (existing) throw new Error('Email already registered');

  const entry = { email: email.trim(), registered_at: new Date().toISOString() };

  const { data, error } = await supabase
    .from('waitlist')
    .insert(entry)
    .select()
    .single();
  if (error) throw new Error('[db] saveWaitlist error: ' + error.message);
  return data;
}
