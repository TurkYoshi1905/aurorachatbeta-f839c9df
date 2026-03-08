
-- Thread system tables
CREATE TABLE public.threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  channel_id uuid NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  server_id uuid NOT NULL REFERENCES public.servers(id) ON DELETE CASCADE,
  name text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.thread_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.threads(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  author_name text NOT NULL,
  content text NOT NULL,
  attachments text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz
);

-- RLS for threads
ALTER TABLE public.threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thread_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Threads viewable by server members" ON public.threads
FOR SELECT USING (EXISTS (
  SELECT 1 FROM server_members WHERE server_members.server_id = threads.server_id AND server_members.user_id = auth.uid()
));

CREATE POLICY "Authenticated users can create threads" ON public.threads
FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Thread messages viewable by server members" ON public.thread_messages
FOR SELECT USING (EXISTS (
  SELECT 1 FROM threads t JOIN server_members sm ON sm.server_id = t.server_id
  WHERE t.id = thread_messages.thread_id AND sm.user_id = auth.uid()
));

CREATE POLICY "Authenticated users can send thread messages" ON public.thread_messages
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own thread messages" ON public.thread_messages
FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own thread messages" ON public.thread_messages
FOR DELETE USING (auth.uid() = user_id);

-- Realtime for thread messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.thread_messages;

-- Permissions column on server_roles
ALTER TABLE public.server_roles ADD COLUMN permissions jsonb NOT NULL DEFAULT '{}';

-- Profile enhancements
ALTER TABLE public.profiles ADD COLUMN bio text DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN banner_color text DEFAULT '#5865F2';
