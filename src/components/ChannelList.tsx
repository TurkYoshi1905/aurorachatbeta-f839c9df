import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DbChannel, DbMember, DbCategory } from '@/pages/Index';
import { Hash, Volume2, Settings, Plus, UserPlus, LogOut, ChevronRight, ChevronDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import CreateChannelDialog from '@/components/CreateChannelDialog';
import InviteDialog from '@/components/InviteDialog';
import { useTranslation } from '@/i18n';
import UserInfoPanel from '@/components/UserInfoPanel';
import VoicePanel from '@/components/VoicePanel';
import VoiceParticipants from '@/components/VoiceParticipants';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface VoiceState {
  connected: boolean;
  connecting: boolean;
  voiceChannelId: string | null;
  voiceChannelName: string;
  participants: { identity: string; displayName: string; avatarUrl?: string | null; isSpeaking: boolean }[];
  micMuted: boolean;
  deafened: boolean;
  disconnect: () => void;
  toggleMic: () => void;
  toggleDeafen: () => void;
}

interface ChannelListProps {
  serverName: string; serverId: string; serverIcon: string; channels: DbChannel[];
  categories?: DbCategory[];
  activeChannel: string; onChannelChange: (id: string) => void;
  currentUserStatus?: DbMember['status']; onStatusChange?: (status: DbMember['status']) => void;
  isOwner?: boolean; onChannelCreated?: () => void; onServerDeleted?: () => void;
  onServerUpdated?: () => void; onLeaveServer?: () => void; isMobile?: boolean;
  voiceState?: VoiceState;
}

const ChannelList = ({ serverName, serverId, serverIcon, channels, categories = [], activeChannel, onChannelChange, currentUserStatus = 'offline', onStatusChange, isOwner, onChannelCreated, onServerDeleted, onServerUpdated, onLeaveServer, isMobile, voiceState }: ChannelListProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [channelDialogOpen, setChannelDialogOpen] = useState(false);
  const [channelDialogType, setChannelDialogType] = useState<'text' | 'voice'>('text');
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  const openCreateChannel = (type: 'text' | 'voice') => { setChannelDialogType(type); setChannelDialogOpen(true); };

  const toggleCategory = (catId: string) => {
    setCollapsedCategories(prev => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  };

  // Group channels by category
  const uncategorizedChannels = channels.filter(c => !c.category_id);
  const textUncategorized = uncategorizedChannels.filter(c => c.type === 'text');
  const voiceUncategorized = uncategorizedChannels.filter(c => c.type === 'voice');

  const renderChannel = (channel: DbChannel) => {
    const isVoice = channel.type === 'voice';
    const Icon = isVoice ? Volume2 : Hash;
    const isVoiceActive = voiceState?.voiceChannelId === channel.id;

    return (
      <div key={channel.id}>
        <button
          onClick={() => onChannelChange(channel.id)}
          className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm transition-colors group ${
            activeChannel === channel.id ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
          } ${isVoiceActive ? 'text-status-online' : ''}`}
        >
          <Icon className={`w-4 h-4 shrink-0 opacity-70 ${isVoiceActive ? 'text-status-online' : ''}`} />
          <span className="truncate">{channel.name}</span>
          {voiceState?.connecting && isVoiceActive && (
            <span className="ml-auto text-[10px] text-muted-foreground">...</span>
          )}
        </button>
        {isVoice && voiceState?.voiceChannelId === channel.id && voiceState.participants.length > 0 && (
          <VoiceParticipants participants={voiceState.participants} />
        )}
      </div>
    );
  };

  return (
    <div className={`${isMobile ? 'flex-1 h-full' : 'w-60'} bg-sidebar flex flex-col`}>
      <div className="h-12 flex items-center px-4 border-b border-border shadow-sm font-semibold text-foreground cursor-pointer hover:bg-secondary/50 transition-colors justify-between">
        <span className="truncate">{serverName}</span>
        <div className="flex items-center gap-1.5">
          {!isOwner && onLeaveServer && (<button onClick={onLeaveServer} className="text-destructive hover:text-destructive/80 transition-colors" title={t('server.leaveServer')}><LogOut className="w-4 h-4" /></button>)}
          {isOwner && (
            <>
              <button onClick={() => setInviteDialogOpen(true)} className="text-muted-foreground hover:text-foreground transition-colors" title={t('server.createInvite')}><UserPlus className="w-4 h-4" /></button>
              <button onClick={() => navigate(`/server/${serverId}/settings`)} className="text-muted-foreground hover:text-foreground transition-colors" title={t('server.serverSettings')}><Settings className="w-4 h-4" /></button>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin px-2 py-3">
        {/* Uncategorized channels */}
        {textUncategorized.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between px-2 mb-0.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t('channels.textChannels')}</p>
              {isOwner && (<button onClick={() => openCreateChannel('text')} className="text-muted-foreground hover:text-foreground transition-colors"><Plus className="w-3.5 h-3.5" /></button>)}
            </div>
            {textUncategorized.map(renderChannel)}
          </div>
        )}

        {voiceUncategorized.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between px-2 mb-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t('channels.voiceChannels')}</p>
              {isOwner && (<button onClick={() => openCreateChannel('voice')} className="text-muted-foreground hover:text-foreground transition-colors"><Plus className="w-3.5 h-3.5" /></button>)}
            </div>
            {voiceUncategorized.map(renderChannel)}
          </div>
        )}

        {/* Categorized channels */}
        {categories.map(cat => {
          const catChannels = channels.filter(c => c.category_id === cat.id);
          if (catChannels.length === 0) return null;
          const isCollapsed = collapsedCategories.has(cat.id);

          return (
            <div key={cat.id} className="mb-2">
              <button
                onClick={() => toggleCategory(cat.id)}
                className="flex items-center gap-1 px-2 mb-0.5 w-full group"
              >
                {isCollapsed ? (
                  <ChevronRight className="w-3 h-3 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-3 h-3 text-muted-foreground" />
                )}
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-colors">
                  {cat.name}
                </p>
              </button>
              {!isCollapsed && catChannels.map(renderChannel)}
            </div>
          );
        })}

        {/* If no channels at all */}
        {channels.length === 0 && categories.length === 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between px-2 mb-0.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t('channels.textChannels')}</p>
              {isOwner && (<button onClick={() => openCreateChannel('text')} className="text-muted-foreground hover:text-foreground transition-colors"><Plus className="w-3.5 h-3.5" /></button>)}
            </div>
          </div>
        )}
      </div>

      {/* Voice panel */}
      {voiceState?.connected && (
        <VoicePanel
          channelName={voiceState.voiceChannelName}
          onDisconnect={voiceState.disconnect}
          micMuted={voiceState.micMuted}
          deafened={voiceState.deafened}
          onToggleMic={voiceState.toggleMic}
          onToggleDeafen={voiceState.toggleDeafen}
        />
      )}

      <UserInfoPanel currentUserStatus={currentUserStatus} onStatusChange={onStatusChange} />

      {isOwner && (
        <>
          <CreateChannelDialog open={channelDialogOpen} onOpenChange={setChannelDialogOpen} serverId={serverId} defaultType={channelDialogType} existingCount={channels.length} onChannelCreated={() => onChannelCreated?.()} />
          <InviteDialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen} serverId={serverId} serverName={serverName} />
        </>
      )}
    </div>
  );
};

export default ChannelList;
