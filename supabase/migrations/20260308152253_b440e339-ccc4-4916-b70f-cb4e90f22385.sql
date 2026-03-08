
-- 1. Create channel_categories table
CREATE TABLE public.channel_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id uuid NOT NULL REFERENCES public.servers(id) ON DELETE CASCADE,
  name text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.channel_categories ENABLE ROW LEVEL SECURITY;

-- RLS: Server members can view categories
CREATE POLICY "Categories viewable by server members"
ON public.channel_categories FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.server_members
  WHERE server_members.server_id = channel_categories.server_id
  AND server_members.user_id = auth.uid()
));

-- RLS: Server owners can create categories
CREATE POLICY "Server owners can create categories"
ON public.channel_categories FOR INSERT
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.servers
  WHERE servers.id = channel_categories.server_id
  AND servers.owner_id = auth.uid()
));

-- RLS: Server owners can update categories
CREATE POLICY "Server owners can update categories"
ON public.channel_categories FOR UPDATE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.servers
  WHERE servers.id = channel_categories.server_id
  AND servers.owner_id = auth.uid()
));

-- RLS: Server owners can delete categories
CREATE POLICY "Server owners can delete categories"
ON public.channel_categories FOR DELETE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.servers
  WHERE servers.id = channel_categories.server_id
  AND servers.owner_id = auth.uid()
));

-- 2. Add category_id to channels
ALTER TABLE public.channels ADD COLUMN category_id uuid REFERENCES public.channel_categories(id) ON DELETE SET NULL;

-- 3. Add UPDATE policy for channels (needed for drag-drop reordering)
CREATE POLICY "Server owners can update channels"
ON public.channels FOR UPDATE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.servers
  WHERE servers.id = channels.server_id
  AND servers.owner_id = auth.uid()
));
