-- ============================================================
-- Daylon Database Schema Update
-- Migration: 00000000000002_add_timeline_months.sql
-- ============================================================

-- Add timeline_months column to public.plans table
alter table public.plans add column if not exists timeline_months integer;

-- Migrate existing data: if timeline_years is set, set timeline_months to timeline_years * 12
update public.plans
set timeline_months = timeline_years * 12
where timeline_years is not null and timeline_months is null;
