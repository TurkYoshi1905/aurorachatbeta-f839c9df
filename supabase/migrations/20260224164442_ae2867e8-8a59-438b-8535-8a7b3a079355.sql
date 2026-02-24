
-- Server members table to track who joined which server
CREATE TABLE public.server_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  server_id UUID NOT NULL REFERENCES public.servers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(server_id, user_id)
);

ALTER TABLE public.server_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members viewable by authenticated" ON public.server_members FOR SELECT USING (true);
CREATE POLICY "Users can join servers" ON public.server_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave servers" ON public.server_members FOR DELETE USING (auth.uid() = user_id);

-- Server invites table
CREATE TABLE public.server_invites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  server_id UUID NOT NULL REFERENCES public.servers(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  max_uses INTEGER DEFAULT NULL,
  uses INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE public.server_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Invites viewable by authenticated" ON public.server_invites FOR SELECT USING (true);
CREATE POLICY "Server owners can create invites" ON public.server_invites FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM servers WHERE servers.id = server_invites.server_id AND servers.owner_id = auth.uid())
);
CREATE POLICY "Server owners can delete invites" ON public.server_invites FOR DELETE USING (
  EXISTS (SELECT 1 FROM servers WHERE servers.id = server_invites.server_id AND servers.owner_id = auth.uid())
);

-- Auto-add server owner as member when creating a server
CREATE OR REPLACE FUNCTION public.auto_add_owner_as_member()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.owner_id IS NOT NULL THEN
    INSERT INTO public.server_members (server_id, user_id) VALUES (NEW.id, NEW.owner_id) ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_server_created_add_owner
  AFTER INSERT ON public.servers
  FOR EACH ROW EXECUTE FUNCTION public.auto_add_owner_as_member();

-- Backfill existing server owners as members
INSERT INTO public.server_members (server_id, user_id)
SELECT id, owner_id FROM public.servers WHERE owner_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Enable realtime for server_members
ALTER PUBLICATION supabase_realtime ADD TABLE public.server_members;
