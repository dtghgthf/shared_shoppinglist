-- Enable Realtime for Shopping List Tables with RLS
-- This migration ensures that realtime subscriptions work properly with Row Level Security (RLS)

-- Set REPLICA IDENTITY FULL for DELETE event support
-- This ensures DELETE events include the old row data which is required for RLS evaluation
ALTER TABLE items REPLICA IDENTITY FULL;
ALTER TABLE lists REPLICA IDENTITY FULL;
ALTER TABLE list_members REPLICA IDENTITY FULL;
ALTER TABLE profiles REPLICA IDENTITY FULL;

-- Ensure Realtime publication includes all tables
-- Use DO blocks to handle idempotency (tables may already be included)
DO $$ 
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE items;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ 
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE lists;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ 
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE list_members;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ 
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Comment explaining RLS with Realtime:
-- Supabase Realtime automatically respects RLS policies when:
-- 1. The client is authenticated (authenticated session with valid JWT)
-- 2. The subscription uses the authenticated client
-- 3. RLS policies are properly defined (already done in 002_rls_policies.sql)
--
-- When a realtime event occurs:
-- - The RLS policies are evaluated using the JWT claims
-- - Only events for rows the user can access will be delivered
-- - The subscription filter (e.g., list_id=eq.${listId}) is applied
-- - Combined with RLS, users only see events for items they have access to
--
-- Example in TypeScript:
-- const channel = supabase
--   .channel(`items:${listId}`)
--   .on('postgres_changes',
--     { event: '*', schema: 'public', table: 'items', filter: `list_id=eq.${listId}` },
--     (payload) => { /* handle event */ }
--   )
--   .subscribe();
