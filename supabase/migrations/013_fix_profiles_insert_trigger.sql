-- Fix: Trigger needs to bypass RLS or use service role
-- The issue is that auth.uid() is not available during signup trigger execution
-- Solution: Drop the restrictive insert policy and rely on SECURITY DEFINER trigger

-- First, disable the restrictive insert policy (trigger handles profile creation)
DROP POLICY IF EXISTS "profiles_insert" ON profiles;

-- Alternative: Create a less restrictive policy that allows the trigger to work
-- The trigger runs with elevated privileges, but RLS policies still apply
-- We need to either:
-- 1. Allow inserts when auth.uid() IS NULL (during signup)
-- 2. Or skip RLS entirely for the service role

-- Option 1: Allow inserts when user is not yet authenticated (trigger context)
CREATE POLICY "profiles_insert" ON profiles
  FOR INSERT
  WITH CHECK (
    auth.uid() = id
    OR auth.uid() IS NULL  -- Allow during signup trigger
  );

-- Verify trigger is still in place
-- The trigger should auto-create profiles on signup
