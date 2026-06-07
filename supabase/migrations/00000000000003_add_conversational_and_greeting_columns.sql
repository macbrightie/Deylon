-- ============================================================
-- Daylon Database Schema Update
-- Migration: 00000000000003_add_conversational_and_greeting_columns.sql
-- ============================================================

-- Add preferred_greeting and telegram_linking_state to public.users
alter table public.users add column if not exists telegram_linking_state text default 'not_connected';
alter table public.users add column if not exists preferred_greeting text;
alter table public.users add column if not exists carry_over_count_this_week integer default 0;
alter table public.users add column if not exists carry_over_last_reset timestamptz default now();

-- Add social_chat_messages to public.daily_cards
alter table public.daily_cards add column if not exists social_chat_messages jsonb default '[]';
