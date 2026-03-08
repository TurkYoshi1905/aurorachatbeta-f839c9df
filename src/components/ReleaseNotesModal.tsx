import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, Volume2, GripVertical, AtSign, Zap } from 'lucide-react';

const CURRENT_VERSION = '0.1.4';
const STORAGE_KEY = 'aurorachat_seen_version';

const ReleaseNotesModal = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    if (seen !== CURRENT_VERSION) {
      const timer = setTimeout(() => setOpen(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem(STORAGE_KEY, CURRENT_VERSION);
    setOpen(false);
  };

  const notes = [
    { icon: <Volume2 className="w-5 h-5 text-status-online" />, tag: 'SES', color: 'text-status-online', text: 'WebRTC tabanlı, düşük gecikmeli sesli sohbet kanalları eklendi!' },
    { icon: <GripVertical className="w-5 h-5 text-primary" />, tag: 'YÖNETİM', color: 'text-primary', text: 'Sunucu ayarlarında sürükle-bırak kanal yönetimi ve kategori sistemi aktif.' },
    { icon: <AtSign className="w-5 h-5 text-accent" />, tag: 'SOSYAL', color: 'text-accent', text: '@Etiketleme özelliği ile arkadaşlarına seslenmek artık daha kolay.' },
    { icon: <Zap className="w-5 h-5 text-status-idle" />, tag: 'PERFORMANS', color: 'text-status-idle', text: 'Akıllı yükleme ekranı (Splash Screen) ile uygulama stabilitesi artırıldı.' },
  ];

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            AuroraChat v{CURRENT_VERSION}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          {notes.map((note, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
              {note.icon}
              <div className="flex-1 min-w-0">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${note.color}`}>[{note.tag}]</span>
                <p className="text-sm text-foreground mt-0.5">{note.text}</p>
              </div>
            </div>
          ))}
        </div>
        <Button onClick={handleClose} className="w-full">Anladım!</Button>
      </DialogContent>
    </Dialog>
  );
};

export default ReleaseNotesModal;
