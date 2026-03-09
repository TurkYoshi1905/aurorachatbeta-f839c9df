import { useState, useEffect } from 'react';
import { Bell, BellOff, Volume2, VolumeX } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface NotificationSettingsPopoverProps {
  channelId: string;
  serverId: string;
}

const MUTE_DURATIONS = [
  { label: '15 dakika', value: 15 },
  { label: '1 saat', value: 60 },
  { label: '8 saat', value: 480 },
  { label: '24 saat', value: 1440 },
  { label: 'Süresiz', value: -1 },
];

const NotificationSettingsPopover = ({ channelId, serverId }: NotificationSettingsPopoverProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifyLevel, setNotifyLevel] = useState<'all' | 'mentions' | 'none'>('all');
  const [suppressEveryone, setSuppressEveryone] = useState(false);
  const [muteUntil, setMuteUntil] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isMuted = muteUntil ? (muteUntil === 'forever' || new Date(muteUntil) > new Date()) : false;

  useEffect(() => {
    if (!open || !user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', user.id)
        .eq('channel_id', channelId)
        .maybeSingle();
      if (data) {
        setNotifyLevel((data as any).notify_level || 'all');
        setSuppressEveryone((data as any).suppress_everyone || false);
        setMuteUntil((data as any).mute_until || null);
      } else {
        setNotifyLevel('all');
        setSuppressEveryone(false);
        setMuteUntil(null);
      }
    };
    fetch();
  }, [open, user, channelId]);

  const save = async (updates: Record<string, any>) => {
    if (!user) return;
    setLoading(true);
    const { data: existing } = await supabase
      .from('notification_settings')
      .select('id')
      .eq('user_id', user.id)
      .eq('channel_id', channelId)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('notification_settings')
        .update(updates)
        .eq('id', existing.id);
    } else {
      await supabase
        .from('notification_settings')
        .insert({
          user_id: user.id,
          channel_id: channelId,
          server_id: serverId,
          ...updates,
        } as any);
    }
    setLoading(false);
    toast.success('Bildirim ayarları güncellendi');
  };

  const handleLevelChange = async (level: 'all' | 'mentions' | 'none') => {
    setNotifyLevel(level);
    await save({ notify_level: level });
  };

  const handleSuppressToggle = async (value: boolean) => {
    setSuppressEveryone(value);
    await save({ suppress_everyone: value });
  };

  const handleMute = async (minutes: number) => {
    let muteVal: string | null;
    if (minutes === -1) {
      muteVal = '2099-12-31T23:59:59Z';
    } else {
      const until = new Date(Date.now() + minutes * 60 * 1000);
      muteVal = until.toISOString();
    }
    setMuteUntil(muteVal);
    await save({ mute_until: muteVal });
  };

  const handleUnmute = async () => {
    setMuteUntil(null);
    await save({ mute_until: null });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className={`hover:text-foreground transition-colors ${isMuted ? 'text-destructive' : ''}`}>
          {isMuted ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
        </button>
      </PopoverTrigger>
      <PopoverContent side="bottom" align="end" className="w-72 p-0">
        <div className="p-3 border-b border-border">
          <h3 className="font-semibold text-sm text-foreground">Bildirim Ayarları</h3>
        </div>

        <div className="p-3 space-y-3">
          {/* Notification level */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Bildirim Seviyesi</p>
            {[
              { value: 'all' as const, label: 'Tüm mesajlar', icon: Volume2 },
              { value: 'mentions' as const, label: 'Sadece etiketlemeler', icon: Bell },
              { value: 'none' as const, label: 'Bildirimleri kapat', icon: VolumeX },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleLevelChange(opt.value)}
                disabled={loading}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-xs transition-colors ${notifyLevel === opt.value ? 'bg-primary/10 text-primary font-medium' : 'text-foreground hover:bg-secondary/80'}`}
              >
                <opt.icon className="w-3.5 h-3.5" />
                {opt.label}
              </button>
            ))}
          </div>

          {/* Suppress @everyone */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-foreground">@everyone bastır</span>
            <Switch checked={suppressEveryone} onCheckedChange={handleSuppressToggle} disabled={loading} />
          </div>

          {/* Mute */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Kanalı Sustur</p>
            {isMuted ? (
              <Button size="sm" variant="outline" onClick={handleUnmute} className="w-full h-7 text-xs" disabled={loading}>
                <Bell className="w-3 h-3 mr-1" /> Susturmayı Kaldır
              </Button>
            ) : (
              <div className="flex flex-wrap gap-1">
                {MUTE_DURATIONS.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => handleMute(d.value)}
                    disabled={loading}
                    className="px-2 py-1 rounded text-[10px] bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationSettingsPopover;
