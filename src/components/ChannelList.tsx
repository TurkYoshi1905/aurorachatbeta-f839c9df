import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DbChannel, DbMember } from '@/pages/Index';
import { Hash, Volume2, Mic, Headphones, Settings, Circle, Moon, MinusCircle, EyeOff, Plus, UserPlus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import CreateChannelDialog from '@/components/CreateChannelDialog';
import InviteDialog from '@/components/InviteDialog';
import ServerSettingsDialog from '@/components/ServerSettingsDialog';

interface ChannelListProps {
  serverName: string;
  serverId: string;
  serverIcon: string;
  channels: DbChannel[];
  activeChannel: string;
  onChannelChange: (id: string) => void;
  currentUserStatus?: DbMember['status'];
  onStatusChange?: (status: DbMember['status']) => void;
  isOwner?: boolean;
  onChannelCreated?: () => void;
  onServerDeleted?: () => void;
  onServerUpdated?: () => void;
  isMobile?: boolean;
}

const statusColor: Record<string, string> = {
  online: 'bg-status-online',
  idle: 'bg-status-idle',
  dnd: 'bg-status-dnd',
  offline: 'bg-muted-foreground',
};

const statusOptions: { value: DbMember['status']; label: string; icon: React.ReactNode; desc: string }[] = [
  { value: 'online', label: 'Çevrimiçi', icon: <Circle className="w-4 h-4 text-status-online fill-status-online" />, desc: '' },
  { value: 'idle', label: 'Boşta', icon: <Moon className="w-4 h-4 text-status-idle fill-status-idle" />, desc: '' },
  { value: 'dnd', label: 'Rahatsız Etmeyin', icon: <MinusCircle className="w-4 h-4 text-status-dnd fill-status-dnd" />, desc: 'Bildirim almayacaksınız' },
  { value: 'offline', label: 'Görünmez', icon: <EyeOff className="w-4 h-4 text-muted-foreground" />, desc: 'Çevrimdışı görünürsünüz' },
];

const ChannelList = ({ serverName, serverId, serverIcon, channels, activeChannel, onChannelChange, currentUserStatus = 'offline', onStatusChange, isOwner, onChannelCreated, onServerDeleted, onServerUpdated, isMobile }: ChannelListProps) => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [statusOpen, setStatusOpen] = useState(false);
  const [channelDialogOpen, setChannelDialogOpen] = useState(false);
  const [channelDialogType, setChannelDialogType] = useState<'text' | 'voice'>('text');
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const textChannels = channels.filter((c) => c.type === 'text');
  const voiceChannels = channels.filter((c) => c.type === 'voice');

  const openCreateChannel = (type: 'text' | 'voice') => {
    setChannelDialogType(type);
    setChannelDialogOpen(true);
  };

  return (
    <div className={`${isMobile ? 'flex-1' : 'w-60'} bg-sidebar flex flex-col`}>
      <div className="h-12 flex items-center px-4 border-b border-border shadow-sm font-semibold text-foreground cursor-pointer hover:bg-secondary/50 transition-colors justify-between">
        <span className="truncate">{serverName}</span>
        <div className="flex items-center gap-1.5">
          {isOwner && (
            <>
              <button
                onClick={() => setInviteDialogOpen(true)}
                className="text-muted-foreground hover:text-foreground transition-colors"
                title="Davet Oluştur"
              >
                <UserPlus className="w-4 h-4" />
              </button>
              <button
                onClick={() => setSettingsOpen(true)}
                className="text-muted-foreground hover:text-foreground transition-colors"
                title="Sunucu Ayarları"
              >
                <Settings className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin px-2 py-3">
        <div className="mb-4">
          <div className="flex items-center justify-between px-2 mb-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Metin Kanalları</p>
            {isOwner && (
              <button onClick={() => openCreateChannel('text')} className="text-muted-foreground hover:text-foreground transition-colors">
                <Plus className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {textChannels.map((channel) => (
            <button
              key={channel.id}
              onClick={() => onChannelChange(channel.id)}
              className={`w-full flex items-center gap-1.5 px-2 py-1.5 rounded-md text-sm transition-colors group ${
                activeChannel === channel.id
                  ? 'bg-secondary text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              }`}
            >
              <Hash className="w-4 h-4 shrink-0 opacity-70" />
              <span className="truncate">{channel.name}</span>
            </button>
          ))}
        </div>

        {voiceChannels.length > 0 && (
          <div>
            <div className="flex items-center justify-between px-2 mb-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Sesli Kanallar</p>
              {isOwner && (
                <button onClick={() => openCreateChannel('voice')} className="text-muted-foreground hover:text-foreground transition-colors">
                  <Plus className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {voiceChannels.map((channel) => (
              <button
                key={channel.id}
                onClick={() => onChannelChange(channel.id)}
                className={`w-full flex items-center gap-1.5 px-2 py-1.5 rounded-md text-sm transition-colors ${
                  activeChannel === channel.id
                    ? 'bg-secondary text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                }`}
              >
                <Volume2 className="w-4 h-4 shrink-0 opacity-70" />
                <span className="truncate">{channel.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="h-[52px] bg-server-bg flex items-center px-2 gap-2">
        <Popover open={statusOpen} onOpenChange={setStatusOpen}>
          <PopoverTrigger asChild>
            <button className="relative flex-shrink-0 cursor-pointer rounded-full hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-sm font-medium text-primary-foreground overflow-hidden">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  profile?.display_name?.charAt(0)?.toUpperCase() || '?'
                )}
              </div>
              <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-server-bg ${statusColor[currentUserStatus]}`} />
            </button>
          </PopoverTrigger>
          <PopoverContent side="top" align="start" className="w-56 p-1.5 bg-popover border-border">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-2 py-1.5">Durumu Ayarla</p>
            {statusOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { onStatusChange?.(opt.value); setStatusOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm transition-colors hover:bg-secondary/70 ${
                  currentUserStatus === opt.value ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {opt.icon}
                <div className="text-left">
                  <span className="block">{opt.label}</span>
                  {opt.desc && <span className="block text-[10px] text-muted-foreground">{opt.desc}</span>}
                </div>
              </button>
            ))}
          </PopoverContent>
        </Popover>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{profile?.display_name || 'Kullanıcı'}</p>
          <p className="text-[10px] text-muted-foreground">@{profile?.username || 'user'}</p>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-1.5 rounded hover:bg-secondary/60 text-muted-foreground hover:text-foreground transition-colors">
            <Mic className="w-4 h-4" />
          </button>
          <button className="p-1.5 rounded hover:bg-secondary/60 text-muted-foreground hover:text-foreground transition-colors">
            <Headphones className="w-4 h-4" />
          </button>
          <button onClick={() => navigate('/settings')} className="p-1.5 rounded hover:bg-secondary/60 text-muted-foreground hover:text-foreground transition-colors">
            <Settings className="w-4 h-4" />
          </button>
      </div>
      </div>
      {isOwner && (
        <>
          <CreateChannelDialog
            open={channelDialogOpen}
            onOpenChange={setChannelDialogOpen}
            serverId={serverId}
            defaultType={channelDialogType}
            existingCount={channels.length}
            onChannelCreated={() => onChannelCreated?.()}
          />
          <InviteDialog
            open={inviteDialogOpen}
            onOpenChange={setInviteDialogOpen}
            serverId={serverId}
            serverName={serverName}
          />
          <ServerSettingsDialog
            open={settingsOpen}
            onOpenChange={setSettingsOpen}
            serverId={serverId}
            serverName={serverName}
            serverIcon={serverIcon}
            onServerDeleted={() => onServerDeleted?.()}
            onServerUpdated={() => onServerUpdated?.()}
          />
        </>
      )}
    </div>
  );
};

export default ChannelList;
