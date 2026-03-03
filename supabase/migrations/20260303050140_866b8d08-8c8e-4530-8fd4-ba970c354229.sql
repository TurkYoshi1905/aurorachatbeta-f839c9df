
-- Add updated_at column to direct_messages
ALTER TABLE public.direct_messages ADD COLUMN updated_at timestamp with time zone;

-- UPDATE policy: only sender can edit their own messages
CREATE POLICY "Users can update own DMs"
ON public.direct_messages
FOR UPDATE
USING (auth.uid() = sender_id)
WITH CHECK (auth.uid() = sender_id);

-- DELETE policy: only sender can delete their own messages
CREATE POLICY "Users can delete own DMs"
ON public.direct_messages
FOR DELETE
USING (auth.uid() = sender_id);

-- Trigger to auto-set updated_at on update
CREATE TRIGGER update_direct_messages_updated_at
BEFORE UPDATE ON public.direct_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
