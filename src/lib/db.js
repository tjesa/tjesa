import fs from 'fs/promises';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'db.json');

function migrateConfig(cfg) {
  if (cfg && !cfg.tool) {
    return {
      id: cfg.id,
      workspace_id: cfg.workspace_id,
      database_id: cfg.database_id,
      database_name: cfg.database_name,
      tool: 'qr_generator',
      settings: {
        source_column: cfg.source_column || '',
        target_column: cfg.target_column || '',
        trigger_type: cfg.trigger_type || 'full',
        trigger_column: cfg.trigger_column || '',
        trigger_value: cfg.trigger_value || ''
      },
      last_sync: cfg.last_sync || null,
      last_sync_success_count: cfg.last_sync_success_count || 0,
      last_sync_total_count: cfg.last_sync_total_count || 0,
      active: cfg.active !== undefined ? cfg.active : true
    };
  }
  return cfg;
}

async function readDb() {
  try {
    const data = await fs.readFile(DB_PATH, 'utf-8');
    const parsed = JSON.parse(data);
    if (parsed.configs) {
      parsed.configs = parsed.configs.map(migrateConfig);
    }
    return parsed;
  } catch (error) {
    // If file doesn't exist, return empty collections
    return { accounts: [], configs: [] };
  }
}

async function writeDb(data) {
  await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * Get all accounts
 */
export async function getAccounts() {
  const db = await readDb();
  return db.accounts;
}

/**
 * Save or update an account (identified by workspace_id)
 */
export async function saveAccount(account) {
  const db = await readDb();
  const index = db.accounts.findIndex(a => a.workspace_id === account.workspace_id);
  if (index >= 0) {
    db.accounts[index] = { ...db.accounts[index], ...account };
  } else {
    db.accounts.push(account);
  }
  await writeDb(db);
  return account;
}

/**
 * Retrieve a specific account by workspace ID
 */
export async function getAccount(workspaceId) {
  const db = await readDb();
  return db.accounts.find(a => a.workspace_id === workspaceId);
}

/**
 * Retrieve any account that matches or starts with the workspace ID
 */
export async function getAnyAccountForWorkspace(workspaceId) {
  const db = await readDb();
  return db.accounts.find(a => a.workspace_id === workspaceId || a.workspace_id.startsWith(workspaceId + '_'));
}

/**
 * Get all configurations for a workspace
 */
export async function getConfigs(workspaceId) {
  const db = await readDb();
  return db.configs.filter(c => c.workspace_id === workspaceId);
}

/**
 * Save or update a database synchronization config
 */
export async function saveConfig(config) {
  const db = await readDb();
  if (!config.id) {
    const existing = db.configs.find(c => 
      c.database_id === config.database_id && 
      c.workspace_id === config.workspace_id &&
      c.tool === config.tool
    );
    if (existing) {
      config.id = existing.id;
    } else {
      config.id = Math.random().toString(36).substring(2, 9);
    }
  }
  const index = db.configs.findIndex(c => c.id === config.id);
  if (index >= 0) {
    db.configs[index] = { ...db.configs[index], ...config };
  } else {
    db.configs.push(config);
  }
  await writeDb(db);
  return config;
}

/**
 * Delete a config
 */
export async function deleteConfig(id) {
  const db = await readDb();
  db.configs = db.configs.filter(c => c.id !== id);
  await writeDb(db);
}

/**
 * Retrieve a specific configuration by config ID
 */
export async function getConfig(id) {
  const db = await readDb();
  return db.configs.find(c => c.id === id);
}

/**
 * Save an email registration to the waitlist
 */
export async function saveWaitlist(email) {
  const db = await readDb();
  if (!db.waitlist) {
    db.waitlist = [];
  }
  const exists = db.waitlist.some(w => w.email.toLowerCase() === email.toLowerCase());
  if (exists) {
    throw new Error('Email already registered');
  }
  const entry = {
    email: email.trim(),
    registered_at: new Date().toISOString()
  };
  db.waitlist.push(entry);
  await writeDb(db);
  return entry;
}

