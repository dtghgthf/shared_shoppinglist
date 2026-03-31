-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
-- DO NOT enable RLS on list_members yet - causes infinite recursion

-- Profiles: Users can read all profiles, but only update their own
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Lists: Owner can do everything, members based on role, public based on visibility
CREATE POLICY "lists_select" ON lists FOR SELECT USING (
  owner_id = auth.uid() OR
  visibility IN ('link_read', 'link_write') OR
  owner_id IS NULL -- Allow access to unclaimed lists
);

CREATE POLICY "lists_insert" ON lists FOR INSERT WITH CHECK (
  owner_id = auth.uid() OR owner_id IS NULL
);

CREATE POLICY "lists_update" ON lists FOR UPDATE USING (
  owner_id = auth.uid()
);

CREATE POLICY "lists_delete" ON lists FOR DELETE USING (
  owner_id = auth.uid()
);

-- Items: Based on list access
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

-- Add realtime to new tables
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE list_members;
