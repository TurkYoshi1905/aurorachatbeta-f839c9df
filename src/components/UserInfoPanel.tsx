import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, MicOff, Headphones, HeadphoneOff, Settings, Circle, Moon, MinusCircle, EyeOff, ChevronDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/i18n';
import { DbMember } from '@/pages/Index';

interface UserInfoPanelProps {
  currentUserStatus?: DbMember['status'];
  onStatusChange?: (status: DbMember['status']) => void;
}

const statusColor: Record<string, string> = {
  online: 'bg-status-online',
  idle: 'bg-status-idle',
  dnd: 'bg-status-dnd',
  offline: 'bg-muted-foreground',
};

interface AudioDevice {
  deviceId: string;
  label: string;
}

const UserInfoPanel = ({ currentUserStatus = 'offline', onStatusChange }: UserInfoPanelProps) => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [statusOpen, setStatusOpen] = useState(false);
  const [micMuted, setMicMuted] = useState(false);
  const [deafened, setDeafened] = useState(false);
  const [micDevicesOpen, setMicDevicesOpen] = useState(false);
  const [speakerDevicesOpen, setSpeakerDevicesOpen] = useState(false);
  const [inputDevices, setInputDevices] = useState<AudioDevice[]>([]);
  const [outputDevices, setOutputDevices] = useState<AudioDevice[]>([]);
  const [selectedInput, setSelectedInput] = useState<string>('default');
  const [selectedOutput, setSelectedOutput] = useState<string>('default');

  const statusOptions: { value: DbMember['status']; label: string; icon: React.ReactNode; desc: string }[] = [
    { value: 'online', label: t('status.online'), icon: <Circle className="w-4 h-4 text-status-online fill-status-online" />, desc: '' },
    { value: 'idle', label: t('status.idle'), icon: <Moon className="w-4 h-4 text-status-idle fill-status-idle" />, desc: '' },
    { value: 'dnd', label: t('status.dnd'), icon: <MinusCircle className="w-4 h-4 text-status-dnd fill-status-dnd" />, desc: t('status.dndDesc') },
    { value: 'offline', label: t('status.invisible'), icon: <EyeOff className="w-4 h-4 text-muted-foreground" />, desc: t('status.invisibleDesc') },
  ];

  const fetchDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      setInputDevices(devices.filter(d => d.kind === 'audioinput').map(d => ({ deviceId: d.deviceId, label: d.label || `Mikrofon ${d.deviceId.slice(0, 4)}` })));
      setOutputDevices(devices.filter(d => d.kind === 'audiooutput').map(d => ({ deviceId: d.deviceId, label: d.label || `Hoparlör ${d.deviceId.slice(0, 4)}` })));
    } catch {
      setInputDevices([{ deviceId: 'default', label: 'Varsayılan Mikrofon' }]);
      setOutputDevices([{ deviceId: 'default', label: 'Varsayılan Hoparlör' }]);
    }
  };

  useEffect(() => {
    if (micDevicesOpen || speakerDevicesOpen) fetchDevices();
  }, [micDevicesOpen, speakerDevicesOpen]);

  const handleToggleMic = () => {
    setMicMuted(prev => !prev);
  };

  const handleToggleDeafen = () => {
    setDeafened(prev => {
      if (!prev) setMicMuted(true); // deafen also mutes mic
      return !prev;
    });
  };

  return (
    <div className="h-[52px] bg-server-bg flex items-center px-2 gap-2 shrink-0">
      <Popover open={statusOpen} onOpenChange={setStatusOpen}>
        <PopoverTrigger asChild>
          <button className="relative flex-shrink-0 cursor-pointer rounded-full hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-sm font-medium text-primary-foreground overflow-hidden">
              {profile?.avatar_url ? (<img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />) : (profile?.display_name?.charAt(0)?.toUpperCase() || '?')}
            </div>
            {currentUserStatus === 'idle' ? (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 flex items-center justify-center">
                <Moon className="w-3.5 h-3.5 text-status-idle fill-status-idle" />
              </div>
            ) : (
              <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-server-bg ${statusColor[currentUserStatus]}`} />
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent side="top" align="start" className="w-56 p-1.5 bg-popover border-border">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-2 py-1.5">{t('status.setStatus')}</p>
          {statusOptions.map((opt) => (
            <button key={opt.value} onClick={() => { onStatusChange?.(opt.value); setStatusOpen(false); }} className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm transition-colors hover:bg-secondary/70 ${currentUserStatus === opt.value ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              {opt.icon}
              <div className="text-left"><span className="block">{opt.label}</span>{opt.desc && <span className="block text-[10px] text-muted-foreground">{opt.desc}</span>}</div>
            </button>
          ))}
        </PopoverContent>
      </Popover>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate max-w-[80px] sm:max-w-none">{profile?.display_name || t('common.user')}</p>
        <p className="text-[10px] text-muted-foreground truncate max-w-[80px] sm:max-w-none">@{profile?.username || 'user'}</p>
      </div>
      <div className="flex items-center gap-0.5">
        {/* Mic button with device dropdown */}
        <div className="flex items-center">
          <button onClick={handleToggleMic} className={`p-1.5 rounded-l hover:bg-secondary/60 transition-colors ${micMuted ? 'text-destructive' : 'text-muted-foreground hover:text-foreground'}`}>
            {micMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
          <Popover open={micDevicesOpen} onOpenChange={setMicDevicesOpen}>
            <PopoverTrigger asChild>
              <button className="p-1 min-w-[30px] min-h-[30px] flex items-center justify-center rounded-r hover:bg-secondary/60 text-muted-foreground hover:text-foreground transition-colors">
                <ChevronDown className="w-3 h-3" />
              </button>
            </PopoverTrigger>
            <PopoverContent side="top" align="center" className="w-56 p-1.5 bg-popover border-border">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-2 py-1.5">Giriş Cihazı</p>
              {inputDevices.map(d => (
                <button key={d.deviceId} onClick={() => { setSelectedInput(d.deviceId); setMicDevicesOpen(false); }} className={`w-full text-left px-2 py-1.5 rounded-md text-sm transition-colors ${selectedInput === d.deviceId ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'}`}>
                  <span className="truncate block">{d.label}</span>
                </button>
              ))}
              {inputDevices.length === 0 && <p className="text-xs text-muted-foreground px-2 py-2">Cihaz bulunamadı</p>}
            </PopoverContent>
          </Popover>
        </div>

        {/* Headphones button with device dropdown */}
        <div className="flex items-center">
          <button onClick={handleToggleDeafen} className={`p-1.5 rounded-l hover:bg-secondary/60 transition-colors ${deafened ? 'text-destructive' : 'text-muted-foreground hover:text-foreground'}`}>
            {deafened ? <HeadphoneOff className="w-4 h-4" /> : <Headphones className="w-4 h-4" />}
          </button>
          <Popover open={speakerDevicesOpen} onOpenChange={setSpeakerDevicesOpen}>
            <PopoverTrigger asChild>
              <button className="p-1 min-w-[30px] min-h-[30px] flex items-center justify-center rounded-r hover:bg-secondary/60 text-muted-foreground hover:text-foreground transition-colors">
                <ChevronDown className="w-3 h-3" />
              </button>
            </PopoverTrigger>
            <PopoverContent side="top" align="center" className="w-56 p-1.5 bg-popover border-border">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-2 py-1.5">Çıkış Cihazı</p>
              {outputDevices.map(d => (
                <button key={d.deviceId} onClick={() => { setSelectedOutput(d.deviceId); setSpeakerDevicesOpen(false); }} className={`w-full text-left px-2 py-1.5 rounded-md text-sm transition-colors ${selectedOutput === d.deviceId ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'}`}>
                  <span className="truncate block">{d.label}</span>
                </button>
              ))}
              {outputDevices.length === 0 && <p className="text-xs text-muted-foreground px-2 py-2">Cihaz bulunamadı</p>}
            </PopoverContent>
          </Popover>
        </div>

        <button onClick={() => navigate('/settings')} className="p-1.5 rounded hover:bg-secondary/60 text-muted-foreground hover:text-foreground transition-colors">
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default UserInfoPanel;
