import { useState, useCallback, useEffect, useRef } from 'react';
import ServerSidebar from '@/components/ServerSidebar';
import ChannelList from '@/components/ChannelList';
import ChatArea from '@/components/ChatArea';
import { Home, MessageSquare, Users, Settings, Hash } from 'lucide-react';
import MemberList from '@/components/MemberList';
import DMDashboard from '@/components/DMDashboard';
import DMChatArea from '@/components/DMChatArea';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNavigate } from 'react-router-dom';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useTranslation } from '@/i18n';
import { uploadFiles } from '@/components/DMChatArea';
import SplashScreen from '@/components/SplashScreen';
import ReleaseNotesModal from '@/components/ReleaseNotesModal';
import { useVoiceChannel } from '@/hooks/useVoiceChannel';
import { toast } from 'sonner';
import { executeBotCommand } from '@/utils/botCommands';

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
  status?: 'sending' | 'failed';
  attachments?: string[];
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
  roleColor?: string;
  rolePosition?: number;
}

export interface DbChannel {
  id: string;
  name: string;
  type: 'text' | 'voice';
  position: number;
  category_id?: string | null;
  is_locked?: boolean;
}

export interface DbServer {
  id: string;
  name: string;
  icon: string;
  owner_id: string | null;
  channels: DbChannel[];
  categories?: DbCategory[];
}

export interface DbCategory {
  id: string;
  name: string;
  position: number;
  server_id: string;
}

type MobileView = 'channels' | 'chat' | 'members';

interface MobileBottomNavProps {
  activeView: string;
  onHome: () => void;
  onChannels: () => void;
  onChat: () => void;
  onMembers: () => void;
  onSettings: () => void;
  onOpenSidebar: () => void;
  isHome?: boolean;
}

const MobileBottomNav = ({ activeView, onHome, onChannels, onChat, onMembers, onSettings, onOpenSidebar, isHome }: MobileBottomNavProps) => {
  const { t } = useTranslation();
  const items = [
    { id: 'servers', icon: Home, label: t('nav.servers'), action: onOpenSidebar },
    { id: 'channels', icon: Hash, label: t('nav.channels'), action: onChannels },
    { id: 'chat', icon: MessageSquare, label: t('nav.chat'), action: onChat },
    { id: 'members', icon: Users, label: t('nav.members'), action: onMembers },
    { id: 'settings', icon: Settings, label: t('nav.settings'), action: onSettings },
  ];

  if (isHome) {
    items[0] = { id: 'home', icon: Home, label: t('nav.home'), action: onHome };
    items[1] = { id: 'servers', icon: Hash, label: t('nav.servers'), action: onOpenSidebar };
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 h-14 bg-server-bg border-t border-border/50 flex items-center px-1 shrink-0">
      {items.map((item) => {
        const isActive = activeView === item.id || (isHome && item.id === 'home' && activeView === 'home');
        return (
          <button
            key={item.id}
            onClick={item.action}
            className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-lg transition-colors ${
              isActive ? 'text-primary bg-primary/10 font-medium' : 'text-muted-foreground'
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[10px]">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};

const Index = () => {
  const { profile, user } = useAuth();
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const voice = useVoiceChannel();
  const [splashDone, setSplashDone] = useState(() => sessionStorage.getItem('aurorachat_splash_done') === 'true');
  const [loadingSteps, setLoadingSteps] = useState([
    { label: 'Oturum kontrol ediliyor...', done: false },
    { label: 'Sunucular yükleniyor...', done: false },
    { label: 'Profil hazırlanıyor...', done: false },
  ]);

  const [servers, setServers] = useState<DbServer[]>([]);
  const [activeServer, setActiveServer] = useState<string>('');
  const [activeChannel, setActiveChannel] = useState<string>('');
  const [messages, setMessages] = useState<DbMessage[]>([]);
  const [showMembers, setShowMembers] = useState(true);
  const [members, setMembers] = useState<DbMember[]>([]);
  const [myStatus, setMyStatus] = useState<DbMember['status']>('online');
  const [mobileView, setMobileView] = useState<MobileView>('channels');
  const [reactions, setReactions] = useState<Record<string, DbReaction[]>>({});
  const [typingUsers, setTypingUsers] = useState<{ userId: string; displayName: string }[]>([]);
  const typingTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const typingChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const [activeDMUser, setActiveDMUser] = useState<{ userId: string; displayName: string; username: string; avatarUrl: string | null } | null>(null);
  const channelRef = useRef(activeChannel);
  const serverRef = useRef(activeServer);
  const presenceChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const presenceStatusRef = useRef<Map<string, DbMember['status']>>(new Map());
  const userRef = useRef(user?.id);
  useEffect(() => {
    channelRef.current = activeChannel;
    serverRef.current = activeServer;
    userRef.current = user?.id;
  }, [activeChannel, activeServer, user?.id]);

  const fetchServers = useCallback(async () => {
    const { data: serversData } = await supabase
      .from('servers')
      .select('*')
      .order('created_at', { ascending: true });

    const { data: channelsData } = await supabase
      .from('channels')
      .select('*')
      .order('position', { ascending: true });

    const { data: categoriesData } = await supabase
      .from('channel_categories')
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
            category_id: (c as any).category_id || null,
          })),
        categories: (categoriesData || [])
          .filter((cat: any) => cat.server_id === s.id)
          .map((cat: any) => ({ id: cat.id, name: cat.name, position: cat.position, server_id: cat.server_id })),
      }));
      setServers(mapped);
      if (!activeServer && mapped.length > 0) {
        setActiveServer(mapped[0].id);
        const firstChannel = mapped[0].channels[0];
        if (firstChannel) setActiveChannel(firstChannel.id);
      }
    }
  }, [activeServer]);

  // Splash screen logic
  useEffect(() => {
    const initApp = async () => {
      // Step 1: Session
      setLoadingSteps(prev => prev.map((s, i) => i === 0 ? { ...s, done: true } : s));
      
      // Step 2: Servers
      await fetchServers();
      setLoadingSteps(prev => prev.map((s, i) => i <= 1 ? { ...s, done: true } : s));
      
      // Step 3: Profile
      setLoadingSteps(prev => prev.map((s) => ({ ...s, done: true })));
    };
    initApp();
  }, []);

  const fetchMembers = useCallback(async () => {
    if (!activeServer || activeServer === 'home') return;
    const { data: memberRows } = await supabase
      .from('server_members')
      .select('user_id')
      .eq('server_id', activeServer);
    if (!memberRows) return;
    const userIds = memberRows.map((m) => m.user_id);
    if (userIds.length === 0) { setMembers([]); return; }
    const { data } = await supabase.from('profiles').select('*').in('user_id', userIds);
    // Fetch roles for members
    const { data: memberRoles } = await supabase.from('server_member_roles').select('user_id, role_id').eq('server_id', activeServer);
    const { data: serverRoles } = await supabase.from('server_roles').select('id, name, color, position').eq('server_id', activeServer).order('position', { ascending: false });
    if (data) {
      setMembers((prevMembers) => {
        const prevStatusMap = new Map(prevMembers.map(m => [m.id, m.status]));
        return data.map((p) => {
          // Find highest position role for this user
          const userRoleIds = memberRoles?.filter(mr => mr.user_id === p.user_id).map(mr => mr.role_id) || [];
          const userRoles = serverRoles?.filter(r => userRoleIds.includes(r.id)) || [];
          const topRole = userRoles.length > 0 ? userRoles[0] : null; // already sorted by position desc
          return {
            id: p.user_id,
            name: p.display_name,
            avatar: p.display_name?.charAt(0)?.toUpperCase() || '?',
            avatarUrl: p.avatar_url || null,
            status: presenceStatusRef.current.get(p.user_id) || prevStatusMap.get(p.user_id) || 'offline' as const,
            role: topRole?.name,
            roleColor: topRole?.color,
            rolePosition: topRole?.position,
          };
        });
      });
    }
  }, [activeServer]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  useEffect(() => {
    if (!activeServer || activeServer === 'home' || !activeChannel) return;
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
            attachments: (m as any).attachments || undefined,
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
            // Skip own messages — optimistic update already added them
            if (m.user_id === userRef.current) {
              // Replace temp message with real one (update id)
              setMessages((prev) => {
                const hasTempMsg = prev.some((msg) => msg.userId === m.user_id && msg.status === 'sending');
                if (hasTempMsg) {
                  // Already handled by optimistic update
                  return prev;
                }
                // Fallback: add if not found (e.g. after reconnect)
                return prev.some((msg) => msg.id === m.id) ? prev : [...prev, {
                  id: m.id, author: m.author_name, avatar: m.author_name?.charAt(0)?.toUpperCase() || '?',
                  avatarUrl: null, userId: m.user_id, content: m.content,
                  timestamp: formatTimestamp(m.created_at), edited: false,
                }];
              });
              return;
            }
            // Fetch avatar url for the message author
            const { data: prof } = await supabase
              .from('profiles')
              .select('avatar_url')
              .eq('user_id', m.user_id)
              .maybeSingle();
            setMessages((prev) => {
              if (prev.some((msg) => msg.id === m.id)) return prev;
              return [
                ...prev,
                {
                  id: m.id, author: m.author_name, avatar: m.author_name?.charAt(0)?.toUpperCase() || '?',
                  avatarUrl: prof?.avatar_url || null, userId: m.user_id, content: m.content,
                  timestamp: formatTimestamp(m.created_at), edited: false,
                },
              ];
            });
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

  // Realtime reactions — skip own user's events (optimistic update already applied)
  useEffect(() => {
    const channel = supabase
      .channel('realtime-reactions-v2')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'message_reactions' },
        (payload) => {
          const r = payload.new as { message_id: string; user_id: string; emoji: string };
          if (!r.message_id || !r.user_id || !r.emoji) return;
          if (r.user_id === user?.id) return; // skip own — already optimistically applied
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
          const r = payload.old as { id?: string; message_id?: string; user_id?: string; emoji?: string };
          if (!r.message_id || !r.user_id || !r.emoji) return; // need full data (REPLICA IDENTITY FULL)
          if (r.user_id === user?.id) return; // skip own — already optimistically applied
          setReactions((prev) => {
            const copy = { ...prev };
            const list = (copy[r.message_id!] || [])
              .map((e) =>
                e.emoji === r.emoji
                  ? { ...e, userIds: e.userIds.filter((id) => id !== r.user_id), count: e.count - 1 }
                  : e
              )
              .filter((e) => e.count > 0);
            copy[r.message_id!] = list;
            return copy;
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

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

  // Typing indicator broadcast channel
  useEffect(() => {
    if (!activeChannel || !user) {
      setTypingUsers([]);
      typingChannelRef.current = null;
      return;
    }
    const typingChannel = supabase.channel(`typing-${activeChannel}`);
    typingChannelRef.current = typingChannel;
    typingChannel
      .on('broadcast', { event: 'typing' }, (payload) => {
        const { userId, displayName } = payload.payload as { userId: string; displayName: string };
        if (userId === user.id) return;
        setTypingUsers((prev) => {
          const exists = prev.some((t) => t.userId === userId);
          if (!exists) return [...prev, { userId, displayName }];
          return prev;
        });
        const existing = typingTimeoutsRef.current.get(userId);
        if (existing) clearTimeout(existing);
        const timeout = setTimeout(() => {
          setTypingUsers((prev) => prev.filter((t) => t.userId !== userId));
          typingTimeoutsRef.current.delete(userId);
        }, 3000);
        typingTimeoutsRef.current.set(userId, timeout);
      })
      .on('broadcast', { event: 'stop_typing' }, (payload) => {
        const { userId } = payload.payload as { userId: string };
        setTypingUsers((prev) => prev.filter((t) => t.userId !== userId));
        const existing = typingTimeoutsRef.current.get(userId);
        if (existing) { clearTimeout(existing); typingTimeoutsRef.current.delete(userId); }
      })
      .subscribe();

    return () => {
      setTypingUsers([]);
      typingTimeoutsRef.current.forEach((t) => clearTimeout(t));
      typingTimeoutsRef.current.clear();
      typingChannelRef.current = null;
      supabase.removeChannel(typingChannel);
    };
  }, [activeChannel, user?.id]);

  const handleTypingStart = useCallback(() => {
    if (!activeChannel || !user || !profile || !typingChannelRef.current) return;
    typingChannelRef.current.send({ type: 'broadcast', event: 'typing', payload: { userId: user.id, displayName: profile.display_name } });
  }, [activeChannel, user, profile]);

  const handleTypingStop = useCallback(() => {
    if (!activeChannel || !user || !typingChannelRef.current) return;
    typingChannelRef.current.send({ type: 'broadcast', event: 'stop_typing', payload: { userId: user.id } });
  }, [activeChannel, user]);

  const server = servers.find((s) => s.id === activeServer) || servers[0];
  const channel = server?.channels.find((c) => c.id === activeChannel) || server?.channels[0];
  const isOwner = server?.owner_id === user?.id;

  const handleServerChange = useCallback((id: string) => {
    if (id === 'home') {
      setActiveServer('home');
      setActiveDMUser(null);
      return;
    }
    const s = servers.find((s) => s.id === id);
    if (s) {
      setActiveServer(id);
      setActiveDMUser(null);
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
    const { data: categoriesData } = await supabase
      .from('channel_categories')
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
          .map((c) => ({ id: c.id, name: c.name, type: c.type as 'text' | 'voice', position: c.position, category_id: (c as any).category_id || null })),
        categories: (categoriesData || [])
          .filter((cat: any) => cat.server_id === s.id)
          .map((cat: any) => ({ id: cat.id, name: cat.name, position: cat.position, server_id: cat.server_id })),
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
    // Check if it's a voice channel
    const currentServer = servers.find(s => s.id === activeServer);
    const ch = currentServer?.channels.find(c => c.id === id);
    if (ch?.type === 'voice') {
      voice.connect(id, ch.name);
      return;
    }
    setActiveChannel(id);
    if (isMobile) setMobileView('chat');
  }, [isMobile, servers, activeServer, voice]);

  const handleSendMessage = useCallback(
    async (content: string, files?: File[]) => {
      if (!user || !profile) return;
      const tempId = crypto.randomUUID();
      const optimisticMsg: DbMessage = {
        id: tempId,
        author: profile.display_name,
        avatar: profile.display_name?.charAt(0)?.toUpperCase() || '?',
        avatarUrl: profile.avatar_url || null,
        userId: user.id,
        content,
        timestamp: formatTimestamp(new Date().toISOString()),
        edited: false,
        status: 'sending',
      };
      setMessages((prev) => [...prev, optimisticMsg]);

      let attachmentUrls: string[] | undefined;
      if (files && files.length > 0) {
        attachmentUrls = await uploadFiles(files, user.id, tempId, 'channels');
      }

      const insertData: any = {
        server_id: activeServer,
        channel_id: activeChannel,
        user_id: user.id,
        author_name: profile.display_name,
        content: content || '',
      };
      if (attachmentUrls && attachmentUrls.length > 0) insertData.attachments = attachmentUrls;

      const { data, error } = await supabase.from('messages').insert(insertData).select().single();
      if (error) {
        setMessages((prev) => prev.map((m) => m.id === tempId ? { ...m, status: 'failed' as const } : m));
      } else if (data) {
        setMessages((prev) => prev.map((m) => m.id === tempId ? { ...m, id: data.id, status: undefined, attachments: attachmentUrls } : m));
      }
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

  const handleRetryMessage = useCallback(
    async (messageId: string, content: string) => {
      if (!user || !profile) return;
      setMessages((prev) => prev.map((m) => m.id === messageId ? { ...m, status: 'sending' as const } : m));
      const { data, error } = await supabase.from('messages').insert({
        server_id: activeServer,
        channel_id: activeChannel,
        user_id: user.id,
        author_name: profile.display_name,
        content,
      }).select().single();
      if (error) {
        setMessages((prev) => prev.map((m) => m.id === messageId ? { ...m, status: 'failed' as const } : m));
      } else if (data) {
        setMessages((prev) => prev.map((m) => m.id === messageId ? { ...m, id: data.id, status: undefined } : m));
      }
    },
    [user, profile, activeServer, activeChannel]
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

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Splash screen
  const allStepsDone = loadingSteps.every(s => s.done);
  if (!splashDone) {
    return <SplashScreen loadingSteps={loadingSteps} allDone={allStepsDone} onEnter={() => { sessionStorage.setItem('aurorachat_splash_done', 'true'); setSplashDone(true); }} />;
  }

  if (activeServer === 'home') {
    const dmContent = activeDMUser ? (
      <DMChatArea dmUser={activeDMUser} onBack={() => setActiveDMUser(null)} />
    ) : (
      <DMDashboard onOpenDM={(u) => setActiveDMUser(u)} />
    );

    if (isMobile) {
      return (
        <div className="h-screen flex flex-col overflow-hidden pb-14" style={{ height: '100dvh' }}>
          <div className="flex-1 min-h-0 overflow-hidden">
            {dmContent}
          </div>
          <MobileBottomNav
            activeView={activeDMUser ? 'chat' : 'home'}
            onHome={() => { setActiveDMUser(null); handleServerChange('home'); }}
            onChannels={() => setMobileView('channels')}
            onChat={() => setMobileView('chat')}
            onMembers={() => setMobileView('members')}
            onSettings={() => navigate('/settings')}
            onOpenSidebar={() => setSidebarOpen(true)}
            isHome
          />
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetContent side="left" className="p-0 w-[72px] bg-server-bg border-none">
              <ServerSidebar activeServer={activeServer} onServerChange={(id) => { handleServerChange(id); setSidebarOpen(false); }} servers={servers} onServerCreated={handleServerCreated} />
            </SheetContent>
          </Sheet>
        </div>
      );
    }

    return (
      <div className="h-screen flex overflow-hidden">
        <ServerSidebar activeServer={activeServer} onServerChange={handleServerChange} servers={servers} onServerCreated={handleServerCreated} />
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 min-h-0 overflow-hidden">
            {dmContent}
          </div>
        </div>
      </div>
    );
  }

  // useTranslation moved to top of component

  if (servers.length === 0) {
    return (
      <div className="h-screen flex overflow-hidden">
        <ServerSidebar activeServer={activeServer} onServerChange={handleServerChange} servers={servers} onServerCreated={handleServerCreated} />
        <div className="flex-1 flex items-center justify-center bg-background">
          <div className="text-center space-y-3">
            <p className="text-xl font-semibold text-foreground">{t('server.noServers')}</p>
            <p className="text-muted-foreground text-sm">{t('server.noServersDesc')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!server || !channel) {
    return (
      <div className="h-screen flex items-center justify-center bg-background text-muted-foreground">
        {t('common.loading')}
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="h-screen flex flex-col overflow-hidden pb-14" style={{ height: '100dvh' }}>
        <div className="flex-1 min-h-0 overflow-hidden">
          {mobileView === 'channels' && (
            <ChannelList
              serverName={server.name}
              serverId={server.id}
              serverIcon={server.icon}
              channels={server.channels}
              categories={server.categories}
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
              voiceState={voice}
            />
          )}
          {mobileView === 'chat' && (
            <ChatArea
              channelName={channel.name}
              messages={messages}
              onSendMessage={handleSendMessage}
              onDeleteMessage={handleDeleteMessage}
              onEditMessage={handleEditMessage}
              onRetryMessage={handleRetryMessage}
              onToggleMembers={() => setMobileView('members')}
              showMembers={false}
              isOwner={isOwner}
              isMobile
              onBack={() => setMobileView('channels')}
              reactions={reactions}
              onToggleReaction={handleToggleReaction}
              typingUsers={typingUsers}
              onTypingStart={handleTypingStart}
              onTypingStop={handleTypingStop}
              members={members}
            />
          )}
          {mobileView === 'members' && (
            <MemberList members={members} isMobile onBack={() => setMobileView('chat')} />
          )}
        </div>
        <MobileBottomNav
          activeView={mobileView}
          onHome={() => handleServerChange('home')}
          onChannels={() => setMobileView('channels')}
          onChat={() => setMobileView('chat')}
          onMembers={() => setMobileView('members')}
          onSettings={() => navigate('/settings')}
          onOpenSidebar={() => setSidebarOpen(true)}
        />
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="p-0 w-[72px] bg-server-bg border-none">
            <ServerSidebar activeServer={activeServer} onServerChange={(id) => { handleServerChange(id); setSidebarOpen(false); }} servers={servers} onServerCreated={handleServerCreated} />
          </SheetContent>
        </Sheet>
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden">
      <ReleaseNotesModal />
      <ServerSidebar activeServer={activeServer} onServerChange={handleServerChange} servers={servers} onServerCreated={handleServerCreated} />
      <ChannelList
        serverName={server.name}
        serverId={server.id}
        serverIcon={server.icon}
        channels={server.channels}
        categories={server.categories}
        activeChannel={activeChannel}
        onChannelChange={handleChannelChange}
        currentUserStatus={myStatus}
        onStatusChange={setMyStatus}
        isOwner={isOwner}
        onChannelCreated={fetchServers}
        onServerDeleted={handleServerDeleted}
        onServerUpdated={fetchServers}
        onLeaveServer={handleLeaveServer}
        voiceState={voice}
      />
      <ChatArea
        channelName={channel.name}
        messages={messages}
        onSendMessage={handleSendMessage}
        onDeleteMessage={handleDeleteMessage}
        onEditMessage={handleEditMessage}
        onRetryMessage={handleRetryMessage}
        onToggleMembers={() => setShowMembers((p) => !p)}
        showMembers={showMembers}
        isOwner={isOwner}
        reactions={reactions}
        onToggleReaction={handleToggleReaction}
        typingUsers={typingUsers}
        onTypingStart={handleTypingStart}
        onTypingStop={handleTypingStop}
        members={members}
      />
      {showMembers && <MemberList members={members} />}
    </div>
  );
};

export default Index;
