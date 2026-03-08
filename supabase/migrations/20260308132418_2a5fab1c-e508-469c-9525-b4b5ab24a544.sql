
-- Server Roles table
CREATE TABLE public.server_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id uuid NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#99AAB5',
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.server_roles ENABLE ROW LEVEL SECURITY;

-- Server Member Roles junction table
CREATE TABLE public.server_member_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id uuid NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role_id uuid NOT NULL REFERENCES server_roles(id) ON DELETE CASCADE,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(server_id, user_id, role_id)
);
ALTER TABLE public.server_member_roles ENABLE ROW LEVEL SECURITY;

-- Audit Logs table
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id uuid NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  action text NOT NULL,
  target_type text,
  target_id text,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for server_roles
CREATE POLICY "Roles viewable by server members" ON public.server_roles FOR SELECT USING (
  EXISTS (SELECT 1 FROM server_members WHERE server_members.server_id = server_roles.server_id AND server_members.user_id = auth.uid())
);
CREATE POLICY "Server owners can manage roles" ON public.server_roles FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM servers WHERE servers.id = server_roles.server_id AND servers.owner_id = auth.uid())
);
CREATE POLICY "Server owners can update roles" ON public.server_roles FOR UPDATE USING (
  EXISTS (SELECT 1 FROM servers WHERE servers.id = server_roles.server_id AND servers.owner_id = auth.uid())
);
CREATE POLICY "Server owners can delete roles" ON public.server_roles FOR DELETE USING (
  EXISTS (SELECT 1 FROM servers WHERE servers.id = server_roles.server_id AND servers.owner_id = auth.uid())
);

-- RLS Policies for server_member_roles
CREATE POLICY "Member roles viewable by server members" ON public.server_member_roles FOR SELECT USING (
  EXISTS (SELECT 1 FROM server_members WHERE server_members.server_id = server_member_roles.server_id AND server_members.user_id = auth.uid())
);
CREATE POLICY "Server owners can assign roles" ON public.server_member_roles FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM servers WHERE servers.id = server_member_roles.server_id AND servers.owner_id = auth.uid())
);
CREATE POLICY "Server owners can remove role assignments" ON public.server_member_roles FOR DELETE USING (
  EXISTS (SELECT 1 FROM servers WHERE servers.id = server_member_roles.server_id AND servers.owner_id = auth.uid())
);

-- RLS Policies for audit_logs
CREATE POLICY "Audit logs viewable by server members" ON public.audit_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM server_members WHERE server_members.server_id = audit_logs.server_id AND server_members.user_id = auth.uid())
);
CREATE POLICY "Server members can insert audit logs" ON public.audit_logs FOR INSERT WITH CHECK (
  auth.uid() = user_id
);

-- Update server_invites policy: allow all members to create invites (not just owners)
DROP POLICY IF EXISTS "Server owners can create invites" ON public.server_invites;
CREATE POLICY "Server members can create invites" ON public.server_invites FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM server_members WHERE server_members.server_id = server_invites.server_id AND server_members.user_id = auth.uid())
  AND auth.uid() = created_by
);

-- Enable realtime for audit_logs
ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_logs;
