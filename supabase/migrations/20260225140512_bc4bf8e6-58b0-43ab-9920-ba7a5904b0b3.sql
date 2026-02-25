
-- Allow authenticated users to update invite uses (for incrementing on join)
CREATE POLICY "Authenticated users can increment invite uses" ON public.server_invites
FOR UPDATE USING (true) WITH CHECK (true);
