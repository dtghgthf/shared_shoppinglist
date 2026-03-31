-- Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add owner_id to lists table
ALTER TABLE lists ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id);

-- Add visibility settings to lists
ALTER TABLE lists ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'private';
-- visibility values: 'private', 'link_read', 'link_write'

-- List members table for sharing
CREATE TABLE IF NOT EXISTS list_members (
  list_id TEXT REFERENCES lists(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'viewer', -- 'viewer', 'editor', 'owner'
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (list_id, user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_list_members_user_id ON list_members(user_id);
CREATE INDEX IF NOT EXISTS idx_lists_owner_id ON lists(owner_id);

-- Trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Trigger to update updated_at on profiles
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
