-- Fix infinite recursion in RLS policies
-- Drop old list_members policies that cause recursion
DROP POLICY IF EXISTS "list_members_select" ON list_members;
DROP POLICY IF EXISTS "list_members_insert" ON list_members;
DROP POLICY IF EXISTS "list_members_delete" ON list_members;

-- Disable RLS on list_members to avoid recursion during list creation
ALTER TABLE list_members DISABLE ROW LEVEL SECURITY;

-- Drop and recreate lists policies without list_members reference
DROP POLICY IF EXISTS "lists_select" ON lists;
DROP POLICY IF EXISTS "lists_update" ON lists;

-- New lists policies (without list_members reference)
CREATE POLICY "lists_select" ON lists FOR SELECT USING (
  owner_id = auth.uid() OR
  visibility IN ('link_read', 'link_write') OR
  owner_id IS NULL
);

CREATE POLICY "lists_update" ON lists FOR UPDATE 
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Drop and recreate items policies without list_members reference
DROP POLICY IF EXISTS "items_select" ON items;
DROP POLICY IF EXISTS "items_insert" ON items;
DROP POLICY IF EXISTS "items_update" ON items;
DROP POLICY IF EXISTS "items_delete" ON items;

CREATE POLICY "items_select" ON items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM lists WHERE lists.id = items.list_id AND (
      lists.owner_id = auth.uid() OR
      lists.visibility IN ('link_read', 'link_write') OR
      lists.owner_id IS NULL
    )
  )
);

CREATE POLICY "items_insert" ON items FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM lists WHERE lists.id = items.list_id AND (
      lists.owner_id = auth.uid() OR
      lists.visibility = 'link_write' OR
      lists.owner_id IS NULL
    )
  )
);

CREATE POLICY "items_update" ON items FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM lists WHERE lists.id = items.list_id AND (
      lists.owner_id = auth.uid() OR
      lists.visibility = 'link_write' OR
      lists.owner_id IS NULL
    )
  )
);

CREATE POLICY "items_delete" ON items FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM lists WHERE lists.id = items.list_id AND (
      lists.owner_id = auth.uid() OR
      lists.visibility = 'link_write' OR
      lists.owner_id IS NULL
    )
  )
);
