-- Add start_date column to track official challenge start day
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS start_date date;

-- Backfill existing plans with their creation date
UPDATE public.plans SET start_date = created_at::date WHERE start_date IS NULL;
