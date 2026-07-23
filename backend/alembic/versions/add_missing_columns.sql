-- SQL Migration to add missing columns
-- This can be run directly against the PostgreSQL database

-- Add avatar_url column to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500) NULL;

-- Add quantity_unit column to food_donations table  
ALTER TABLE food_donations
ADD COLUMN IF NOT EXISTS quantity_unit VARCHAR(50) NOT NULL DEFAULT 'servings';

-- Update any existing rows that might not have quantity_unit
UPDATE food_donations 
SET quantity_unit = 'servings' 
WHERE quantity_unit IS NULL;
