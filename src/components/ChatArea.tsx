import { useState, useEffect, useRef, useCallback } from 'react';
import { DbMessage, DbReaction } from '@/pages/Index';
import { Hash, Users, Pin, Bell, Search, SmilePlus, PlusCircle, Gift, ImagePlus, Send, ArrowLeft, Trash2, Pencil, Check, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import ServerInviteEmbed from './ServerInviteEmbed';
import LinkEmbed from './LinkEmbed';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useTranslation } from '@/i18n';

const EMOJI_LIST = ['👍', '❤️', '😂', '😮', '😢', '😡', '🎉', '🔥', '👀', '💯', '✅', '❌', '🤔', '👏', '💪', '🙏', '😎', '🥳', '💀', '😭', '🫡', '👎', '💜', '🧡'];

interface ChatAreaProps {
  channelName: string;
  messages: DbMessage[];
  onSendMessage: (content: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  onEditMessage?: (messageId: string, newContent: string) => void;
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
}

export const renderMessageContent = (content: string) => {
  const inviteRegex = /https?:\/\/[^\s]+invite\/([a-zA-Z0-9]+)/g;
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const inviteCodes: string[] = [];
  let inviteMatch;
  while ((inviteMatch = inviteRegex.exec(content)) !== null) { inviteCodes.push(inviteMatch[1]); }
  const parts = content.split(urlRegex);
  const elements = parts.map((part, i) => {
    if (urlRegex.test(part)) { urlRegex.lastIndex = 0; return (<a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">{part}</a>); }
    return <span key={i}>{part}</span>;
  });
  const embeds = inviteCodes.map((code) => (<ServerInviteEmbed key={code} code={code} />));
  const allUrls: string[] = [];
  let urlMatch;
  const urlScanRegex = /(https?:\/\/[^\s]+)/g;
  while ((urlMatch = urlScanRegex.exec(content)) !== null) { allUrls.push(urlMatch[1]); }
  const inviteUrlRegex = /https?:\/\/[^\s]+invite\/[a-zA-Z0-9]+/;
  const nonInviteUrls = allUrls.filter((u) => !inviteUrlRegex.test(u));
  return (
    <>
      <p className="text-sm text-secondary-foreground leading-relaxed">{elements}</p>
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

const ChatArea = ({ channelName, messages, onSendMessage, onDeleteMessage, onEditMessage, onToggleMembers, showMembers, isOwner, isMobile, onBack, reactions, onToggleReaction, typingUsers, onTypingStart, onTypingStop }: ChatAreaProps) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [input, setInput] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const lastTypingSentRef = useRef<number>(0);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { if (editingId) editInputRef.current?.focus(); }, [editingId]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInput(val);
    if (val.trim()) { const now = Date.now(); if (now - lastTypingSentRef.current > 2000) { lastTypingSentRef.current = now; onTypingStart?.(); } }
    else { onTypingStop?.(); }
  }, [onTypingStart, onTypingStop]);

  const handleSend = () => { if (!input.trim()) return; onSendMessage(input.trim()); setInput(''); onTypingStop?.(); };
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
          {!isMobile && (<><button className="hover:text-foreground transition-colors"><Pin className="w-4 h-4" /></button><button className="hover:text-foreground transition-colors"><Bell className="w-4 h-4" /></button></>)}
          <button onClick={onToggleMembers} className={`hover:text-foreground transition-colors ${showMembers ? 'text-foreground' : ''}`}><Users className="w-4 h-4" /></button>
          {!isMobile && (
            <div className="relative">
              <Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input type="text" placeholder={t('chat.search')} className="bg-server-bg rounded-md pl-7 pr-2 py-1 text-xs w-36 focus:w-48 transition-all outline-none text-foreground placeholder:text-muted-foreground" />
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain scrollbar-thin px-4 py-4 space-y-4" style={{ minHeight: 0 }}>
        <div className="mb-6">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center text-3xl mb-3"><Hash className="w-8 h-8 text-foreground" /></div>
          <h2 className="text-2xl font-bold text-foreground">{t('chat.welcomeChannel', { channel: channelName })}</h2>
          <p className="text-muted-foreground text-sm mt-1">{t('chat.channelStart', { channel: channelName })}</p>
        </div>

        {messages.map((msg) => {
          const msgReactions = reactions?.[msg.id] || [];
          return (
            <div key={msg.id} className="flex gap-3 group hover:bg-secondary/30 -mx-2 px-2 py-1 rounded-md transition-colors relative">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 font-semibold overflow-hidden ${msg.isBot ? 'bg-primary/20 aurora-glow' : 'bg-secondary'}`}>
                {msg.avatarUrl ? (<img src={msg.avatarUrl} alt="" className="w-full h-full object-cover" />) : (msg.avatar)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className={`font-medium text-sm ${msg.isBot ? 'text-primary' : 'text-foreground'}`}>{msg.author}</span>
                  {msg.isBot && (<span className="text-[9px] bg-primary text-primary-foreground px-1 py-0.5 rounded font-bold uppercase">Bot</span>)}
                  <span className="text-[11px] text-muted-foreground">{msg.timestamp}</span>
                  {msg.edited && (<span className="text-[10px] text-muted-foreground italic">{t('chat.edited')}</span>)}
                </div>
                {editingId === msg.id ? (
                  <div className="flex items-center gap-2 mt-1">
                    <input ref={editInputRef} value={editContent} onChange={(e) => setEditContent(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') confirmEdit(); if (e.key === 'Escape') cancelEdit(); }} className="flex-1 bg-input rounded px-2 py-1 text-sm outline-none text-foreground" />
                    <button onClick={confirmEdit} className="text-green-500 hover:text-green-400 transition-colors"><Check className="w-4 h-4" /></button>
                    <button onClick={cancelEdit} className="text-muted-foreground hover:text-foreground transition-colors"><X className="w-4 h-4" /></button>
                  </div>
                ) : (renderMessageContent(msg.content))}
                {msgReactions.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {msgReactions.map((r) => {
                      const hasReacted = user ? r.userIds.includes(user.id) : false;
                      return (<button key={r.emoji} onClick={() => onToggleReaction?.(msg.id, r.emoji)} className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-md border transition-colors ${hasReacted ? 'bg-primary/20 border-primary/40 text-primary' : 'bg-secondary/50 border-border text-muted-foreground hover:bg-secondary'}`}><span>{r.emoji}</span><span className="font-medium">{r.count}</span></button>);
                    })}
                  </div>
                )}
              </div>
              {editingId !== msg.id && (
                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-all">
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
                  {msg.userId === user?.id && onEditMessage && (<button onClick={() => startEdit(msg)} className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-all" title={t('chat.editMessage')}><Pencil className="w-3.5 h-3.5" /></button>)}
                  {(msg.userId === user?.id || isOwner) && onDeleteMessage && (<button onClick={() => onDeleteMessage(msg.id)} className="p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-all" title={t('chat.deleteMessage')}><Trash2 className="w-3.5 h-3.5" /></button>)}
                </div>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <TypingIndicator typingUsers={typingUsers || []} t={t} />

      <div className="px-4 pb-6">
        <div className="bg-input rounded-xl flex items-center px-4 gap-2 ring-1 ring-border focus-within:ring-primary/40 transition-all">
          <button className="text-muted-foreground hover:text-foreground transition-colors"><PlusCircle className="w-5 h-5" /></button>
          <input type="text" value={input} onChange={handleInputChange} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder={t('chat.messagePlaceholder', { channel: channelName })} className="flex-1 bg-transparent py-3 text-sm outline-none text-foreground placeholder:text-muted-foreground" />
          <div className="flex items-center gap-2 text-muted-foreground">
            {!isMobile && (<><button className="hover:text-foreground transition-colors"><Gift className="w-5 h-5" /></button><button className="hover:text-foreground transition-colors"><ImagePlus className="w-5 h-5" /></button></>)}
            <button className="hover:text-foreground transition-colors"><SmilePlus className="w-5 h-5" /></button>
            {input.trim() && (<button onClick={handleSend} className="text-primary hover:text-primary/80 transition-colors"><Send className="w-5 h-5" /></button>)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatArea;
