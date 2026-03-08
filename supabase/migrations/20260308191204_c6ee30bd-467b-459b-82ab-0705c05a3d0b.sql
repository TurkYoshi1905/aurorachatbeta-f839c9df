ALTER TABLE public.messages ADD COLUMN reply_to uuid REFERENCES public.messages(id) ON DELETE SET NULL;
ALTER TABLE public.messages ADD COLUMN is_pinned boolean NOT NULL DEFAULT false;

-- Allow server owners to update is_pinned on any message
CREATE POLICY "Server owners can update message pins"
ON public.messages
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM servers WHERE servers.id = messages.server_id AND servers.owner_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM servers WHERE servers.id = messages.server_id AND servers.owner_id = auth.uid()
));