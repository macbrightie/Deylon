-- Add whatsapp columns to users table
ALTER TABLE "public"."users" ADD COLUMN "whatsapp_number" text;
ALTER TABLE "public"."users" ADD COLUMN "whatsapp_linking_state" text DEFAULT 'none'::text;

-- Add index on whatsapp_number for fast lookups
CREATE INDEX IF NOT EXISTS users_whatsapp_number_idx ON public.users USING btree (whatsapp_number);
