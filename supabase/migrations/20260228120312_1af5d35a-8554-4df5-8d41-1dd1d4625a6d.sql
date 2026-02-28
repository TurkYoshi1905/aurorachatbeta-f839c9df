
-- Add updated_at column to messages
ALTER TABLE public.messages ADD COLUMN updated_at timestamp with time zone DEFAULT NULL;

-- Allow users to update their own messages
CREATE POLICY "Users can update own messages"
ON public.messages
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
