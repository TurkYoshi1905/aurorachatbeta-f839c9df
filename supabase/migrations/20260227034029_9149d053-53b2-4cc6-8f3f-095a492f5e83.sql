-- Enable replica identity full for messages so DELETE events include the old row data
ALTER TABLE public.messages REPLICA IDENTITY FULL;