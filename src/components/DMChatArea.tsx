import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, Send, PlusCircle, Pencil, Trash2, Check, X, ImagePlus, Phone, Video } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useTranslation } from '@/i18n';
import { renderMessageContent } from './ChatArea';
import MessageAttachments from './MessageAttachments';
import FileUploadPreview from './FileUploadPreview';
import { toast } from 'sonner';
import EmojiPicker from './EmojiPicker';
import GifPicker from './GifPicker';
import { useIsMobile } from '@/hooks/use-mobile';

const MAX_FILES = 3;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

interface DMUser { userId: string; displayName: string; username: string; avatarUrl: string | null; }
interface DMMessage { id: string; senderId: string; content: string; createdAt: string; updatedAt: string | null; senderName: string; senderAvatar: string | null; status?: 'sending' | 'failed'; attachments?: string[]; }
interface DMChatAreaProps { dmUser: DMUser; onBack: () => void; }

const formatTimestamp = (dateStr: string) => {
  const d = new Date(dateStr);
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const uploadFiles = async (files: File[], userId: string, messageId: string, context: 'dm' | 'channels'): Promise<string[]> => {
  const urls: string[] = [];
  for (const file of files) {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `${userId}/${context}/${messageId}/${crypto.randomUUID()}_${safeName}`;
    const { error } = await supabase.storage.from('message_attachments').upload(path, file);
    if (!error) {
      const { data } = supabase.storage.from('message_attachments').getPublicUrl(path);
      const urlWithMeta = `${data.publicUrl}?originalName=${encodeURIComponent(file.name)}&size=${file.size}`;
      urls.push(urlWithMeta);
    }
  }
  return urls;
};

const DMChatArea = ({ dmUser, onBack }: DMChatAreaProps) => {
  const { user, profile } = useAuth();
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [messages, setMessages] = useState<DMMessage[]>([]);
  const [input, setInput] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastTypingSentRef = useRef<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => { requestAnimationFrame(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }); }, [messages]);

  useEffect(() => {
    if (!user) return;
    const fetchMessages = async () => {
      const { data } = await supabase.from('direct_messages').select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${dmUser.userId}),and(sender_id.eq.${dmUser.userId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });
      if (data) {
        setMessages((data as any[]).map((m) => ({
          id: m.id, senderId: m.sender_id, content: m.content, createdAt: m.created_at, updatedAt: m.updated_at || null,
          senderName: m.sender_id === user.id ? (profile?.display_name || 'Sen') : dmUser.displayName,
          senderAvatar: m.sender_id === user.id ? (profile?.avatar_url || null) : dmUser.avatarUrl,
          attachments: m.attachments || undefined,
        })));
      }
    };
    fetchMessages();
  }, [user, dmUser.userId, profile]);

  const userIdRef = useRef(user?.id);
  const dmUserIdRef = useRef(dmUser.userId);
  const dmDisplayNameRef = useRef(dmUser.displayName);
  const dmAvatarUrlRef = useRef(dmUser.avatarUrl);
  useEffect(() => { userIdRef.current = user?.id; }, [user?.id]);
  useEffect(() => { dmUserIdRef.current = dmUser.userId; }, [dmUser.userId]);
  useEffect(() => { dmDisplayNameRef.current = dmUser.displayName; }, [dmUser.displayName]);
  useEffect(() => { dmAvatarUrlRef.current = dmUser.avatarUrl; }, [dmUser.avatarUrl]);

  useEffect(() => {
    if (!user?.id || !dmUser.userId) return;
    const pairKey = [user.id, dmUser.userId].sort().join('-');
    const isRelevantMsg = (m: any) => (m.sender_id === userIdRef.current && m.receiver_id === dmUserIdRef.current) || (m.sender_id === dmUserIdRef.current && m.receiver_id === userIdRef.current);

    const handleInsert = (payload: any) => {
      const m = payload.new as any;
      if (!isRelevantMsg(m)) return;
      if (m.sender_id === userIdRef.current) return;
      setMessages((prev) => {
        if (prev.some((msg) => msg.id === m.id)) return prev;
        return [...prev, { id: m.id, senderId: m.sender_id, content: m.content, createdAt: m.created_at, updatedAt: m.updated_at || null, senderName: dmDisplayNameRef.current, senderAvatar: dmAvatarUrlRef.current, attachments: m.attachments || undefined }];
      });
    };
    const handleUpdate = (payload: any) => {
      const m = payload.new as any;
      if (!isRelevantMsg(m)) return;
      setMessages((prev) => prev.map((msg) => msg.id === m.id ? { ...msg, content: m.content, updatedAt: m.updated_at || new Date().toISOString() } : msg));
    };
    const handleDelete = (payload: any) => {
      const old = payload.old as any;
      if (old?.id) setMessages((prev) => prev.filter((msg) => msg.id !== old.id));
    };

    const ch1 = supabase.channel(`dm-incoming-${pairKey}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'direct_messages', filter: `sender_id=eq.${dmUser.userId}` }, handleInsert)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'direct_messages', filter: `sender_id=eq.${dmUser.userId}` }, handleUpdate)
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'direct_messages', filter: `sender_id=eq.${dmUser.userId}` }, handleDelete)
      .subscribe((status, err) => {
        if (status === 'CHANNEL_ERROR') {
          console.error('DM incoming channel error:', err);
          setTimeout(() => { supabase.removeChannel(ch1); }, 2000);
        }
      });

    const ch2 = supabase.channel(`dm-outgoing-${pairKey}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'direct_messages', filter: `sender_id=eq.${user.id}` }, handleInsert)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'direct_messages', filter: `sender_id=eq.${user.id}` }, handleUpdate)
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'direct_messages', filter: `sender_id=eq.${user.id}` }, handleDelete)
      .subscribe((status, err) => {
        if (status === 'CHANNEL_ERROR') {
          console.error('DM outgoing channel error:', err);
          setTimeout(() => { supabase.removeChannel(ch2); }, 2000);
        }
      });

    return () => { supabase.removeChannel(ch1); supabase.removeChannel(ch2); };
  }, [user?.id, dmUser.userId]);

  useEffect(() => {
    if (!user) return;
    const pairKey = [user.id, dmUser.userId].sort().join('-');
    const typingChannel = supabase.channel(`dm-typing-${pairKey}`);
    typingChannelRef.current = typingChannel;
    typingChannel
      .on('broadcast', { event: 'typing' }, (payload) => { if (payload.payload?.userId === dmUserIdRef.current) setIsTyping(true); })
      .on('broadcast', { event: 'stop_typing' }, (payload) => { if (payload.payload?.userId === dmUserIdRef.current) setIsTyping(false); })
      .subscribe();
    return () => { typingChannelRef.current = null; supabase.removeChannel(typingChannel); };
  }, [user?.id, dmUser.userId]);

  const sendTypingEvent = useCallback(() => {
    if (!user || !typingChannelRef.current) return;
    const now = Date.now();
    if (now - lastTypingSentRef.current < 2000) return;
    lastTypingSentRef.current = now;
    typingChannelRef.current.send({ type: 'broadcast', event: 'typing', payload: { userId: user.id } });
    setTimeout(() => { typingChannelRef.current?.send({ type: 'broadcast', event: 'stop_typing', payload: { userId: user.id } }); }, 3000);
  }, [user]);

  const stopTypingEvent = useCallback(() => {
    if (!user || !typingChannelRef.current) return;
    typingChannelRef.current.send({ type: 'broadcast', event: 'stop_typing', payload: { userId: user.id } });
  }, [user]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    if (pendingFiles.length + files.length > MAX_FILES) { toast.error(t('chat.maxFiles')); return; }
    for (const f of files) { if (f.size > MAX_FILE_SIZE) { toast.error(t('chat.fileTooLarge')); return; } }
    setPendingFiles((prev) => [...prev, ...files].slice(0, MAX_FILES));
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [pendingFiles, t]);

  const handleSend = useCallback(async (overrideContent?: string) => {
    const contentToSend = overrideContent ?? input.trim();
    if ((!contentToSend && pendingFiles.length === 0) || !user || !profile) return;
    const content = contentToSend;
    const filesToUpload = [...pendingFiles];
    setInput('');
    setPendingFiles([]);
    stopTypingEvent();

    const tempId = crypto.randomUUID();
    const optimistic: DMMessage = { id: tempId, senderId: user.id, content, createdAt: new Date().toISOString(), updatedAt: null, senderName: profile.display_name, senderAvatar: profile.avatar_url || null, status: 'sending' };
    setMessages((prev) => [...prev, optimistic]);

    let attachmentUrls: string[] | undefined;
    if (filesToUpload.length > 0) {
      setUploading(true);
      attachmentUrls = await uploadFiles(filesToUpload, user.id, tempId, 'dm');
      setUploading(false);
      if (attachmentUrls.length === 0 && !content) {
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        toast.error(t('settings.uploadFailed'));
        return;
      }
    }

    const insertData: any = { sender_id: user.id, receiver_id: dmUser.userId, content: content || '' };
    if (attachmentUrls && attachmentUrls.length > 0) insertData.attachments = attachmentUrls;

    const { data, error } = await supabase.from('direct_messages').insert(insertData).select().single();
    if (error) { setMessages((prev) => prev.map((m) => m.id === tempId ? { ...m, status: 'failed' as const } : m)); }
    else if (data) { setMessages((prev) => prev.map((m) => m.id === tempId ? { ...m, id: (data as any).id, status: undefined, attachments: attachmentUrls } : m)); }
  }, [input, user, profile, dmUser, stopTypingEvent, pendingFiles, t]);

  const handleEdit = async (msgId: string) => {
    if (!editValue.trim()) return;
    const { error } = await supabase.from('direct_messages').update({ content: editValue.trim() } as any).eq('id', msgId);
    if (!error) { setMessages((prev) => prev.map((m) => m.id === msgId ? { ...m, content: editValue.trim(), updatedAt: new Date().toISOString() } : m)); }
    setEditingId(null); setEditValue('');
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const id = deleteId;
    setDeleteId(null);
    const { error } = await supabase.from('direct_messages').delete().eq('id', id);
    if (!error) { setMessages((prev) => prev.filter((m) => m.id !== id)); }
  };

  const handleRetrySend = useCallback(async (msg: DMMessage) => {
    if (!user || !profile) return;
    setMessages((prev) => prev.map((m) => m.id === msg.id ? { ...m, status: 'sending' as const } : m));
    const insertData: any = { sender_id: user.id, receiver_id: dmUser.userId, content: msg.content };
    if (msg.attachments) insertData.attachments = msg.attachments;
    const { data, error } = await supabase.from('direct_messages').insert(insertData).select().single();
    if (error) { setMessages((prev) => prev.map((m) => m.id === msg.id ? { ...m, status: 'failed' as const } : m)); }
    else if (data) { setMessages((prev) => prev.map((m) => m.id === msg.id ? { ...m, id: (data as any).id, status: undefined } : m)); }
  }, [user, profile, dmUser]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    if (e.target.value.trim()) sendTypingEvent(); else stopTypingEvent();
  };

  const isOwnMessage = (msg: DMMessage) => msg.senderId === user?.id;

  // Group consecutive messages from same sender
  const shouldShowAvatar = (msg: DMMessage, idx: number) => {
    if (idx === 0) return true;
    const prev = messages[idx - 1];
    return prev.senderId !== msg.senderId || (new Date(msg.createdAt).getTime() - new Date(prev.createdAt).getTime() > 5 * 60 * 1000);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 min-h-0 h-full overflow-hidden bg-background">
      {/* Header */}
      <div className={`flex items-center px-4 border-b border-border shadow-sm gap-3 ${isMobile ? 'h-14 pt-[env(safe-area-inset-top)]' : 'h-12'}`}>
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="relative">
            <Avatar className={`${isMobile ? 'h-8 w-8' : 'h-7 w-7'}`}>
              {dmUser.avatarUrl && <AvatarImage src={dmUser.avatarUrl} />}
              <AvatarFallback className="bg-secondary text-foreground text-xs font-semibold">{dmUser.displayName.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-background" />
          </div>
          <div className="min-w-0">
            <span className="font-semibold text-foreground text-sm block truncate">{dmUser.displayName}</span>
            <span className="text-[11px] text-muted-foreground block truncate">@{dmUser.username}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors" title="Sesli Arama">
            <Phone className="w-4 h-4" />
          </button>
          <button className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors" title="Görüntülü Arama">
            <Video className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto overscroll-contain scrollbar-thin px-3 md:px-4 py-4 space-y-0.5" style={{ minHeight: 0 }}>
        {/* Conversation start */}
        <div className="mb-6 flex flex-col items-center text-center py-8">
          <Avatar className={`${isMobile ? 'h-16 w-16' : 'h-20 w-20'} mb-3 ring-4 ring-secondary`}>
            {dmUser.avatarUrl && <AvatarImage src={dmUser.avatarUrl} />}
            <AvatarFallback className="bg-secondary text-foreground text-2xl font-bold">{dmUser.displayName.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <h2 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-foreground`}>{dmUser.displayName}</h2>
          <p className="text-muted-foreground text-xs mt-1">@{dmUser.username}</p>
          <p className="text-muted-foreground text-sm mt-2 max-w-xs">{t('dm.conversationStart', { username: dmUser.username })}</p>
        </div>

        {messages.map((msg, idx) => {
          const own = isOwnMessage(msg);
          const showAvatar = shouldShowAvatar(msg, idx);

          return (
            <div
              key={msg.id}
              className={`group flex gap-2.5 py-0.5 px-2 rounded-lg transition-colors ${
                own ? 'flex-row-reverse' : ''
              } ${showAvatar ? 'mt-3' : 'mt-0.5'} ${
                msg.status === 'sending' ? 'opacity-50' : ''
              } ${msg.status === 'failed' ? 'border border-destructive/40 bg-destructive/5' : ''
              } hover:bg-secondary/20`}
            >
              {/* Avatar */}
              <div className={`shrink-0 ${isMobile ? 'w-8' : 'w-9'}`}>
                {showAvatar ? (
                  <Avatar className={`${isMobile ? 'h-8 w-8' : 'h-9 w-9'}`}>
                    {msg.senderAvatar && <AvatarImage src={msg.senderAvatar} />}
                    <AvatarFallback className="bg-secondary text-foreground text-xs font-semibold">{msg.senderName.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                ) : null}
              </div>

              {/* Message content */}
              <div className={`min-w-0 flex-1 ${own ? 'items-end' : 'items-start'}`}>
                {showAvatar && (
                  <div className={`flex items-baseline gap-2 ${own ? 'flex-row-reverse' : ''}`}>
                    <span className="font-semibold text-[13px] text-foreground">{msg.senderName}</span>
                    <span className="text-[10px] text-muted-foreground">{formatTimestamp(msg.createdAt)}</span>
                    {msg.updatedAt && <span className="text-[9px] text-muted-foreground italic">{t('dm.edited')}</span>}
                  </div>
                )}

                {editingId === msg.id ? (
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleEdit(msg.id); if (e.key === 'Escape') { setEditingId(null); setEditValue(''); } }}
                      className="flex-1 bg-input rounded-lg px-3 py-1.5 text-sm outline-none text-foreground ring-1 ring-border focus:ring-primary/40"
                      autoFocus
                    />
                    <button onClick={() => handleEdit(msg.id)} className="text-primary hover:text-primary/80"><Check className="w-4 h-4" /></button>
                    <button onClick={() => { setEditingId(null); setEditValue(''); }} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <div className={`${own ? 'text-right' : ''}`}>
                    {msg.content && (
                      <div className={`inline-block rounded-2xl px-3.5 py-2 text-sm max-w-[85%] ${
                        own
                          ? 'bg-primary text-primary-foreground rounded-br-md'
                          : 'bg-secondary/60 text-foreground rounded-bl-md'
                      }`}>
                        {renderMessageContent(msg.content)}
                      </div>
                    )}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <MessageAttachments attachments={msg.attachments} />
                    )}
                    {msg.status === 'sending' && !showAvatar && (
                      <span className="text-[10px] text-muted-foreground italic ml-1">{t('dm.sending')}</span>
                    )}
                    {msg.status === 'failed' && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-destructive">{t('dm.failed')}</span>
                        <button onClick={() => handleRetrySend(msg)} className="text-xs text-primary hover:underline">{t('dm.retry')}</button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              {own && editingId !== msg.id && !msg.status && (
                <div className={`${isMobile ? 'flex' : 'hidden group-hover:flex'} items-center gap-0.5 shrink-0 self-start mt-1`}>
                  <button onClick={() => { setEditingId(msg.id); setEditValue(msg.content); }} className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors" title={t('dm.edit')}>
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setDeleteId(msg.id)} className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" title={t('dm.delete')}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Typing indicator */}
      {isTyping && (
        <div className="flex items-center gap-1.5 px-4 py-1 text-xs text-muted-foreground h-6">
          <span className="inline-flex gap-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
          </span>
          <span className="font-medium">{t('dm.typing', { user: dmUser.displayName })}</span>
        </div>
      )}

      <FileUploadPreview files={pendingFiles} onRemove={(i) => setPendingFiles((p) => p.filter((_, idx) => idx !== i))} uploading={uploading} />

      {/* Input area */}
      <div className={`px-3 md:px-4 ${isMobile ? 'pb-[calc(0.75rem+env(safe-area-inset-bottom))]' : 'pb-5'}`}>
        <div className="bg-secondary/40 rounded-2xl flex items-center px-3 md:px-4 gap-2 ring-1 ring-border focus-within:ring-primary/40 transition-all">
          <input type="file" ref={fileInputRef} accept="image/*" multiple className="hidden" onChange={handleFileSelect} />
          <button onClick={() => fileInputRef.current?.click()} className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
            <PlusCircle className={`${isMobile ? 'w-5 h-5' : 'w-5 h-5'}`} />
          </button>
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={t('dm.messagePlaceholder', { user: dmUser.displayName })}
            className={`flex-1 bg-transparent ${isMobile ? 'py-3 text-[16px]' : 'py-3 text-sm'} outline-none text-foreground placeholder:text-muted-foreground`}
          />
          <div className="flex items-center gap-1.5 text-muted-foreground shrink-0">
            {!isMobile && (
              <button onClick={() => fileInputRef.current?.click()} className="hover:text-foreground transition-colors p-1">
                <ImagePlus className="w-5 h-5" />
              </button>
            )}
            <GifPicker onGifSelect={(url) => handleSend(url)} />
            <EmojiPicker onEmojiSelect={(emoji) => setInput(prev => prev + emoji)} />
            {(input.trim() || pendingFiles.length > 0) && (
              <button onClick={() => handleSend()} className="bg-primary text-primary-foreground rounded-full p-1.5 hover:bg-primary/90 transition-colors ml-1">
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Delete dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('dm.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('dm.deleteDesc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('dm.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{t('dm.delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export { uploadFiles };
export default DMChatArea;
