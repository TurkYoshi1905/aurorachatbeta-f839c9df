-- Fix: DELETE events need all columns for proper realtime handling
ALTER TABLE public.message_reactions REPLICA IDENTITY FULL;
ALTER TABLE public.direct_messages REPLICA IDENTITY FULL;

-- Also add messages table to realtime publication (was missing)
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER TABLE public.messages REPLICA IDENTITY FULL;