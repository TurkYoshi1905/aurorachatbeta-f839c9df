
-- Add ON DELETE CASCADE to channels.server_id
ALTER TABLE public.channels DROP CONSTRAINT IF EXISTS channels_server_id_fkey;
ALTER TABLE public.channels ADD CONSTRAINT channels_server_id_fkey FOREIGN KEY (server_id) REFERENCES public.servers(id) ON DELETE CASCADE;

-- Add ON DELETE CASCADE to messages.server_id
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_server_id_fkey;
ALTER TABLE public.messages ADD CONSTRAINT messages_server_id_fkey FOREIGN KEY (server_id) REFERENCES public.servers(id) ON DELETE CASCADE;

-- Add ON DELETE CASCADE to messages.channel_id
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_channel_id_fkey;
ALTER TABLE public.messages ADD CONSTRAINT messages_channel_id_fkey FOREIGN KEY (channel_id) REFERENCES public.channels(id) ON DELETE CASCADE;

-- Add ON DELETE CASCADE to server_members.server_id
ALTER TABLE public.server_members DROP CONSTRAINT IF EXISTS server_members_server_id_fkey;
ALTER TABLE public.server_members ADD CONSTRAINT server_members_server_id_fkey FOREIGN KEY (server_id) REFERENCES public.servers(id) ON DELETE CASCADE;

-- Add ON DELETE CASCADE to server_invites.server_id
ALTER TABLE public.server_invites DROP CONSTRAINT IF EXISTS server_invites_server_id_fkey;
ALTER TABLE public.server_invites ADD CONSTRAINT server_invites_server_id_fkey FOREIGN KEY (server_id) REFERENCES public.servers(id) ON DELETE CASCADE;

-- Add ON DELETE CASCADE to message_reactions.message_id
ALTER TABLE public.message_reactions DROP CONSTRAINT IF EXISTS message_reactions_message_id_fkey;
ALTER TABLE public.message_reactions ADD CONSTRAINT message_reactions_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.messages(id) ON DELETE CASCADE;
