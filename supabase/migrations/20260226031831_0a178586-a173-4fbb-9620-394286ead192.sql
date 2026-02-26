-- Enable realtime for servers table so settings changes propagate
ALTER PUBLICATION supabase_realtime ADD TABLE public.servers;