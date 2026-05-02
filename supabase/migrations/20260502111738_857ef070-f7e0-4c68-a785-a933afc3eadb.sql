ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS admin_hash_1 text,
  ADD COLUMN IF NOT EXISTS admin_hash_2 text,
  ADD COLUMN IF NOT EXISTS admin_hash_3 text;