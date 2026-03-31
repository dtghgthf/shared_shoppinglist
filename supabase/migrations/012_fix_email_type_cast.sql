-- Fix email column type mismatch
CREATE OR REPLACE FUNCTION get_list_members_with_emails(p_list_id TEXT)
RETURNS TABLE(
  user_id UUID,
  role TEXT,
  joined_at TIMESTAMPTZ,
  display_name TEXT,
  avatar_url TEXT,
  email TEXT
) 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Get owner
  RETURN QUERY
  SELECT 
    l.owner_id,
    'owner'::TEXT,
    l.created_at,
    COALESCE(p.display_name, au.email::TEXT),
    p.avatar_url,
    au.email::TEXT
  FROM lists l
  LEFT JOIN profiles p ON l.owner_id = p.id
  LEFT JOIN auth.users au ON l.owner_id = au.id
  WHERE l.id = p_list_id AND l.owner_id IS NOT NULL;

  -- Get members
  RETURN QUERY
  SELECT 
    lm.user_id,
    lm.role,
    lm.joined_at,
    COALESCE(p.display_name, au.email::TEXT),
    p.avatar_url,
    au.email::TEXT
  FROM list_members lm
  LEFT JOIN profiles p ON lm.user_id = p.id
  LEFT JOIN auth.users au ON lm.user_id = au.id
  WHERE lm.list_id = p_list_id;
END;
$$ LANGUAGE plpgsql STABLE;
