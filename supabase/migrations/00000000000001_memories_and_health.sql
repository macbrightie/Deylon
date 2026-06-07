-- ============================================================
-- Daylon Database Schema Update
-- Migration: 00000000000001_memories_and_health.sql
-- ============================================================

-- Add profile indicators directly to public.users table
alter table public.users add column if not exists profile_summary text;
alter table public.users add column if not exists tone_preference text default 'warm';
alter table public.users add column if not exists motivation_level text default 'medium';
alter table public.users add column if not exists display_name text;
alter table public.users add column if not exists username text;

-- ============================================================
-- TABLE: user_memories
-- ============================================================
create table if not exists public.user_memories (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references public.users(id) on delete cascade,
  memory_type         text not null check (memory_type in ('goal', 'fear', 'struggle', 'win', 'identity', 'schedule', 'blocker', 'why', 'preference')),
  content             text not null,
  importance          integer not null check (importance >= 1 and importance <= 5),
  sprint_day          integer not null,
  created_at          timestamptz default now(),
  last_referenced_at  timestamptz default now()
);

-- ============================================================
-- TABLE: health_scores
-- ============================================================
create table if not exists public.health_scores (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.users(id) on delete cascade,
  score           integer not null check (score >= 1 and score <= 10),
  status          text not null check (status in ('on-track', 'at-risk', 'falling-behind', 'disengaged')),
  recommendation  text not null check (recommendation in ('maintain', 'soften', 'reengage', 'restart-offer')),
  tone            text not null check (tone in ('celebratory', 'warm', 'honest', 'recovery')),
  sprint_day      integer not null,
  calculated_at   timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.user_memories enable row level security;
alter table public.health_scores enable row level security;

-- user_memories: own rows only
create policy "user_memories: self access"
  on public.user_memories for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- health_scores: own rows only
create policy "health_scores: self access"
  on public.health_scores for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- INDEXES
-- ============================================================
create index if not exists idx_user_memories_user_id on public.user_memories(user_id);
create index if not exists idx_user_memories_importance on public.user_memories(importance);
create index if not exists idx_health_scores_user_id on public.health_scores(user_id);
