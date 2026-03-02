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
  avatarUrl?: string | null;
  userId: string;
  content: string;
  timestamp: string;
  isBot?: boolean;
  edited?: boolean;
}

export interface DbReaction {
  emoji: string;
  userIds: string[];
  count: number;
}

const formatTimestamp = (dateStr: string) => {
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hour = String(d.getHours()).padStart(2, '0');
  const minute = String(d.getMinutes()).padStart(2, '0');
  return `${day}.${month}.${year} ${hour}:${minute}`;
};

export interface DbMember {
  id: string;
  name: string;
  avatar: string;
  avatarUrl?: string | null;
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
  const [reactions, setReactions] = useState<Record<string, DbReaction[]>>({});
  const channelRef = useRef(activeChannel);
  const serverRef = useRef(activeServer);
  const presenceChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const presenceStatusRef = useRef<Map<string, DbMember['status']>>(new Map());

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

  const fetchMembers = useCallback(async () => {
    if (!activeServer) return;
    const { data: memberRows } = await supabase
      .from('server_members')
      .select('user_id')
      .eq('server_id', activeServer);
    if (!memberRows) return;
    const userIds = memberRows.map((m) => m.user_id);
    if (userIds.length === 0) { setMembers([]); return; }
    const { data } = await supabase.from('profiles').select('*').in('user_id', userIds);
    if (data) {
      setMembers((prevMembers) => {
        const prevStatusMap = new Map(prevMembers.map(m => [m.id, m.status]));
        return data.map((p) => ({
          id: p.user_id,
          name: p.display_name,
          avatar: p.display_name?.charAt(0)?.toUpperCase() || '?',
          avatarUrl: p.avatar_url || null,
          status: presenceStatusRef.current.get(p.user_id) || prevStatusMap.get(p.user_id) || 'offline' as const,
        }));
      });
    }
  }, [activeServer]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

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
        // Fetch profiles for avatar urls
        const userIds = [...new Set(data.map((m) => m.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, avatar_url')
          .in('user_id', userIds);
        const avatarMap = new Map(profiles?.map((p) => [p.user_id, p.avatar_url]) || []);

        setMessages(
          data.map((m) => ({
            id: m.id,
            author: m.author_name,
            avatar: m.author_name?.charAt(0)?.toUpperCase() || '?',
            avatarUrl: avatarMap.get(m.user_id) || null,
            userId: m.user_id,
            content: m.content,
            timestamp: formatTimestamp(m.created_at),
            edited: !!(m as any).updated_at,
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
        async (payload) => {
          const m = payload.new as {
            id: string; server_id: string; channel_id: string;
            author_name: string; content: string; created_at: string; user_id: string;
          };
          if (m.server_id === serverRef.current && m.channel_id === channelRef.current) {
            // Fetch avatar url for the message author
            const { data: prof } = await supabase
              .from('profiles')
              .select('avatar_url')
              .eq('user_id', m.user_id)
              .maybeSingle();
            setMessages((prev) => [
              ...prev,
              {
                id: m.id,
                author: m.author_name,
                avatar: m.author_name?.charAt(0)?.toUpperCase() || '?',
                avatarUrl: prof?.avatar_url || null,
                userId: m.user_id,
                content: m.content,
                timestamp: formatTimestamp(m.created_at),
                edited: false,
              },
            ]);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages' },
        (payload) => {
          const m = payload.new as {
            id: string; content: string; updated_at: string | null;
            server_id: string; channel_id: string;
          };
          if (m.server_id === serverRef.current && m.channel_id === channelRef.current) {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === m.id
                  ? { ...msg, content: m.content, edited: !!m.updated_at }
                  : msg
              )
            );
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'messages' },
        (payload) => {
          const old = payload.old as { id: string };
          if (old?.id) {
            setMessages((prev) => prev.filter((m) => m.id !== old.id));
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

  // Realtime server changes
  useEffect(() => {
    const channel = supabase
      .channel('realtime-servers')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'servers' },
        () => {
          fetchServers();
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchServers]);

  // Fetch reactions when channel changes
  useEffect(() => {
    if (!activeChannel) return;
    const fetchReactions = async () => {
      const messageIds = messages.map((m) => m.id);
      if (messageIds.length === 0) { setReactions({}); return; }
      const { data } = await supabase
        .from('message_reactions')
        .select('*')
        .in('message_id', messageIds);
      if (data) {
        const grouped: Record<string, DbReaction[]> = {};
        for (const r of data) {
          if (!grouped[r.message_id]) grouped[r.message_id] = [];
          const existing = grouped[r.message_id].find((e) => e.emoji === r.emoji);
          if (existing) {
            existing.userIds.push(r.user_id);
            existing.count++;
          } else {
            grouped[r.message_id].push({ emoji: r.emoji, userIds: [r.user_id], count: 1 });
          }
        }
        setReactions(grouped);
      }
    };
    fetchReactions();
  }, [activeChannel, messages.length]);

  // Realtime reactions
  useEffect(() => {
    const channel = supabase
      .channel('realtime-reactions')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'message_reactions' },
        (payload) => {
          const r = payload.new as { message_id: string; user_id: string; emoji: string };
          setReactions((prev) => {
            const copy = { ...prev };
            const list = [...(copy[r.message_id] || [])];
          const existingIdx = list.findIndex((e) => e.emoji === r.emoji);
            if (existingIdx !== -1) {
              const existing = list[existingIdx];
              if (!existing.userIds.includes(r.user_id)) {
                list[existingIdx] = {
                  ...existing,
                  userIds: [...existing.userIds, r.user_id],
                  count: existing.count + 1,
                };
              }
            } else {
              list.push({ emoji: r.emoji, userIds: [r.user_id], count: 1 });
            }
            copy[r.message_id] = list;
            return copy;
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'message_reactions' },
        (payload) => {
          const r = payload.old as { message_id: string; user_id: string; emoji: string };
          setReactions((prev) => {
            const copy = { ...prev };
            const list = (copy[r.message_id] || [])
              .map((e) =>
                e.emoji === r.emoji
                  ? { ...e, userIds: e.userIds.filter((id) => id !== r.user_id), count: e.count - 1 }
                  : e
              )
              .filter((e) => e.count > 0);
            copy[r.message_id] = list;
            return copy;
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleToggleReaction = useCallback(
    async (messageId: string, emoji: string) => {
      if (!user) return;
      const msgReactions = reactions[messageId] || [];
      const existing = msgReactions.find((r) => r.emoji === emoji);
      const hasReacted = existing?.userIds.includes(user.id);

      // Save previous state for rollback
      const previousReactions = { ...reactions };

      // Optimistic update
      setReactions((prev) => {
        const copy = { ...prev };
        const list = [...(copy[messageId] || [])];
        if (hasReacted) {
          const updated = list
            .map((e) =>
              e.emoji === emoji
                ? { ...e, userIds: e.userIds.filter((id) => id !== user.id), count: e.count - 1 }
                : e
            )
            .filter((e) => e.count > 0);
          copy[messageId] = updated;
        } else {
          const idx = list.findIndex((e) => e.emoji === emoji);
          if (idx !== -1) {
            list[idx] = { ...list[idx], userIds: [...list[idx].userIds, user.id], count: list[idx].count + 1 };
          } else {
            list.push({ emoji, userIds: [user.id], count: 1 });
          }
          copy[messageId] = list;
        }
        return copy;
      });

      // Send to database
      const { error } = hasReacted
        ? await supabase
            .from('message_reactions')
            .delete()
            .eq('message_id', messageId)
            .eq('user_id', user.id)
            .eq('emoji', emoji)
        : await supabase
            .from('message_reactions')
            .insert({ message_id: messageId, user_id: user.id, emoji });

      // Rollback on error
      if (error) {
        setReactions(previousReactions);
      }
    },
    [user, reactions]
  );


  useEffect(() => {
    const channel = supabase
      .channel('realtime-server-members')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'server_members' },
        () => {
          fetchMembers();
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchMembers]);

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
        // Update the persistent ref so fetchMembers can use it
        presenceStatusRef.current = presenceMap;
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
          // Immediately reflect own status in ref and members
          presenceStatusRef.current.set(user.id, myStatus);
          setMembers((prev) =>
            prev.map((m) => (m.id === user.id ? { ...m, status: myStatus } : m))
          );
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
    presenceStatusRef.current.set(user.id, myStatus);
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

  const handleServerDeleted = useCallback(() => {
    setActiveServer('');
    setActiveChannel('');
    fetchServers();
  }, [fetchServers]);

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

  const handleDeleteMessage = useCallback(
    async (messageId: string) => {
      const { error } = await supabase.from('messages').delete().eq('id', messageId);
      if (!error) {
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
      }
    },
    []
  );

  const handleEditMessage = useCallback(
    async (messageId: string, newContent: string) => {
      await supabase
        .from('messages')
        .update({ content: newContent, updated_at: new Date().toISOString() } as any)
        .eq('id', messageId);
    },
    []
  );

  const handleLeaveServer = useCallback(
    async () => {
      if (!user) return;
      await supabase.from('server_members').delete().eq('server_id', activeServer).eq('user_id', user.id);
      setActiveServer('');
      setActiveChannel('');
      fetchServers();
    },
    [user, activeServer, fetchServers]
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
      <div className="h-screen flex flex-col overflow-hidden" style={{ height: '100dvh' }}>
        {mobileView === 'channels' && (
          <div className="flex h-full">
            <ServerSidebar activeServer={activeServer} onServerChange={handleServerChange} servers={servers} onServerCreated={handleServerCreated} />
            <ChannelList
              serverName={server.name}
              serverId={server.id}
              serverIcon={server.icon}
              channels={server.channels}
              activeChannel={activeChannel}
              onChannelChange={handleChannelChange}
              currentUserStatus={myStatus}
              onStatusChange={setMyStatus}
              isOwner={isOwner}
              onChannelCreated={fetchServers}
              onServerDeleted={handleServerDeleted}
              onServerUpdated={fetchServers}
              onLeaveServer={handleLeaveServer}
              isMobile
            />
          </div>
        )}
        {mobileView === 'chat' && (
          <ChatArea
            channelName={channel.name}
            messages={messages}
            onSendMessage={handleSendMessage}
            onDeleteMessage={handleDeleteMessage}
            onEditMessage={handleEditMessage}
            onToggleMembers={() => setMobileView('members')}
            showMembers={false}
            isOwner={isOwner}
            isMobile
            onBack={() => setMobileView('channels')}
            reactions={reactions}
            onToggleReaction={handleToggleReaction}
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
        serverIcon={server.icon}
        channels={server.channels}
        activeChannel={activeChannel}
        onChannelChange={handleChannelChange}
        currentUserStatus={myStatus}
        onStatusChange={setMyStatus}
        isOwner={isOwner}
        onChannelCreated={fetchServers}
        onServerDeleted={handleServerDeleted}
        onServerUpdated={fetchServers}
        onLeaveServer={handleLeaveServer}
      />
      <ChatArea
        channelName={channel.name}
        messages={messages}
        onSendMessage={handleSendMessage}
        onDeleteMessage={handleDeleteMessage}
        onEditMessage={handleEditMessage}
        onToggleMembers={() => setShowMembers((p) => !p)}
        showMembers={showMembers}
        isOwner={isOwner}
        reactions={reactions}
        onToggleReaction={handleToggleReaction}
      />
      {showMembers && <MemberList members={members} />}
    </div>
  );
};

export default Index;
