-- Migration: Fix users.id type and ensure foreign key relationships work
-- This is a simplified migration that assumes the Supabase database 
-- already has the users table with UUID ids created by Supabase Auth

-- Step 1: Force reload the PostgREST schema cache
-- This ensures that relationships are detected properly
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

-- If you need to recreate the users table with UUID type:
-- NOTE: Only run this if you're setting up a fresh database!

-- For existing databases, you may need to:
-- 1. Export your data
-- 2. Drop and recreate the users table with UUID primary key
-- 3. Re-import your data

-- The key fix is ensuring the users table id column is of type UUID
-- Example (destructive - backup first!):
-- ALTER TABLE users ALTER COLUMN id TYPE UUID USING id::uuid;

-- To verify your schema, run:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users';

