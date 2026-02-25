import { useState, useCallback, useEffect, useRef } from 'react';
import ServerSidebar from '@/components/ServerSidebar';
import ChannelList from '@/components/ChannelList';
import ChatArea from '@/components/ChatArea';
import MemberList from '@/components/MemberList';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';

export interface DbMessage {
  id: string;
  author: string;
  avatar: string;
  content: string;
  timestamp: string;
  isBot?: boolean;
}

export interface DbMember {
  id: string;
  name: string;
  avatar: string;
  status: 'online' | 'idle' | 'dnd' | 'offline';
  role?: string;
}

export interface DbChannel {
  id: string;
  name: string;
  type: 'text' | 'voice';
  position: number;
}

export interface DbServer {
  id: string;
  name: string;
  icon: string;
  owner_id: string | null;
  channels: DbChannel[];
}

type MobileView = 'channels' | 'chat' | 'members';

const Index = () => {
  const { profile, user } = useAuth();
  const isMobile = useIsMobile();
  const [servers, setServers] = useState<DbServer[]>([]);
  const [activeServer, setActiveServer] = useState<string>('');
  const [activeChannel, setActiveChannel] = useState<string>('');
  const [messages, setMessages] = useState<DbMessage[]>([]);
  const [showMembers, setShowMembers] = useState(true);
  const [members, setMembers] = useState<DbMember[]>([]);
  const [myStatus, setMyStatus] = useState<DbMember['status']>('online');
  const [mobileView, setMobileView] = useState<MobileView>('channels');
  const channelRef = useRef(activeChannel);
  const serverRef = useRef(activeServer);
  const presenceChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    channelRef.current = activeChannel;
    serverRef.current = activeServer;
  }, [activeChannel, activeServer]);

  const fetchServers = useCallback(async () => {
    const { data: serversData } = await supabase
      .from('servers')
      .select('*')
      .order('created_at', { ascending: true });

    const { data: channelsData } = await supabase
      .from('channels')
      .select('*')
      .order('position', { ascending: true });

    if (serversData && channelsData) {
      const mapped: DbServer[] = serversData.map((s) => ({
        id: s.id,
        name: s.name,
        icon: s.icon,
        owner_id: s.owner_id,
        channels: channelsData
          .filter((c) => c.server_id === s.id)
          .map((c) => ({
            id: c.id,
            name: c.name,
            type: c.type as 'text' | 'voice',
            position: c.position,
          })),
      }));
      setServers(mapped);
      if (!activeServer && mapped.length > 0) {
        setActiveServer(mapped[0].id);
        const firstChannel = mapped[0].channels[0];
        if (firstChannel) setActiveChannel(firstChannel.id);
      }
    }
  }, [activeServer]);

  useEffect(() => {
    fetchServers();
  }, []);

  useEffect(() => {
    const fetchMembers = async () => {
      const { data } = await supabase.from('profiles').select('*');
      if (data) {
        setMembers(
          data.map((p) => ({
            id: p.user_id,
            name: p.display_name,
            avatar: p.display_name?.charAt(0)?.toUpperCase() || '?',
            status: 'offline' as const,
          }))
        );
      }
    };
    fetchMembers();
  }, []);

  useEffect(() => {
    if (!activeServer || !activeChannel) return;
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('server_id', activeServer)
        .eq('channel_id', activeChannel)
        .order('created_at', { ascending: true });

      if (data) {
        setMessages(
          data.map((m) => ({
            id: m.id,
            author: m.author_name,
            avatar: m.author_name?.charAt(0)?.toUpperCase() || '?',
            content: m.content,
            timestamp: new Date(m.created_at).toLocaleTimeString('tr-TR', {
              hour: '2-digit',
              minute: '2-digit',
            }),
          }))
        );
      }
    };
    fetchMessages();
  }, [activeServer, activeChannel]);

  // Realtime messages
  useEffect(() => {
    const channel = supabase
      .channel('realtime-messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const m = payload.new as {
            id: string; server_id: string; channel_id: string;
            author_name: string; content: string; created_at: string;
          };
          if (m.server_id === serverRef.current && m.channel_id === channelRef.current) {
            setMessages((prev) => [
              ...prev,
              {
                id: m.id,
                author: m.author_name,
                avatar: m.author_name?.charAt(0)?.toUpperCase() || '?',
                content: m.content,
                timestamp: new Date(m.created_at).toLocaleTimeString('tr-TR', {
                  hour: '2-digit', minute: '2-digit',
                }),
              },
            ]);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Realtime channel changes
  useEffect(() => {
    const channel = supabase
      .channel('realtime-channels')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'channels' },
        () => {
          fetchServers();
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchServers]);

  useEffect(() => {
    if (!user) return;
    const presenceChannel = supabase.channel('presence-room', {
      config: { presence: { key: user.id } },
    });
    presenceChannelRef.current = presenceChannel;

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState<{ display_name: string; status: DbMember['status'] }>();
        const presenceMap = new Map<string, DbMember['status']>();
        for (const [userId, presences] of Object.entries(state)) {
          const latest = presences[presences.length - 1];
          presenceMap.set(userId, latest?.status || 'online');
        }
        setMembers((prev) =>
          prev.map((m) => ({
            ...m,
            status: presenceMap.has(m.id) ? (presenceMap.get(m.id) as DbMember['status']) : 'offline',
          }))
        );
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            display_name: profile?.display_name || 'Kullanıcı',
            status: myStatus,
          });
        }
      });

    return () => {
      presenceChannelRef.current = null;
      supabase.removeChannel(presenceChannel);
    };
  }, [user, profile]);

  useEffect(() => {
    if (!presenceChannelRef.current || !user) return;
    presenceChannelRef.current.track({
      display_name: profile?.display_name || 'Kullanıcı',
      status: myStatus,
    });
    setMembers((prev) =>
      prev.map((m) => (m.id === user.id ? { ...m, status: myStatus } : m))
    );
  }, [myStatus]);

  const server = servers.find((s) => s.id === activeServer) || servers[0];
  const channel = server?.channels.find((c) => c.id === activeChannel) || server?.channels[0];
  const isOwner = server?.owner_id === user?.id;

  const handleServerChange = useCallback((id: string) => {
    if (id === 'home') return;
    const s = servers.find((s) => s.id === id);
    if (s) {
      setActiveServer(id);
      const firstChannel = s.channels[0];
      if (firstChannel) setActiveChannel(firstChannel.id);
    }
  }, [servers]);

  const handleServerCreated = useCallback(async () => {
    const { data: serversData } = await supabase
      .from('servers')
      .select('*')
      .order('created_at', { ascending: true });
    const { data: channelsData } = await supabase
      .from('channels')
      .select('*')
      .order('position', { ascending: true });
    if (serversData && channelsData) {
      const mapped: DbServer[] = serversData.map((s) => ({
        id: s.id,
        name: s.name,
        icon: s.icon,
        owner_id: s.owner_id,
        channels: channelsData
          .filter((c) => c.server_id === s.id)
          .map((c) => ({ id: c.id, name: c.name, type: c.type as 'text' | 'voice', position: c.position })),
      }));
      setServers(mapped);
      const last = mapped[mapped.length - 1];
      if (last) {
        setActiveServer(last.id);
        const firstCh = last.channels[0];
        if (firstCh) setActiveChannel(firstCh.id);
      }
    }
  }, []);

  const handleChannelChange = useCallback((id: string) => {
    setActiveChannel(id);
    if (isMobile) setMobileView('chat');
  }, [isMobile]);

  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!user || !profile) return;
      await supabase.from('messages').insert({
        server_id: activeServer,
        channel_id: activeChannel,
        user_id: user.id,
        author_name: profile.display_name,
        content,
      });
    },
    [user, profile, activeServer, activeChannel]
  );

  if (servers.length === 0) {
    return (
      <div className="h-screen flex overflow-hidden">
        <ServerSidebar activeServer={activeServer} onServerChange={handleServerChange} servers={servers} onServerCreated={handleServerCreated} />
        <div className="flex-1 flex items-center justify-center bg-background">
          <div className="text-center space-y-3">
            <p className="text-xl font-semibold text-foreground">Henüz bir sunucun yok!</p>
            <p className="text-muted-foreground text-sm">Sol taraftaki + butonuna basarak ilk sunucunu oluştur.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!server || !channel) {
    return (
      <div className="h-screen flex items-center justify-center bg-background text-muted-foreground">
        Yükleniyor...
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="h-screen flex flex-col overflow-hidden">
        {mobileView === 'channels' && (
          <div className="flex h-full">
            <ServerSidebar activeServer={activeServer} onServerChange={handleServerChange} servers={servers} onServerCreated={handleServerCreated} />
            <ChannelList
              serverName={server.name}
              serverId={server.id}
              channels={server.channels}
              activeChannel={activeChannel}
              onChannelChange={handleChannelChange}
              currentUserStatus={myStatus}
              onStatusChange={setMyStatus}
              isOwner={isOwner}
              onChannelCreated={fetchServers}
              isMobile
            />
          </div>
        )}
        {mobileView === 'chat' && (
          <ChatArea
            channelName={channel.name}
            messages={messages}
            onSendMessage={handleSendMessage}
            onToggleMembers={() => setMobileView('members')}
            showMembers={false}
            isMobile
            onBack={() => setMobileView('channels')}
          />
        )}
        {mobileView === 'members' && (
          <MemberList members={members} isMobile onBack={() => setMobileView('chat')} />
        )}
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden">
      <ServerSidebar activeServer={activeServer} onServerChange={handleServerChange} servers={servers} onServerCreated={handleServerCreated} />
      <ChannelList
        serverName={server.name}
        serverId={server.id}
        channels={server.channels}
        activeChannel={activeChannel}
        onChannelChange={handleChannelChange}
        currentUserStatus={myStatus}
        onStatusChange={setMyStatus}
        isOwner={isOwner}
        onChannelCreated={fetchServers}
      />
      <ChatArea
        channelName={channel.name}
        messages={messages}
        onSendMessage={handleSendMessage}
        onToggleMembers={() => setShowMembers((p) => !p)}
        showMembers={showMembers}
      />
      {showMembers && <MemberList members={members} />}
    </div>
  );
};

export default Index;
