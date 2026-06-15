-- ============================================================
-- Deylon Database Schema Update
-- Migration: 00000000000005_add_is_pro.sql
-- ============================================================

-- Add is_pro and starting_level to public.users table
alter table public.users add column if not exists is_pro boolean default false;
alter table public.users add column if not exists starting_level text default 'beginner';
