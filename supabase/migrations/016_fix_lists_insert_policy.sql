-- Fix lists_insert policy to work with authenticated server-side inserts
-- The current policy requires auth.uid() = owner_id, but during signup
-- or when creating lists, the auth context might not be properly set

DROP POLICY IF EXISTS "lists_insert" ON lists;

-- New policy: Allow insert if:
-- 1. User is authenticated AND owner_id matches their auth.uid(), OR
-- 2. List is unclaimed (owner_id IS NULL)
-- Note: We use (true) temporarily to debug, then restrict
CREATE POLICY "lists_insert" ON lists
  FOR INSERT
  WITH CHECK (
    owner_id IS NULL  -- Allow unclaimed lists
    OR (auth.uid() IS NOT NULL AND owner_id = auth.uid())  -- Allow own lists
  );

-- Also check if there are any other restrictive policies
-- that might be blocking the insert
