import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, Send, PlusCircle, SmilePlus } from 'lucide-react';

interface DMUser {
  userId: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
}

interface DMMessage {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
  senderName: string;
  senderAvatar: string | null;
}

interface DMChatAreaProps {
  dmUser: DMUser;
  onBack: () => void;
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

const DMChatArea = ({ dmUser, onBack }: DMChatAreaProps) => {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<DMMessage[]>([]);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch message history
  useEffect(() => {
    if (!user) return;
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('direct_messages')
        .select('*')
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${dmUser.userId}),and(sender_id.eq.${dmUser.userId},receiver_id.eq.${user.id})`
        )
        .order('created_at', { ascending: true });

      if (data) {
        setMessages(
          (data as any[]).map((m) => ({
            id: m.id,
            senderId: m.sender_id,
            content: m.content,
            createdAt: m.created_at,
            senderName: m.sender_id === user.id ? (profile?.display_name || 'Sen') : dmUser.displayName,
            senderAvatar: m.sender_id === user.id ? (profile?.avatar_url || null) : dmUser.avatarUrl,
          }))
        );
      }
    };
    fetchMessages();
  }, [user, dmUser.userId, profile]);

  // Realtime subscription
  const dmUserId = dmUser.userId;
  const dmDisplayName = dmUser.displayName;
  const dmAvatarUrl = dmUser.avatarUrl;

  useEffect(() => {
    if (!user) return;
    const channelName = `dm-realtime-${[user.id, dmUserId].sort().join('-')}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'direct_messages' },
        (payload) => {
          const m = payload.new as any;
          // Only show messages between these two users
          const isRelevant =
            (m.sender_id === user.id && m.receiver_id === dmUserId) ||
            (m.sender_id === dmUserId && m.receiver_id === user.id);
          if (!isRelevant) return;
          // Skip own messages (already added optimistically)
          if (m.sender_id === user.id) return;

          setMessages((prev) => {
            if (prev.some((msg) => msg.id === m.id)) return prev;
            return [
              ...prev,
              {
                id: m.id,
                senderId: m.sender_id,
                content: m.content,
                createdAt: m.created_at,
                senderName: dmDisplayName,
                senderAvatar: dmAvatarUrl,
              },
            ];
          });
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.error('DM realtime channel error:', channelName);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, dmUserId, dmDisplayName, dmAvatarUrl]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || !user || !profile) return;
    const content = input.trim();
    setInput('');

    // Optimistic
    const tempId = crypto.randomUUID();
    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        senderId: user.id,
        content,
        createdAt: new Date().toISOString(),
        senderName: profile.display_name,
        senderAvatar: profile.avatar_url || null,
      },
    ]);

    const { data, error } = await supabase.from('direct_messages').insert({
      sender_id: user.id,
      receiver_id: dmUser.userId,
      content,
    } as any).select().single();

    if (error) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } else if (data) {
      // Replace temp with real
      setMessages((prev) => prev.map((m) => m.id === tempId ? { ...m, id: (data as any).id } : m));
    }
  }, [input, user, profile, dmUser]);

  return (
    <div className="flex-1 flex flex-col min-w-0 min-h-0 h-full overflow-hidden">
      {/* Header */}
      <div className="h-12 flex items-center px-4 border-b border-border shadow-sm gap-3">
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <Avatar className="h-7 w-7">
          {dmUser.avatarUrl && <AvatarImage src={dmUser.avatarUrl} />}
          <AvatarFallback className="bg-secondary text-foreground text-xs font-semibold">
            {dmUser.displayName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <span className="font-semibold text-foreground text-sm">{dmUser.displayName}</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto overscroll-contain scrollbar-thin px-4 py-4 space-y-4" style={{ minHeight: 0 }}>
        <div className="mb-6">
          <Avatar className="h-16 w-16 mb-3">
            {dmUser.avatarUrl && <AvatarImage src={dmUser.avatarUrl} />}
            <AvatarFallback className="bg-secondary text-foreground text-2xl font-bold">
              {dmUser.displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <h2 className="text-2xl font-bold text-foreground">{dmUser.displayName}</h2>
          <p className="text-muted-foreground text-sm mt-1">@{dmUser.username} ile konuşmanın başlangıcı.</p>
        </div>

        {messages.map((msg) => (
          <div key={msg.id} className="flex gap-3 hover:bg-secondary/30 -mx-2 px-2 py-1 rounded-md transition-colors">
            <Avatar className="h-10 w-10 shrink-0">
              {msg.senderAvatar && <AvatarImage src={msg.senderAvatar} />}
              <AvatarFallback className="bg-secondary text-foreground font-semibold">
                {msg.senderName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <span className="font-medium text-sm text-foreground">{msg.senderName}</span>
                <span className="text-[11px] text-muted-foreground">{formatTimestamp(msg.createdAt)}</span>
              </div>
              <p className="text-sm text-secondary-foreground leading-relaxed">{msg.content}</p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 pb-6">
        <div className="bg-input rounded-lg flex items-center px-3 gap-2">
          <button className="text-muted-foreground hover:text-foreground transition-colors">
            <PlusCircle className="w-5 h-5" />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={`@${dmUser.displayName} kullanıcısına mesaj gönder`}
            className="flex-1 bg-transparent py-3 text-sm outline-none text-foreground placeholder:text-muted-foreground"
          />
          <div className="flex items-center gap-2 text-muted-foreground">
            <button className="hover:text-foreground transition-colors"><SmilePlus className="w-5 h-5" /></button>
            {input.trim() && (
              <button onClick={handleSend} className="text-primary hover:text-primary/80 transition-colors">
                <Send className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DMChatArea;
