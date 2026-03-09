import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

const DISMISSED_KEY = 'notification_permission_dismissed';

export default function NotificationPermissionBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (
      'Notification' in window &&
      Notification.permission === 'default' &&
      localStorage.getItem(DISMISSED_KEY) !== 'true'
    ) {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  const handleAllow = async () => {
    const result = await Notification.requestPermission();
    setVisible(false);
    if (result === 'granted') {
      toast({ title: 'Bildirimler açıldı! 🔔', description: 'Etiketlendiğinde bildirim alacaksın.' });
    } else {
      localStorage.setItem(DISMISSED_KEY, 'true');
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, 'true');
    setVisible(false);
  };

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[60] w-[calc(100%-2rem)] max-w-md animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-lg">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <Bell className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">Bildirimleri aç</p>
          <p className="text-xs text-muted-foreground">Etiketlendiğinde veya mesaj aldığında anında haberdar ol.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button size="sm" onClick={handleAllow}>İzin Ver</Button>
          <button onClick={handleDismiss} className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
