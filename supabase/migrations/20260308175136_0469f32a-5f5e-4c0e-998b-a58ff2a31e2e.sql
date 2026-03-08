
-- Add is_locked column to channels
ALTER TABLE public.channels ADD COLUMN IF NOT EXISTS is_locked boolean NOT NULL DEFAULT false;

-- Add timeout_until column to server_members
ALTER TABLE public.server_members ADD COLUMN IF NOT EXISTS timeout_until timestamptz DEFAULT NULL;

-- Allow updating server_members (for timeout)
CREATE POLICY "Server owners can update members"
ON public.server_members
FOR UPDATE
USING (EXISTS (SELECT 1 FROM servers WHERE servers.id = server_members.server_id AND servers.owner_id = auth.uid()));

-- Create server_bans table
CREATE TABLE public.server_bans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id uuid NOT NULL REFERENCES public.servers(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  banned_by uuid NOT NULL,
  reason text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(server_id, user_id)
);

ALTER TABLE public.server_bans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Bans viewable by server members"
ON public.server_bans FOR SELECT
USING (EXISTS (SELECT 1 FROM server_members WHERE server_members.server_id = server_bans.server_id AND server_members.user_id = auth.uid()));

CREATE POLICY "Server owners can ban"
ON public.server_bans FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM servers WHERE servers.id = server_bans.server_id AND servers.owner_id = auth.uid()));

CREATE POLICY "Server owners can unban"
ON public.server_bans FOR DELETE
USING (EXISTS (SELECT 1 FROM servers WHERE servers.id = server_bans.server_id AND servers.owner_id = auth.uid()));
