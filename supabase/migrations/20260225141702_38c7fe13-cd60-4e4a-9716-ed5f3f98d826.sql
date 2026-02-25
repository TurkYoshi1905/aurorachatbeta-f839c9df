
-- Drop old permissive SELECT policies
DROP POLICY "Servers are viewable by authenticated users" ON public.servers;
DROP POLICY "Channels are viewable by authenticated users" ON public.channels;
DROP POLICY "Messages are viewable by authenticated users" ON public.messages;

-- Servers: only visible to members
CREATE POLICY "Servers viewable by members"
ON public.servers FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.server_members
    WHERE server_members.server_id = servers.id
      AND server_members.user_id = auth.uid()
  )
);

-- Channels: only visible to server members
CREATE POLICY "Channels viewable by server members"
ON public.channels FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.server_members
    WHERE server_members.server_id = channels.server_id
      AND server_members.user_id = auth.uid()
  )
);

-- Messages: only visible to server members
CREATE POLICY "Messages viewable by server members"
ON public.messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.server_members
    WHERE server_members.server_id = messages.server_id
      AND server_members.user_id = auth.uid()
  )
);
