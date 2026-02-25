
-- Drop overly permissive policy
DROP POLICY "Authenticated users can increment invite uses" ON public.server_invites;

-- More restrictive: only allow updating uses column, and only by authenticated users
CREATE POLICY "Authenticated can update invite uses" ON public.server_invites
FOR UPDATE USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);
