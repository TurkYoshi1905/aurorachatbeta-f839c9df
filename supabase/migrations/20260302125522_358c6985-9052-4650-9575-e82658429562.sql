CREATE OR REPLACE FUNCTION public.get_server_by_invite_code(_code text)
RETURNS TABLE(id uuid, name text, icon text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT s.id, s.name, s.icon
  FROM servers s
  JOIN server_invites si ON si.server_id = s.id
  WHERE si.code = _code
    AND (si.expires_at IS NULL OR si.expires_at > now())
    AND (si.max_uses IS NULL OR si.uses < si.max_uses);
$$;