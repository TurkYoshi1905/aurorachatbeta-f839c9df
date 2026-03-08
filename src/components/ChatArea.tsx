import { useState, useEffect, useRef, useCallback } from 'react';
import { DbMessage, DbReaction, DbMember } from '@/pages/Index';
import { Hash, Users, Pin, Bell, Search, SmilePlus, PlusCircle, Gift, ImagePlus, Send, ArrowLeft, Trash2, Pencil, Check, X, Lock, SendHorizontal, Reply, CornerDownRight, MessageSquare } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';
import ImageLightbox from './ImageLightbox';
import ServerInviteEmbed from './ServerInviteEmbed';
import LinkEmbed from './LinkEmbed';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useTranslation } from '@/i18n';
import MessageAttachments from './MessageAttachments';
import FileUploadPreview from './FileUploadPreview';
import { toast } from 'sonner';
import EmojiPicker from './EmojiPicker';
import GifPicker from './GifPicker';
import MentionPopup from './MentionPopup';
import SlashCommandPopup from './SlashCommandPopup';
import UserProfileCard from './UserProfileCard';
import { ScrollArea } from '@/components/ui/scroll-area';

const EMOJI_LIST = ['👍', '❤️', '😂', '😮', '😢', '😡', '🎉', '🔥', '👀', '💯', '✅', '❌', '🤔', '👏', '💪', '🙏', '😎', '🥳', '💀', '😭', '🫡', '👎', '💜', '🧡'];

const MAX_FILES = 3;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface ServerEmoji { id: string; name: string; image_url: string; }

interface ChatAreaProps {
  channelName: string;
  messages: DbMessage[];
  onSendMessage: (content: string, files?: File[], replyTo?: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  onEditMessage?: (messageId: string, newContent: string) => void;
  onRetryMessage?: (messageId: string, content: string) => void;
  onToggleMembers: () => void;
  showMembers: boolean;
  isOwner?: boolean;
  isMobile?: boolean;
  onBack?: () => void;
  reactions?: Record<string, DbReaction[]>;
  onToggleReaction?: (messageId: string, emoji: string) => void;
  typingUsers?: { userId: string; displayName: string }[];
  onTypingStart?: () => void;
  onTypingStop?: () => void;
  members?: DbMember[];
  isLocked?: boolean;
  onPinMessage?: (messageId: string) => void;
  onUnpinMessage?: (messageId: string) => void;
  serverId?: string;
  threadCounts?: Record<string, number>;
  onOpenThread?: (messageId: string, author: string, content: string, threadId: string | null) => void;
  userPermissions?: Record<string, boolean>;
  serverEmojis?: ServerEmoji[];
}

const isGiphyUrl = (url: string) => /giphy\.com\/media\/|\.giphy\.com\//i.test(url);

const GifImage = ({ url }: { url: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <img src={url} alt="GIF" className="max-w-[min(320px,100%)] rounded-lg mt-1 cursor-pointer hover:opacity-90 transition-opacity" loading="lazy" onClick={() => setOpen(true)} />
      <ImageLightbox images={[url]} currentIndex={0} open={open} onOpenChange={setOpen} onIndexChange={() => {}} />
    </>
  );
};

export const renderMessageContent = (content: string, currentUserId?: string, serverEmojis?: ServerEmoji[]) => {
  // Check if entire content is a single Giphy URL
  const trimmed = content.trim();
  if (isGiphyUrl(trimmed) && /^https?:\/\/\S+$/.test(trimmed)) {
    return <GifImage url={trimmed} />;
  }

  const inviteRegex = /https?:\/\/[^\s]+invite\/([a-zA-Z0-9]+)/g;
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const inviteCodes: string[] = [];
  let inviteMatch;
  while ((inviteMatch = inviteRegex.exec(content)) !== null) { inviteCodes.push(inviteMatch[1]); }
  
  // Process mentions: @username pattern
  const mentionRegex = /@(\S+)/g;
  
  const parts = content.split(urlRegex);
  const elements = parts.map((part, i) => {
    if (urlRegex.test(part)) {
      urlRegex.lastIndex = 0;
      if (isGiphyUrl(part)) {
        return <GifImage key={i} url={part} />;
      }
      return (<a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">{part}</a>);
    }
    // Process mentions within text parts
    const mentionParts = part.split(mentionRegex);
    if (mentionParts.length > 1) {
      return (
        <span key={i}>
          {mentionParts.map((mp, j) => {
            if (j % 2 === 1) {
              return <span key={j} className="bg-primary/20 text-primary rounded px-1 font-medium cursor-pointer hover:bg-primary/30">@{mp}</span>;
            }
            return <span key={j}>{mp}</span>;
          })}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
  const embeds = inviteCodes.map((code) => (<ServerInviteEmbed key={code} code={code} />));
  const allUrls: string[] = [];
  let urlMatch;
  const urlScanRegex = /(https?:\/\/[^\s]+)/g;
  while ((urlMatch = urlScanRegex.exec(content)) !== null) { allUrls.push(urlMatch[1]); }
  const inviteUrlRegex = /https?:\/\/[^\s]+invite\/[a-zA-Z0-9]+/;
  const nonInviteUrls = allUrls.filter((u) => !inviteUrlRegex.test(u) && !isGiphyUrl(u));
  // Process custom server emojis :name: pattern
  const processCustomEmojis = (node: React.ReactNode): React.ReactNode => {
    if (typeof node !== 'string') return node;
    if (!serverEmojis || serverEmojis.length === 0) return node;
    const emojiRegex = /:([a-z0-9_]+):/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;
    while ((match = emojiRegex.exec(node)) !== null) {
      const emoji = serverEmojis.find(e => e.name === match![1]);
      if (emoji) {
        if (match.index > lastIndex) parts.push(node.slice(lastIndex, match.index));
        parts.push(<img key={`emoji-${match.index}`} src={emoji.image_url} alt={`:${emoji.name}:`} title={`:${emoji.name}:`} className="inline-block w-6 h-6 object-contain align-middle mx-0.5" />);
        lastIndex = match.index + match[0].length;
      }
    }
    if (lastIndex === 0) return node;
    if (lastIndex < node.length) parts.push(node.slice(lastIndex));
    return <>{parts}</>;
  };

  return (
    <>
      <p className="text-sm text-secondary-foreground leading-relaxed">{elements.map((el, i) => {
        if (typeof el === 'string') return <span key={i}>{processCustomEmojis(el)}</span>;
        if (el && typeof el === 'object' && 'props' in el && el.props?.children) {
          // For span elements containing text
          return el;
        }
        return el;
      })}</p>
      {embeds.length > 0 && <div className="flex flex-col gap-1">{embeds}</div>}
      {nonInviteUrls.map((u) => (<LinkEmbed key={u} url={u} />))}
    </>
  );
};

const TypingIndicator = ({ typingUsers, t }: { typingUsers: { userId: string; displayName: string }[]; t: (key: string, vars?: Record<string, string | number>) => string }) => {
  if (typingUsers.length === 0) return null;
  let text = '';
  if (typingUsers.length === 1) { text = t('chat.typing1', { user: typingUsers[0].displayName }); }
  else if (typingUsers.length === 2) { text = t('chat.typing2', { user1: typingUsers[0].displayName, user2: typingUsers[1].displayName }); }
  else if (typingUsers.length === 3) { text = t('chat.typing3', { user1: typingUsers[0].displayName, user2: typingUsers[1].displayName, user3: typingUsers[2].displayName }); }
  else { text = t('chat.typingMany', { count: typingUsers.length }); }
  return (
    <div className="flex items-center gap-1.5 px-4 py-1 text-xs text-muted-foreground h-6">
      <span className="inline-flex gap-0.5">
        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
      </span>
      <span className="font-medium">{text}</span>
    </div>
  );
};

const ChatArea = ({ channelName, messages, onSendMessage, onDeleteMessage, onEditMessage, onRetryMessage, onToggleMembers, showMembers, isOwner, isMobile, onBack, reactions, onToggleReaction, typingUsers, onTypingStart, onTypingStop, members = [], isLocked, onPinMessage, onUnpinMessage, serverId, threadCounts, onOpenThread, userPermissions, serverEmojis }: ChatAreaProps) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const isMobileDevice = useIsMobile();
  const [plusMenuOpen, setPlusMenuOpen] = useState(false);
  const [input, setInput] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [showMentionPopup, setShowMentionPopup] = useState(false);
  const [showSlashPopup, setShowSlashPopup] = useState(false);
  const [slashQuery, setSlashQuery] = useState('');
  const [mentionQuery, setMentionQuery] = useState('');
  const [replyingTo, setReplyingTo] = useState<DbMessage | null>(null);
  const [showPinnedPanel, setShowPinnedPanel] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastTypingSentRef = useRef<number>(0);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const pinnedMessages = messages.filter(m => m.isPinned);

  useEffect(() => { requestAnimationFrame(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }); }, [messages]);
  useEffect(() => { if (editingId) editInputRef.current?.focus(); }, [editingId]);

  const scrollToMessage = useCallback((messageId: string) => {
    const el = document.getElementById(`msg-${messageId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('bg-primary/10');
      setTimeout(() => el.classList.remove('bg-primary/10'), 2000);
    }
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInput(val);
    
    if (val.startsWith('/')) {
      setShowSlashPopup(true);
      setSlashQuery(val.slice(1).split(' ')[0]);
    } else {
      setShowSlashPopup(false);
      setSlashQuery('');
    }
    
    const cursorPos = e.target.selectionStart || val.length;
    const textBeforeCursor = val.slice(0, cursorPos);
    const mentionMatch = textBeforeCursor.match(/@(\S*)$/);
    if (mentionMatch) {
      setShowMentionPopup(true);
      setMentionQuery(mentionMatch[1]);
    } else {
      setShowMentionPopup(false);
      setMentionQuery('');
    }
    
    if (val.trim()) { const now = Date.now(); if (now - lastTypingSentRef.current > 2000) { lastTypingSentRef.current = now; onTypingStart?.(); } }
    else { onTypingStop?.(); }
  }, [onTypingStart, onTypingStop]);

  const handleSlashSelect = useCallback((cmd: string) => {
    setInput(cmd + ' ');
    setShowSlashPopup(false);
    setSlashQuery('');
    inputRef.current?.focus();
  }, []);

  const handleMentionSelect = useCallback((name: string) => {
    const cursorPos = inputRef.current?.selectionStart || input.length;
    const textBeforeCursor = input.slice(0, cursorPos);
    const mentionMatch = textBeforeCursor.match(/@(\S*)$/);
    if (mentionMatch) {
      const beforeMention = textBeforeCursor.slice(0, mentionMatch.index);
      const afterCursor = input.slice(cursorPos);
      setInput(`${beforeMention}@${name} ${afterCursor}`);
    }
    setShowMentionPopup(false);
    setMentionQuery('');
    inputRef.current?.focus();
  }, [input]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const totalFiles = pendingFiles.length + files.length;
    if (totalFiles > MAX_FILES) { toast.error(t('chat.maxFiles')); return; }
    for (const f of files) {
      if (f.size > MAX_FILE_SIZE) { toast.error(t('chat.fileTooLarge')); return; }
    }
    setPendingFiles((prev) => [...prev, ...files].slice(0, MAX_FILES));
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [pendingFiles, t]);

  const handleRemoveFile = useCallback((index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSend = () => {
    if (!input.trim() && pendingFiles.length === 0) return;
    onSendMessage(input.trim(), pendingFiles.length > 0 ? pendingFiles : undefined, replyingTo?.id);
    setInput('');
    setPendingFiles([]);
    setReplyingTo(null);
    onTypingStop?.();
  };

  const startEdit = (msg: DbMessage) => { setEditingId(msg.id); setEditContent(msg.content); };
  const cancelEdit = () => { setEditingId(null); setEditContent(''); };
  const confirmEdit = () => { if (!editingId || !editContent.trim()) return; onEditMessage?.(editingId, editContent.trim()); setEditingId(null); setEditContent(''); };

  return (
    <div className="flex-1 flex flex-col min-w-0 min-h-0 h-full overflow-hidden">
      <div className="h-12 flex items-center px-4 border-b border-border shadow-sm gap-2">
        {isMobile && onBack && (<button onClick={onBack} className="mr-1 text-muted-foreground hover:text-foreground transition-colors"><ArrowLeft className="w-5 h-5" /></button>)}
        <Hash className="w-5 h-5 text-muted-foreground" />
        <span className="font-semibold text-foreground">{channelName}</span>
        <div className="ml-auto flex items-center gap-3 text-muted-foreground">
          {!isMobile && (
            <>
              <Popover open={showPinnedPanel} onOpenChange={setShowPinnedPanel}>
                <PopoverTrigger asChild>
                  <button className={`hover:text-foreground transition-colors relative ${showPinnedPanel ? 'text-foreground' : ''}`}>
                    <Pin className="w-4 h-4" />
                    {pinnedMessages.length > 0 && (
                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-primary text-primary-foreground text-[8px] flex items-center justify-center font-bold">{pinnedMessages.length}</span>
                    )}
                  </button>
                </PopoverTrigger>
                <PopoverContent side="bottom" align="end" className="w-80 p-0 max-h-96">
                  <div className="p-3 border-b border-border">
                    <h3 className="font-semibold text-sm text-foreground">{t('chat.pinnedMessages')}</h3>
                  </div>
                  <ScrollArea className="max-h-80">
                    {pinnedMessages.length === 0 ? (
                      <p className="p-4 text-sm text-muted-foreground text-center">{t('chat.noPinnedMessages')}</p>
                    ) : (
                      <div className="p-2 space-y-2">
                        {pinnedMessages.map(msg => (
                          <div key={msg.id} className="p-2 rounded-md bg-secondary/50 hover:bg-secondary/80 cursor-pointer transition-colors" onClick={() => { scrollToMessage(msg.id); setShowPinnedPanel(false); }}>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-medium text-foreground">{msg.author}</span>
                              <span className="text-[10px] text-muted-foreground">{msg.timestamp}</span>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">{msg.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </PopoverContent>
              </Popover>
              <button className="hover:text-foreground transition-colors"><Bell className="w-4 h-4" /></button>
            </>
          )}
          <button onClick={onToggleMembers} className={`hover:text-foreground transition-colors ${showMembers ? 'text-foreground' : ''}`}><Users className="w-4 h-4" /></button>
          {!isMobile && (
            <div className="relative">
              <Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input type="text" placeholder={t('chat.search')} className="bg-server-bg rounded-md pl-7 pr-2 py-1 text-xs w-36 focus:w-48 transition-all outline-none text-foreground placeholder:text-muted-foreground" />
            </div>
          )}
        </div>
      </div>

      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto overscroll-contain scrollbar-thin px-4 py-4 space-y-4" style={{ minHeight: 0 }}>
        <div className="mb-6">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center text-3xl mb-3"><Hash className="w-8 h-8 text-foreground" /></div>
          <h2 className="text-2xl font-bold text-foreground">{t('chat.welcomeChannel', { channel: channelName })}</h2>
          <p className="text-muted-foreground text-sm mt-1">{t('chat.channelStart', { channel: channelName })}</p>
        </div>

        {messages.map((msg) => {
          const msgReactions = reactions?.[msg.id] || [];
          const replyRef = msg.replyTo ? messages.find(m => m.id === msg.replyTo) : null;
          return (
            <div key={msg.id} id={`msg-${msg.id}`} className={`flex gap-3 group hover:bg-secondary/30 -mx-2 px-2 py-1 rounded-md transition-colors relative ${msg.status === 'sending' ? 'opacity-50' : ''} ${msg.status === 'failed' ? 'border border-destructive/40 bg-destructive/5' : ''}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 font-semibold overflow-hidden ${msg.isBot ? 'bg-primary/20 aurora-glow' : 'bg-secondary'}`}>
                {msg.avatarUrl ? (<img src={msg.avatarUrl} alt="" className="w-full h-full object-cover" />) : (msg.avatar)}
              </div>
              <div className="min-w-0 flex-1">
                {/* Reply reference */}
                {(replyRef || msg.replyAuthor) && (
                  <button
                    onClick={() => replyRef && scrollToMessage(replyRef.id)}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-0.5 transition-colors"
                  >
                    <CornerDownRight className="w-3 h-3" />
                    <span className="font-medium text-primary">@{replyRef?.author || msg.replyAuthor}</span>
                    <span className="truncate max-w-[200px]">{replyRef?.content || msg.replyContent || ''}</span>
                  </button>
                )}
                <div className="flex items-baseline gap-2">
                  <UserProfileCard userId={msg.userId} serverId={serverId}>
                    <button className={`font-medium text-sm hover:underline ${msg.isBot ? 'text-primary' : 'text-foreground'}`}>{msg.author}</button>
                  </UserProfileCard>
                  {msg.isBot && (<span className="text-[9px] bg-primary text-primary-foreground px-1 py-0.5 rounded font-bold uppercase">Bot</span>)}
                  <span className="text-[11px] text-muted-foreground">{msg.timestamp}</span>
                  {msg.edited && (<span className="text-[10px] text-muted-foreground italic">{t('chat.edited')}</span>)}
                  {msg.status === 'sending' && (<span className="text-[10px] text-muted-foreground italic">{t('chat.sending')}</span>)}
                  {msg.isPinned && (<Pin className="w-3 h-3 text-primary" />)}
                </div>
                {editingId === msg.id ? (
                  <div className="flex items-center gap-2 mt-1">
                    <input ref={editInputRef} value={editContent} onChange={(e) => setEditContent(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') confirmEdit(); if (e.key === 'Escape') cancelEdit(); }} className="flex-1 bg-input rounded px-2 py-1 text-sm outline-none text-foreground" />
                    <button onClick={confirmEdit} className="text-green-500 hover:text-green-400 transition-colors"><Check className="w-4 h-4" /></button>
                    <button onClick={cancelEdit} className="text-muted-foreground hover:text-foreground transition-colors"><X className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <>
                    {msg.content && renderMessageContent(msg.content, user?.id, serverEmojis)}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <MessageAttachments attachments={msg.attachments} />
                    )}
                    {msg.status === 'failed' && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-destructive">{t('chat.failed')}</span>
                        <button onClick={() => onRetryMessage?.(msg.id, msg.content)} className="text-xs text-primary hover:underline">{t('chat.retry')}</button>
                      </div>
                    )}
                  </>
                )}
                {msgReactions.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {msgReactions.map((r) => {
                      const hasReacted = user ? r.userIds.includes(user.id) : false;
                      return (<button key={r.emoji} onClick={() => onToggleReaction?.(msg.id, r.emoji)} className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-md border transition-colors ${hasReacted ? 'bg-primary/20 border-primary/40 text-primary' : 'bg-secondary/50 border-border text-muted-foreground hover:bg-secondary'}`}><span>{r.emoji}</span><span className="font-medium">{r.count}</span></button>);
                    })}
                  </div>
                )}
                {/* Thread count button */}
                {threadCounts && threadCounts[msg.id] > 0 && onOpenThread && (
                  <button
                    onClick={() => onOpenThread(msg.id, msg.author, msg.content, null)}
                    className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 mt-1 transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span className="font-medium">{threadCounts[msg.id]} {t('thread.replies')}</span>
                  </button>
                )}
              </div>
              {editingId !== msg.id && (
                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-all">
                  {/* Reply button */}
                  <button onClick={() => { setReplyingTo(msg); inputRef.current?.focus(); }} className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-all" title={t('chat.reply')}>
                    <Reply className="w-3.5 h-3.5" />
                  </button>
                  {/* Thread button */}
                  {onOpenThread && (
                    <button onClick={() => onOpenThread(msg.id, msg.author, msg.content, null)} className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-all" title={t('thread.startThread')}>
                      <MessageSquare className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {onToggleReaction && (
                    <Popover>
                      <PopoverTrigger asChild><button className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-all" title={t('chat.addReaction')}><SmilePlus className="w-3.5 h-3.5" /></button></PopoverTrigger>
                      <PopoverContent className="w-auto p-2" side="top" align="end">
                        <div className="grid grid-cols-6 gap-1">
                          {EMOJI_LIST.map((emoji) => (<button key={emoji} onClick={() => onToggleReaction(msg.id, emoji)} className="w-8 h-8 flex items-center justify-center rounded hover:bg-secondary text-lg transition-colors">{emoji}</button>))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  )}
                  {/* Pin/Unpin button - owner or permission */}
                  {(isOwner || userPermissions?.pin_messages) && onPinMessage && onUnpinMessage && (
                    <button
                      onClick={() => msg.isPinned ? onUnpinMessage(msg.id) : onPinMessage(msg.id)}
                      className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-all"
                      title={msg.isPinned ? t('chat.unpin') : t('chat.pin')}
                    >
                      <Pin className={`w-3.5 h-3.5 ${msg.isPinned ? 'text-primary' : ''}`} />
                    </button>
                  )}
                  {msg.userId === user?.id && onEditMessage && (<button onClick={() => startEdit(msg)} className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-all" title={t('chat.editMessage')}><Pencil className="w-3.5 h-3.5" /></button>)}
                  {(msg.userId === user?.id || isOwner || userPermissions?.manage_messages) && onDeleteMessage && (<button onClick={() => onDeleteMessage(msg.id)} className="p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-all" title={t('chat.deleteMessage')}><Trash2 className="w-3.5 h-3.5" /></button>)}
                </div>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <TypingIndicator typingUsers={typingUsers || []} t={t} />

      <FileUploadPreview files={pendingFiles} onRemove={handleRemoveFile} />

      {/* Reply preview */}
      {replyingTo && (
        <div className="px-4 py-2 bg-secondary/50 border-t border-border flex items-center gap-2">
          <CornerDownRight className="w-4 h-4 text-primary shrink-0" />
          <span className="text-xs text-muted-foreground">{t('chat.replyingTo')}</span>
          <span className="text-xs font-medium text-foreground truncate">{replyingTo.author}</span>
          <span className="text-xs text-muted-foreground truncate flex-1">{replyingTo.content}</span>
          <button onClick={() => setReplyingTo(null)} className="text-muted-foreground hover:text-foreground shrink-0"><X className="w-4 h-4" /></button>
        </div>
      )}

      <div className={`px-4 relative ${isMobileDevice ? 'pb-[calc(env(safe-area-inset-bottom,0px)+12px)]' : 'pb-6'}`}>
        {showSlashPopup && (
          <SlashCommandPopup
            query={slashQuery}
            onSelect={handleSlashSelect}
            onClose={() => setShowSlashPopup(false)}
            isOwner={!!isOwner}
          />
        )}
        {showMentionPopup && members.length > 0 && (
          <MentionPopup
            query={mentionQuery}
            members={members}
            onSelect={handleMentionSelect}
            onClose={() => setShowMentionPopup(false)}
            position={{ bottom: 60, left: 16 }}
          />
        )}
        {isLocked && !isOwner ? (
          <div className="bg-secondary/50 rounded-xl flex items-center justify-center px-4 py-3 gap-2 text-muted-foreground">
            <Lock className="w-4 h-4" />
            <span className="text-sm">Bu kanal kilitli. Yalnızca sunucu sahibi mesaj gönderebilir.</span>
          </div>
        ) : isMobileDevice ? (
          /* ===== MOBILE INPUT BAR ===== */
          <div className="flex items-center gap-2">
            <Popover open={plusMenuOpen} onOpenChange={setPlusMenuOpen}>
              <PopoverTrigger asChild>
                <button className="text-muted-foreground hover:text-foreground transition-colors shrink-0 p-1">
                  <PlusCircle className="w-6 h-6" />
                </button>
              </PopoverTrigger>
              <PopoverContent side="top" align="start" className="w-48 p-1.5 bg-popover border-border">
                <button onClick={() => { fileInputRef.current?.click(); setPlusMenuOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/70 transition-colors">
                  <ImagePlus className="w-4 h-4" /> Resim Ekle
                </button>
                <div className="w-full">
                  <GifPicker onGifSelect={(url) => { onSendMessage(url); setPlusMenuOpen(false); }}>
                    <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/70 transition-colors">
                      <img src="/src/assets/gif-icon.png" alt="GIF" className="w-4 h-4 opacity-70" /> GIF Gönder
                    </button>
                  </GifPicker>
                </div>
              </PopoverContent>
            </Popover>
            <input type="file" ref={fileInputRef} accept="image/*" multiple className="hidden" onChange={handleFileSelect} />

            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={handleInputChange}
                onKeyDown={(e) => { if (e.key === 'Enter' && !showMentionPopup && !showSlashPopup) handleSend(); }}
                placeholder={t('chat.mobileMessagePlaceholder') || 'Mesaj gönder...'}
                className="w-full bg-input rounded-2xl py-3 pl-4 pr-10 text-sm outline-none text-foreground placeholder:text-muted-foreground ring-1 ring-border focus:ring-primary/40 transition-all min-h-[44px]"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 z-10">
                <EmojiPicker onEmojiSelect={(emoji) => setInput(prev => prev + emoji)} serverEmojis={serverEmojis} />
              </div>
            </div>

            <button
              onClick={handleSend}
              disabled={!input.trim() && pendingFiles.length === 0}
              className="shrink-0 p-2 rounded-full bg-primary text-primary-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <SendHorizontal className="w-5 h-5" />
            </button>
          </div>
        ) : (
          /* ===== DESKTOP INPUT BAR ===== */
          <div className="bg-input rounded-xl flex items-center px-4 gap-2 ring-1 ring-border focus-within:ring-primary/40 transition-all">
            <input type="file" ref={fileInputRef} accept="image/*" multiple className="hidden" onChange={handleFileSelect} />
            <button onClick={() => fileInputRef.current?.click()} className="text-muted-foreground hover:text-foreground transition-colors"><PlusCircle className="w-5 h-5" /></button>
            <input ref={inputRef} type="text" value={input} onChange={handleInputChange} onKeyDown={(e) => { if (e.key === 'Enter' && !showMentionPopup && !showSlashPopup) handleSend(); }} placeholder={t('chat.messagePlaceholder', { channel: channelName })} className="flex-1 bg-transparent py-3 text-sm outline-none text-foreground placeholder:text-muted-foreground" />
            <div className="flex items-center gap-2 text-muted-foreground">
              <button onClick={() => fileInputRef.current?.click()} className="hover:text-foreground transition-colors"><ImagePlus className="w-5 h-5" /></button>
              <GifPicker onGifSelect={(url) => { onSendMessage(url); }} />
              <EmojiPicker onEmojiSelect={(emoji) => setInput(prev => prev + emoji)} serverEmojis={serverEmojis} />
              {(input.trim() || pendingFiles.length > 0) && (<button onClick={handleSend} className="text-primary hover:text-primary/80 transition-colors"><Send className="w-5 h-5" /></button>)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatArea;
