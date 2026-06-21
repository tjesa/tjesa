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

-- 5. Create Pageview Aggregates tracking table
create table if not exists pageview_aggregates (
  id bigserial primary key,
  date date not null default current_date,
  referrer text not null default 'Direct / Organic',
  utm_source text not null default '',
  utm_medium text not null default '',
  utm_campaign text not null default '',
  country text not null default 'Unknown',
  views int not null default 1,
  unique (date, referrer, utm_source, utm_medium, utm_campaign, country)
);
alter table pageview_aggregates disable row level security;

-- 6. Update waitlist schema to support name, excited_tool, UTM fields, and referrer
alter table waitlist add column if not exists name text;
alter table waitlist add column if not exists excited_tool text;
alter table waitlist add column if not exists utm_source text default '';
alter table waitlist add column if not exists utm_medium text default '';
alter table waitlist add column if not exists utm_campaign text default '';
alter table waitlist add column if not exists referrer text default 'Direct / Organic';

-- 7. Add title column to utm_links
alter table utm_links add column if not exists title text;

-- 8. Create feedback table and disable RLS
create table if not exists feedback (
  id text primary key,
  user_id uuid,
  user_email text not null,
  category text not null,
  subject text not null,
  message text not null,
  status text default 'open',
  priority text default 'medium',
  admin_notes text default '',
  resolved_at timestamptz,
  updated_at timestamptz default now(),
  submitted_at timestamptz default now(),
  votes int default 0
);
alter table feedback disable row level security;




