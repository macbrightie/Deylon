-- ============================================================
-- Daylon Database Schema
-- Migration: 00000000000000_init_schema.sql
-- Apply via: Supabase Dashboard → SQL Editor, or supabase db push
-- ============================================================

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ============================================================
-- TABLE: users
-- ============================================================
create table if not exists public.users (
  id                uuid primary key default gen_random_uuid(),
  email             text unique not null,
  created_at        timestamptz default now(),
  telegram_chat_id  bigint,
  timezone          text default 'Africa/Lagos',
  location          text,
  intensity         text default 'serious' check (intensity in ('steady', 'serious', 'all-in'))
);

-- ============================================================
-- TABLE: conversations
-- ============================================================
create table if not exists public.conversations (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.users(id) on delete cascade,
  messages          jsonb not null default '[]',
  extracted_profile jsonb,
  created_at        timestamptz default now(),
  completed         boolean default false
);

-- ============================================================
-- TABLE: plans
-- ============================================================
create table if not exists public.plans (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.users(id) on delete cascade,
  plan_data       jsonb not null,
  primary_goal    text,
  timeline_years  integer,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  version         integer default 1
);

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger plans_set_updated_at
  before update on public.plans
  for each row execute procedure public.set_updated_at();

-- ============================================================
-- TABLE: daily_cards
-- ============================================================
create table if not exists public.daily_cards (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.users(id) on delete cascade,
  plan_id         uuid not null references public.plans(id) on delete cascade,
  day_number      integer not null,
  task            text not null,
  duration        text,
  chain_to_sprint text,
  chain_to_goal   text,
  status          text default 'pending' check (status in ('pending', 'done', 'adjusted', 'partial')),
  revealed_at     timestamptz,
  completed_at    timestamptz
);

-- ============================================================
-- TABLE: sprint_progress
-- ============================================================
create table if not exists public.sprint_progress (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  day_number  integer not null,
  date        date not null,
  status      text check (status in ('done', 'grace', 'missed', 'pending')),
  note        text
);

-- ============================================================
-- TABLE: whys
-- ============================================================
create table if not exists public.whys (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null references public.users(id) on delete cascade,
  content   text not null,
  added_at  timestamptz default now()
);

-- ============================================================
-- TABLE: plan_updates
-- ============================================================
create table if not exists public.plan_updates (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.users(id) on delete cascade,
  update_text  text not null,
  created_at   timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.users enable row level security;
alter table public.conversations enable row level security;
alter table public.plans enable row level security;
alter table public.daily_cards enable row level security;
alter table public.sprint_progress enable row level security;
alter table public.whys enable row level security;
alter table public.plan_updates enable row level security;

-- users: can only read/update their own row
create policy "users: self access"
  on public.users for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- conversations: own rows only
create policy "conversations: self access"
  on public.conversations for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- plans: own rows only
create policy "plans: self access"
  on public.plans for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- daily_cards: own rows only
create policy "daily_cards: self access"
  on public.daily_cards for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- sprint_progress: own rows only
create policy "sprint_progress: self access"
  on public.sprint_progress for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- whys: own rows only
create policy "whys: self access"
  on public.whys for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- plan_updates: own rows only
create policy "plan_updates: self access"
  on public.plan_updates for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- INDEXES
-- ============================================================
create index if not exists idx_conversations_user_id on public.conversations(user_id);
create index if not exists idx_plans_user_id on public.plans(user_id);
create index if not exists idx_daily_cards_user_plan on public.daily_cards(user_id, plan_id);
create index if not exists idx_daily_cards_day_number on public.daily_cards(day_number);
create index if not exists idx_sprint_progress_user_day on public.sprint_progress(user_id, day_number);

-- ============================================================
-- TRIGGER: Sync auth.users to public.users on signup
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
