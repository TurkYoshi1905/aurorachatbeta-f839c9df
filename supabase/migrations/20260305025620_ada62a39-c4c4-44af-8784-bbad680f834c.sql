
-- Add attachments column to messages table
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS attachments text[] DEFAULT NULL;

-- Add attachments column to direct_messages table
ALTER TABLE public.direct_messages ADD COLUMN IF NOT EXISTS attachments text[] DEFAULT NULL;

-- Create message_attachments storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('message_attachments', 'message_attachments', true) ON CONFLICT (id) DO NOTHING;

-- RLS for message_attachments bucket: authenticated users can upload
CREATE POLICY "Authenticated users can upload attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'message_attachments');

-- Anyone can view attachments (public bucket)
CREATE POLICY "Anyone can view attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'message_attachments');

-- Users can delete their own attachments
CREATE POLICY "Users can delete own attachments"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'message_attachments' AND (storage.foldername(name))[1] = auth.uid()::text);
