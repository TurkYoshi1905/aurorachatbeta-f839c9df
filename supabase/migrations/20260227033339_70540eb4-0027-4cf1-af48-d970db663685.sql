-- Drop the old restrictive delete policy and the new one, replace with a single permissive one
DROP POLICY IF EXISTS "Users can leave servers" ON public.server_members;
DROP POLICY IF EXISTS "Server owners can kick members" ON public.server_members;

CREATE POLICY "Users can leave or owners can kick"
ON public.server_members
FOR DELETE
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM servers WHERE servers.id = server_members.server_id AND servers.owner_id = auth.uid()
  )
);