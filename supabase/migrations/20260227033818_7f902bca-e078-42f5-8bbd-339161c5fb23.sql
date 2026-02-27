-- Allow users to delete their own messages (existing policy only allows server owners)
CREATE POLICY "Users can delete own messages"
ON public.messages
FOR DELETE
USING (auth.uid() = user_id);