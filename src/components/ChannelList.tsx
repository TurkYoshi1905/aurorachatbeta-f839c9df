import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DbChannel, DbMember } from '@/pages/Index';
import { Hash, Volume2, Settings, Plus, UserPlus, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import CreateChannelDialog from '@/components/CreateChannelDialog';
import InviteDialog from '@/components/InviteDialog';
import { useTranslation } from '@/i18n';
import UserInfoPanel from '@/components/UserInfoPanel';

interface ChannelListProps {
  serverName: string; serverId: string; serverIcon: string; channels: DbChannel[];
  activeChannel: string; onChannelChange: (id: string) => void;
  currentUserStatus?: DbMember['status']; onStatusChange?: (status: DbMember['status']) => void;
  isOwner?: boolean; onChannelCreated?: () => void; onServerDeleted?: () => void;
  onServerUpdated?: () => void; onLeaveServer?: () => void; isMobile?: boolean;
}

const ChannelList = ({ serverName, serverId, serverIcon, channels, activeChannel, onChannelChange, currentUserStatus = 'offline', onStatusChange, isOwner, onChannelCreated, onServerDeleted, onServerUpdated, onLeaveServer, isMobile }: ChannelListProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [channelDialogOpen, setChannelDialogOpen] = useState(false);
  const [channelDialogType, setChannelDialogType] = useState<'text' | 'voice'>('text');
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const textChannels = channels.filter((c) => c.type === 'text');
  const voiceChannels = channels.filter((c) => c.type === 'voice');

  const openCreateChannel = (type: 'text' | 'voice') => { setChannelDialogType(type); setChannelDialogOpen(true); };

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
        <div className="mb-4">
          <div className="flex items-center justify-between px-2 mb-0.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t('channels.textChannels')}</p>
            {isOwner && (<button onClick={() => openCreateChannel('text')} className="text-muted-foreground hover:text-foreground transition-colors"><Plus className="w-3.5 h-3.5" /></button>)}
          </div>
          {textChannels.map((channel) => (
            <button key={channel.id} onClick={() => onChannelChange(channel.id)} className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm transition-colors group ${activeChannel === channel.id ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'}`}>
              <Hash className="w-4 h-4 shrink-0 opacity-70" /><span className="truncate">{channel.name}</span>
            </button>
          ))}
        </div>
        {voiceChannels.length > 0 && (
          <div>
            <div className="flex items-center justify-between px-2 mb-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t('channels.voiceChannels')}</p>
              {isOwner && (<button onClick={() => openCreateChannel('voice')} className="text-muted-foreground hover:text-foreground transition-colors"><Plus className="w-3.5 h-3.5" /></button>)}
            </div>
            {voiceChannels.map((channel) => (
              <button key={channel.id} onClick={() => onChannelChange(channel.id)} className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm transition-colors ${activeChannel === channel.id ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'}`}>
                <Volume2 className="w-4 h-4 shrink-0 opacity-70" /><span className="truncate">{channel.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

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
