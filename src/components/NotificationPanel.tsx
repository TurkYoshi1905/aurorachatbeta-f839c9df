import { useState, useEffect, useCallback } from 'react';
import { Bell, Check, CheckCheck, AtSign, Reply, Pin, Mail, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  server_id: string | null;
  channel_id: string | null;
  message_id: string | null;
  is_read: boolean;
  created_at: string;
}

interface NotificationPanelProps {
  onClose: () => void;
  onNavigate?: (serverId: string, channelId: string, messageId?: string) => void;
}

const typeIcons: Record<string, typeof AtSign> = {
  mention: AtSign,
  reply: Reply,
  pin: Pin,
  server_invite: Mail,
};

const typeLabels: Record<string, string> = {
  mention: 'Etiketleme',
  reply: 'Yanıt',
  pin: 'Sabitleme',
  server_invite: 'Davet',
};

const NotificationPanel = ({ onClose, onNavigate }: NotificationPanelProps) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    if (data) setNotifications(data as any);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev]);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          setNotifications((prev) => prev.map((n) => n.id === (payload.new as any).id ? payload.new as Notification : n));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true } as any).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllAsRead = async () => {
    if (!user) return;
    await supabase.from('notifications').update({ is_read: true } as any).eq('user_id', user.id).eq('is_read', false);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const handleClick = (n: Notification) => {
    if (!n.is_read) markAsRead(n.id);
    if (n.server_id && n.channel_id && onNavigate) {
      onNavigate(n.server_id, n.channel_id, n.message_id || undefined);
    }
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Az önce';
    if (diffMin < 60) return `${diffMin}dk önce`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}sa önce`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 7) return `${diffDay}g önce`;
    return `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-80 border-l border-border bg-background flex flex-col h-full">
      <div className="p-3 border-b border-border flex items-center justify-between">
        <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
          <Bell className="w-4 h-4" />
          Bildirimler
          {unreadCount > 0 && (
            <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4">{unreadCount}</Badge>
          )}
        </h3>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <Button size="sm" variant="ghost" onClick={markAllAsRead} className="h-7 px-2 text-xs">
              <CheckCheck className="w-3.5 h-3.5 mr-1" /> Tümünü Oku
            </Button>
          )}
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        {loading ? (
          <div className="p-6 text-center text-muted-foreground text-sm">Yükleniyor...</div>
        ) : notifications.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            <Bell className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Henüz bildirim yok</p>
            <p className="text-xs mt-1">Etiketlemeler ve yanıtlar burada görünür</p>
          </div>
        ) : (
          <div className="p-1">
            {notifications.map((n) => {
              const Icon = typeIcons[n.type] || Bell;
              return (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={`w-full text-left p-2.5 rounded-md transition-colors flex gap-2.5 ${!n.is_read ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-secondary/80'}`}
                >
                  <div className={`mt-0.5 shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${!n.is_read ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-foreground truncate flex items-center gap-1">
                        {n.title}
                        {!n.is_read && <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
                      </span>
                      <span className="text-[10px] text-muted-foreground shrink-0">{formatTime(n.created_at)}</span>
                    </div>
                    {n.body && <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">{n.body}</p>}
                    <span className="text-[10px] text-muted-foreground/70">{typeLabels[n.type] || n.type}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default NotificationPanel;
