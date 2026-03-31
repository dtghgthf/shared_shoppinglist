-- Add email column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Update existing profiles with email from auth.users (run once)
-- Note: This requires a database function to access auth.users safely
-- For now, new signups will populate this on profile creation
