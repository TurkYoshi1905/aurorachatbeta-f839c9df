
-- Create server_emojis table
CREATE TABLE public.server_emojis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id uuid NOT NULL REFERENCES public.servers(id) ON DELETE CASCADE,
  name text NOT NULL,
  image_url text NOT NULL,
  uploaded_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(server_id, name)
);

-- Enable RLS
ALTER TABLE public.server_emojis ENABLE ROW LEVEL SECURITY;

-- RLS: Server members can view emojis
CREATE POLICY "Server emojis viewable by server members"
ON public.server_emojis FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM server_members
  WHERE server_members.server_id = server_emojis.server_id
  AND server_members.user_id = auth.uid()
));

-- RLS: Server owners can insert emojis
CREATE POLICY "Server owners can create emojis"
ON public.server_emojis FOR INSERT
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM servers
  WHERE servers.id = server_emojis.server_id
  AND servers.owner_id = auth.uid()
));

-- RLS: Server owners can delete emojis
CREATE POLICY "Server owners can delete emojis"
ON public.server_emojis FOR DELETE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM servers
  WHERE servers.id = server_emojis.server_id
  AND servers.owner_id = auth.uid()
));

-- RLS: Server owners can update emojis
CREATE POLICY "Server owners can update emojis"
ON public.server_emojis FOR UPDATE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM servers
  WHERE servers.id = server_emojis.server_id
  AND servers.owner_id = auth.uid()
));
