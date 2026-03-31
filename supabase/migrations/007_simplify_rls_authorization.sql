-- Disable RLS on lists table - handle authorization at application layer
-- This avoids infinite recursion issues and is cleaner for complex logic

ALTER TABLE lists DISABLE ROW LEVEL SECURITY;

-- Keep RLS only on items (items still need RLS based on list visibility)
-- But simplify the items policies to avoid cross-table references
DROP POLICY IF EXISTS "items_select" ON items;
DROP POLICY IF EXISTS "items_insert" ON items;
DROP POLICY IF EXISTS "items_update" ON items;
DROP POLICY IF EXISTS "items_delete" ON items;

-- For items, we allow everything - authorization is handled by selecting lists with RLS or checking server-side
-- Since we're disabling lists RLS, items also just allows everything (same approach)
CREATE POLICY "items_allow_all_select" ON items FOR SELECT USING (true);
CREATE POLICY "items_allow_all_insert" ON items FOR INSERT WITH CHECK (true);
CREATE POLICY "items_allow_all_update" ON items FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "items_allow_all_delete" ON items FOR DELETE USING (true);

-- Note: Authorization is now handled entirely at the application layer in server actions:
-- - updateListVisibility: checks owner_id server-side
-- - addListMember: checks owner_id server-side
-- - createList: checks user is logged in
-- - deleteList: checks owner_id server-side
-- This avoids complex RLS policies and prevents infinite recursion issues
