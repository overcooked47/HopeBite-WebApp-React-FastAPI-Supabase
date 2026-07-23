-- Add is_active and is_verified columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;

-- Force reload schema cache (not standard SQL, but Supabase instruction)
NOTIFY pgrst, 'reload config';
