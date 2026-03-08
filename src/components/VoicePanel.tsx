import { useState } from 'react';
import { Mic, MicOff, Headphones, HeadphoneOff, PhoneOff, Volume2 } from 'lucide-react';
import { useTranslation } from '@/i18n';

interface VoicePanelProps {
  channelName: string;
  onDisconnect: () => void;
  micMuted: boolean;
  deafened: boolean;
  onToggleMic: () => void;
  onToggleDeafen: () => void;
}

const VoicePanel = ({ channelName, onDisconnect, micMuted, deafened, onToggleMic, onToggleDeafen }: VoicePanelProps) => {
  const { t } = useTranslation();

  return (
    <div className="bg-server-bg border-t border-border px-3 py-2 space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <div className="w-2 h-2 rounded-full bg-status-online animate-pulse" />
          <span className="text-xs font-medium text-status-online">{t('voice.connected')}</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <Volume2 className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground truncate">{channelName}</span>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={onToggleMic}
          className={`flex-1 p-2 rounded-lg transition-colors ${micMuted ? 'bg-destructive/20 text-destructive' : 'bg-secondary/60 text-muted-foreground hover:text-foreground'}`}
        >
          {micMuted ? <MicOff className="w-4 h-4 mx-auto" /> : <Mic className="w-4 h-4 mx-auto" />}
        </button>
        <button
          onClick={onToggleDeafen}
          className={`flex-1 p-2 rounded-lg transition-colors ${deafened ? 'bg-destructive/20 text-destructive' : 'bg-secondary/60 text-muted-foreground hover:text-foreground'}`}
        >
          {deafened ? <HeadphoneOff className="w-4 h-4 mx-auto" /> : <Headphones className="w-4 h-4 mx-auto" />}
        </button>
        <button
          onClick={onDisconnect}
          className="flex-1 p-2 rounded-lg bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors"
        >
          <PhoneOff className="w-4 h-4 mx-auto" />
        </button>
      </div>
    </div>
  );
};

export default VoicePanel;
