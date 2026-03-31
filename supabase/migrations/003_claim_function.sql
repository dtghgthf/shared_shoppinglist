-- Function to claim an unclaimed list
CREATE OR REPLACE FUNCTION claim_list(p_list_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Try to claim the list (only if unclaimed)
  UPDATE lists
  SET owner_id = v_user_id
  WHERE id = p_list_id AND owner_id IS NULL;
  
  -- Check if update happened
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Add owner as member
  INSERT INTO list_members (list_id, user_id, role)
  VALUES (p_list_id, v_user_id, 'owner')
  ON CONFLICT (list_id, user_id) DO UPDATE SET role = 'owner';
  
  RETURN TRUE;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION claim_list(TEXT) TO authenticated;
