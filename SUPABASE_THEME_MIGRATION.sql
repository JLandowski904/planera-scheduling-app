-- Migration to add theme column to profiles table
-- Run this in your Supabase SQL Editor

-- Add theme column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS theme TEXT CHECK (theme IN ('light', 'dark'));

-- Set default theme to 'light' for existing users
UPDATE profiles 
SET theme = 'light' 
WHERE theme IS NULL;

-- Add comment
COMMENT ON COLUMN profiles.theme IS 'User theme preference: light or dark mode';

