-- =============================================================
-- Tjesa — Supabase Schema Setup
-- Run this ONCE in your Supabase SQL Editor
-- =============================================================

-- 1. Create tables
create table if not exists accounts (
  workspace_id text primary key,
  workspace_name text,
  workspace_icon text,
  access_token text not null,
  bot_id text,
  owner jsonb,
  tool text,
  connected_at timestamptz default now()
);

create table if not exists configs (
  id text primary key,
  workspace_id text not null,
  database_id text,
  database_name text,
  tool text,
  settings jsonb,
  last_sync timestamptz,
  last_sync_success_count int default 0,
  last_sync_total_count int default 0,
  active boolean default true
);

create table if not exists waitlist (
  id bigserial primary key,
  email text unique not null,
  registered_at timestamptz default now()
);

-- 2. Disable RLS (we use server-side access only, not user auth)
alter table accounts disable row level security;
alter table configs disable row level security;
alter table waitlist disable row level security;

-- 3. Create UTM links tracking table
create table if not exists utm_links (
  id text primary key,
  url text not null,
  utm_source text not null,
  utm_medium text not null,
  utm_campaign text not null,
  utm_term text,
  utm_content text,
  created_at timestamptz default now()
);
alter table utm_links disable row level security;

-- 4. Update waitlist schema to support status and invited_at
alter table waitlist add column if not exists status text default 'pending';
alter table waitlist add column if not exists invited_at timestamptz;


