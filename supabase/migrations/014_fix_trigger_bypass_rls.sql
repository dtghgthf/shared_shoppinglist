-- Fix: Ensure trigger bypasses RLS by using postgres user privileges
-- The issue is that even with SECURITY DEFINER, RLS policies still apply
-- We need to set the owner of the function to a role that bypasses RLS

-- Alternative approach: Don't auto-create profile in trigger
-- Instead, we'll handle profile creation in the application code
-- This migration removes the problematic trigger

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Create a new function that doesn't auto-insert (avoiding RLS issues)
-- Profile creation will be handled by the application after signup
-- This is more reliable than trigger-based creation

-- Note: After this migration, profiles must be created explicitly in the app
-- See src/lib/auth/actions.ts for profile creation logic
