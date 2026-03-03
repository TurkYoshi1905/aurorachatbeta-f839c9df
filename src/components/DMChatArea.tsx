import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, Send, PlusCircle, SmilePlus, Pencil, Trash2, Check, X } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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
  updatedAt: string | null;
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

const TypingIndicator = ({ displayName }: { displayName: string }) => (
  <div className="flex items-center gap-1.5 px-4 py-1 text-xs text-muted-foreground h-6">
    <span className="inline-flex gap-0.5">
      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
    </span>
    <span className="font-medium">{displayName} yazıyor</span>
  </div>
);

const DMChatArea = ({ dmUser, onBack }: DMChatAreaProps) => {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<DMMessage[]>([]);
  const [input, setInput] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastTypingSentRef = useRef<number>(0);

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
            updatedAt: m.updated_at || null,
            senderName: m.sender_id === user.id ? (profile?.display_name || 'Sen') : dmUser.displayName,
            senderAvatar: m.sender_id === user.id ? (profile?.avatar_url || null) : dmUser.avatarUrl,
          }))
        );
      }
    };
    fetchMessages();
  }, [user, dmUser.userId, profile]);

  // Refs for stable realtime handlers — prevents channel recreation on profile changes
  const userIdRef = useRef(user?.id);
  const dmUserIdRef = useRef(dmUser.userId);
  const dmDisplayNameRef = useRef(dmUser.displayName);
  const dmAvatarUrlRef = useRef(dmUser.avatarUrl);

  useEffect(() => { userIdRef.current = user?.id; }, [user?.id]);
  useEffect(() => { dmUserIdRef.current = dmUser.userId; }, [dmUser.userId]);
  useEffect(() => { dmDisplayNameRef.current = dmUser.displayName; }, [dmUser.displayName]);
  useEffect(() => { dmAvatarUrlRef.current = dmUser.avatarUrl; }, [dmUser.avatarUrl]);

  // Realtime subscription — separate .on() calls, minimal deps (server pattern)
  useEffect(() => {
    if (!user?.id || !dmUser.userId) return;
    const pairKey = [user.id, dmUser.userId].sort().join('-');

    const isRelevantMsg = (m: any) =>
      (m.sender_id === userIdRef.current && m.receiver_id === dmUserIdRef.current) ||
      (m.sender_id === dmUserIdRef.current && m.receiver_id === userIdRef.current);

    const dmChannel = supabase
      .channel(`dm-realtime-${pairKey}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'direct_messages' }, (payload) => {
        const m = payload.new as any;
        if (!isRelevantMsg(m)) return;
        if (m.sender_id === userIdRef.current) return;
        setMessages((prev) => {
          if (prev.some((msg) => msg.id === m.id)) return prev;
          return [
            ...prev,
            {
              id: m.id,
              senderId: m.sender_id,
              content: m.content,
              createdAt: m.created_at,
              updatedAt: m.updated_at || null,
              senderName: dmDisplayNameRef.current,
              senderAvatar: dmAvatarUrlRef.current,
            },
          ];
        });
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'direct_messages' }, (payload) => {
        const m = payload.new as any;
        if (!isRelevantMsg(m)) return;
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === m.id ? { ...msg, content: m.content, updatedAt: m.updated_at || new Date().toISOString() } : msg
          )
        );
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'direct_messages' }, (payload) => {
        const old = payload.old as any;
        if (old?.id) {
          setMessages((prev) => prev.filter((msg) => msg.id !== old.id));
        }
      })
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log('DM realtime channel connected:', pairKey);
        } else if (status === 'CHANNEL_ERROR') {
          console.error('DM realtime channel error:', err);
        } else if (status === 'TIMED_OUT') {
          console.warn('DM realtime channel timed out, retrying...');
        }
      });

    return () => {
      supabase.removeChannel(dmChannel);
    };
  }, [user?.id, dmUser.userId]);

  // Typing indicator via broadcast
  useEffect(() => {
    if (!user) return;
    const pairKey = [user.id, dmUser.userId].sort().join('-');
    const typingChannel = supabase.channel(`dm-typing-${pairKey}`);

    typingChannel
      .on('broadcast', { event: 'typing' }, (payload) => {
        if (payload.payload?.userId === dmUserIdRef.current) {
          setIsTyping(true);
        }
      })
      .on('broadcast', { event: 'stop_typing' }, (payload) => {
        if (payload.payload?.userId === dmUserIdRef.current) {
          setIsTyping(false);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(typingChannel);
    };
  }, [user?.id, dmUser.userId]);

  const sendTypingEvent = useCallback(() => {
    if (!user) return;
    const now = Date.now();
    if (now - lastTypingSentRef.current < 2000) return;
    lastTypingSentRef.current = now;

    const pairKey = [user.id, dmUserIdRef.current].sort().join('-');
    supabase.channel(`dm-typing-${pairKey}`).send({
      type: 'broadcast',
      event: 'typing',
      payload: { userId: user.id },
    });

    setTimeout(() => {
      supabase.channel(`dm-typing-${pairKey}`).send({
        type: 'broadcast',
        event: 'stop_typing',
        payload: { userId: user.id },
      });
    }, 3000);
  }, [user]);

  const stopTypingEvent = useCallback(() => {
    if (!user) return;
    const pairKey = [user.id, dmUserIdRef.current].sort().join('-');
    supabase.channel(`dm-typing-${pairKey}`).send({
      type: 'broadcast',
      event: 'stop_typing',
      payload: { userId: user.id },
    });
  }, [user]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || !user || !profile) return;
    const content = input.trim();
    setInput('');
    stopTypingEvent();

    const tempId = crypto.randomUUID();
    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        senderId: user.id,
        content,
        createdAt: new Date().toISOString(),
        updatedAt: null,
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
      setMessages((prev) => prev.map((m) => m.id === tempId ? { ...m, id: (data as any).id } : m));
    }
  }, [input, user, profile, dmUser, stopTypingEvent]);

  const handleEdit = async (msgId: string) => {
    if (!editValue.trim()) return;
    const { error } = await supabase
      .from('direct_messages')
      .update({ content: editValue.trim() } as any)
      .eq('id', msgId);
    if (!error) {
      setMessages((prev) =>
        prev.map((m) => m.id === msgId ? { ...m, content: editValue.trim(), updatedAt: new Date().toISOString() } : m)
      );
    }
    setEditingId(null);
    setEditValue('');
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const id = deleteId;
    setDeleteId(null);
    const { error } = await supabase.from('direct_messages').delete().eq('id', id);
    if (!error) {
      setMessages((prev) => prev.filter((m) => m.id !== id));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    if (e.target.value.trim()) {
      sendTypingEvent();
    } else {
      stopTypingEvent();
    }
  };

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
          <div key={msg.id} className="group flex gap-3 hover:bg-secondary/30 -mx-2 px-2 py-1 rounded-md transition-colors">
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
                {msg.updatedAt && <span className="text-[10px] text-muted-foreground italic">(düzenlendi)</span>}
              </div>

              {editingId === msg.id ? (
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleEdit(msg.id);
                      if (e.key === 'Escape') { setEditingId(null); setEditValue(''); }
                    }}
                    className="flex-1 bg-input rounded px-2 py-1 text-sm outline-none text-foreground"
                    autoFocus
                  />
                  <button onClick={() => handleEdit(msg.id)} className="text-primary hover:text-primary/80">
                    <Check className="w-4 h-4" />
                  </button>
                  <button onClick={() => { setEditingId(null); setEditValue(''); }} className="text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <p className="text-sm text-secondary-foreground leading-relaxed">{msg.content}</p>
              )}
            </div>

            {msg.senderId === user?.id && editingId !== msg.id && (
              <div className="hidden group-hover:flex items-center gap-1 shrink-0 self-start mt-1">
                <button
                  onClick={() => { setEditingId(msg.id); setEditValue(msg.content); }}
                  className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                  title="Düzenle"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setDeleteId(msg.id)}
                  className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                  title="Sil"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Typing indicator */}
      {isTyping && <TypingIndicator displayName={dmUser.displayName} />}

      {/* Input */}
      <div className="px-4 pb-6">
        <div className="bg-input rounded-lg flex items-center px-3 gap-2">
          <button className="text-muted-foreground hover:text-foreground transition-colors">
            <PlusCircle className="w-5 h-5" />
          </button>
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
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

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mesajı Sil</AlertDialogTitle>
            <AlertDialogDescription>Bu mesajı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DMChatArea;
