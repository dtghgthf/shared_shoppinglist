-- Fix lists_update policy - add WITH CHECK clause
DROP POLICY IF EXISTS "lists_update" ON lists;

CREATE POLICY "lists_update" ON lists FOR UPDATE 
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());
