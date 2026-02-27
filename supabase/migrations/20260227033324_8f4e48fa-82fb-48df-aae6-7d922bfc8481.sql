-- Allow server owners to delete channels
CREATE POLICY "Server owners can delete channels"
ON public.channels
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM servers WHERE servers.id = channels.server_id AND servers.owner_id = auth.uid()
));

-- Allow server owners to delete messages in their server
CREATE POLICY "Server owners can delete messages"
ON public.messages
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM servers WHERE servers.id = messages.server_id AND servers.owner_id = auth.uid()
));

-- Allow server owners to kick members
CREATE POLICY "Server owners can kick members"
ON public.server_members
FOR DELETE
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM servers WHERE servers.id = server_members.server_id AND servers.owner_id = auth.uid()
  )
);