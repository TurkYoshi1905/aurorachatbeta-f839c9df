import { useState, useEffect, useRef } from 'react';
import { DbMessage } from '@/pages/Index';
import { Hash, Users, Pin, Bell, Search, SmilePlus, PlusCircle, Gift, ImagePlus, Send, ArrowLeft } from 'lucide-react';

interface ChatAreaProps {
  channelName: string;
  messages: DbMessage[];
  onSendMessage: (content: string) => void;
  onToggleMembers: () => void;
  showMembers: boolean;
  isMobile?: boolean;
  onBack?: () => void;
}

const ChatArea = ({ channelName, messages, onSendMessage, onToggleMembers, showMembers, isMobile, onBack }: ChatAreaProps) => {
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSendMessage(input.trim());
    setInput('');
  };

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <div className="h-12 flex items-center px-4 border-b border-border shadow-sm gap-2">
        {isMobile && onBack && (
          <button onClick={onBack} className="mr-1 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <Hash className="w-5 h-5 text-muted-foreground" />
        <span className="font-semibold text-foreground">{channelName}</span>
        <div className="ml-auto flex items-center gap-3 text-muted-foreground">
          {!isMobile && (
            <>
              <button className="hover:text-foreground transition-colors"><Pin className="w-4 h-4" /></button>
              <button className="hover:text-foreground transition-colors"><Bell className="w-4 h-4" /></button>
            </>
          )}
          <button
            onClick={onToggleMembers}
            className={`hover:text-foreground transition-colors ${showMembers ? 'text-foreground' : ''}`}
          >
            <Users className="w-4 h-4" />
          </button>
          {!isMobile && (
            <div className="relative">
              <Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Ara"
                className="bg-server-bg rounded-md pl-7 pr-2 py-1 text-xs w-36 focus:w-48 transition-all outline-none text-foreground placeholder:text-muted-foreground"
              />
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-4 space-y-4">
        <div className="mb-6">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center text-3xl mb-3">
            <Hash className="w-8 h-8 text-foreground" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">#{channelName} kanalına hoş geldiniz!</h2>
          <p className="text-muted-foreground text-sm mt-1">Bu #{channelName} kanalının başlangıcıdır.</p>
        </div>

        {messages.map((msg) => (
          <div key={msg.id} className="flex gap-3 group hover:bg-secondary/30 -mx-2 px-2 py-1 rounded-md transition-colors">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 font-semibold ${
              msg.isBot ? 'bg-primary/20 aurora-glow' : 'bg-secondary'
            }`}>
              {msg.avatar}
            </div>
            <div className="min-w-0">
              <div className="flex items-baseline gap-2">
                <span className={`font-medium text-sm ${msg.isBot ? 'text-primary' : 'text-foreground'}`}>
                  {msg.author}
                </span>
                {msg.isBot && (
                  <span className="text-[9px] bg-primary text-primary-foreground px-1 py-0.5 rounded font-bold uppercase">Bot</span>
                )}
                <span className="text-[11px] text-muted-foreground">{msg.timestamp}</span>
              </div>
              <p className="text-sm text-secondary-foreground leading-relaxed">{msg.content}</p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

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
            placeholder={`#${channelName} kanalına mesaj gönder`}
            className="flex-1 bg-transparent py-3 text-sm outline-none text-foreground placeholder:text-muted-foreground"
          />
          <div className="flex items-center gap-2 text-muted-foreground">
            {!isMobile && (
              <>
                <button className="hover:text-foreground transition-colors"><Gift className="w-5 h-5" /></button>
                <button className="hover:text-foreground transition-colors"><ImagePlus className="w-5 h-5" /></button>
              </>
            )}
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

export default ChatArea;
