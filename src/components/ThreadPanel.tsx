import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Send, Hash, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/i18n';
import { renderMessageContent } from './ChatArea';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ThreadMessage {
  id: string;
  author_name: string;
  content: string;
  user_id: string;
  avatar_url?: string | null;
  created_at: string;
  attachments?: string[];
}

interface ThreadPanelProps {
  threadId: string | null;
  messageId: string;
  channelId: string;
  serverId: string;
  messageAuthor: string;
  messageContent: string;
  onClose: () => void;
}

const formatTimestamp = (dateStr: string) => {
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const hour = String(d.getHours()).padStart(2, '0');
  const minute = String(d.getMinutes()).padStart(2, '0');
  return `${day}.${month} ${hour}:${minute}`;
};

const ThreadPanel = ({ threadId: initialThreadId, messageId, channelId, serverId, messageAuthor, messageContent, onClose }: ThreadPanelProps) => {
  const { user, profile } = useAuth();
  const { t } = useTranslation();
  const [threadId, setThreadId] = useState(initialThreadId);
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(async () => {
    if (!threadId) return;
    const { data } = await supabase
      .from('thread_messages')
      .select('*')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true });
    if (data) {
      const userIds = [...new Set(data.map(m => m.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, avatar_url')
        .in('user_id', userIds);
      const avatarMap = new Map(profiles?.map(p => [p.user_id, p.avatar_url]) || []);
      setMessages(data.map(m => ({ ...m, avatar_url: avatarMap.get(m.user_id) || null })));
    }
  }, [threadId]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  useEffect(() => {
    requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }));
  }, [messages]);

  // Realtime for thread messages
  useEffect(() => {
    if (!threadId) return;
    const channel = supabase
      .channel(`thread-${threadId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'thread_messages', filter: `thread_id=eq.${threadId}` }, async (payload) => {
        const m = payload.new as any;
        if (m.user_id === user?.id) return; // optimistic
        const { data: prof } = await supabase.from('profiles').select('avatar_url').eq('user_id', m.user_id).maybeSingle();
        setMessages(prev => prev.some(msg => msg.id === m.id) ? prev : [...prev, { ...m, avatar_url: prof?.avatar_url || null }]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [threadId, user?.id]);

  const handleSend = async () => {
    if (!input.trim() || !user || !profile) return;
    let currentThreadId = threadId;

    // Create thread if not exists
    if (!currentThreadId) {
      setLoading(true);
      const { data: newThread, error } = await supabase.from('threads').insert({
        message_id: messageId,
        channel_id: channelId,
        server_id: serverId,
        created_by: user.id,
      }).select().single();
      if (error || !newThread) { setLoading(false); return; }
      currentThreadId = newThread.id;
      setThreadId(currentThreadId);
      setLoading(false);
    }

    const content = input.trim();
    setInput('');

    // Optimistic
    const tempMsg: ThreadMessage = {
      id: 'temp-' + crypto.randomUUID(),
      author_name: profile.display_name,
      content,
      user_id: user.id,
      avatar_url: profile.avatar_url,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempMsg]);

    const { data, error } = await supabase.from('thread_messages').insert({
      thread_id: currentThreadId,
      user_id: user.id,
      author_name: profile.display_name,
      content,
    }).select().single();

    if (data) {
      setMessages(prev => prev.map(m => m.id === tempMsg.id ? { ...m, id: data.id } : m));
    }
  };

  return (
    <div className="w-80 bg-sidebar border-l border-border flex flex-col h-full">
      {/* Header */}
      <div className="h-12 flex items-center px-4 border-b border-border gap-2 shrink-0">
        <MessageSquare className="w-4 h-4 text-muted-foreground" />
        <span className="font-semibold text-foreground text-sm flex-1">{t('thread.title')}</span>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Original message */}
      <div className="px-4 py-3 border-b border-border bg-secondary/30">
        <p className="text-xs font-medium text-foreground">{messageAuthor}</p>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{messageContent}</p>
      </div>

      {/* Thread messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3" style={{ minHeight: 0 }}>
        {messages.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-8">{t('thread.noMessages')}</p>
        )}
        {messages.map(msg => (
          <div key={msg.id} className="flex gap-2">
            <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-xs shrink-0 overflow-hidden">
              {msg.avatar_url ? <img src={msg.avatar_url} alt="" className="w-full h-full object-cover" /> : msg.author_name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-1.5">
                <span className="text-xs font-medium text-foreground">{msg.author_name}</span>
                <span className="text-[10px] text-muted-foreground">{formatTimestamp(msg.created_at)}</span>
              </div>
              <div className="text-xs text-secondary-foreground">{renderMessageContent(msg.content)}</div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-3 pb-3">
        <div className="bg-input rounded-lg flex items-center px-3 gap-2 ring-1 ring-border focus-within:ring-primary/40 transition-all">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
            placeholder={t('thread.messagePlaceholder')}
            className="flex-1 bg-transparent py-2.5 text-xs outline-none text-foreground placeholder:text-muted-foreground"
            disabled={loading}
          />
          {input.trim() && (
            <button onClick={handleSend} className="text-primary hover:text-primary/80 transition-colors">
              <Send className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ThreadPanel;
