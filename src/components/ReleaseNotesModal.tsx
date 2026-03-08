import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, MessageSquare, Shield, UserCircle } from 'lucide-react';

const CURRENT_VERSION = '0.2.2';
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
    { icon: <MessageSquare className="w-5 h-5 text-primary" />, tag: 'MOBİL', color: 'text-primary', text: 'Mobil Mesaj Menüsü: Mesaja uzun basarak yanıtla, düzenle, sil ve tepki ekle!' },
    { icon: <Shield className="w-5 h-5 text-status-online" />, tag: 'LIGHTBOX', color: 'text-status-online', text: 'Pürüzsüz resim geçişleri ve her zaman görünür buton yazıları.' },
    { icon: <UserCircle className="w-5 h-5 text-accent" />, tag: 'PROFİL', color: 'text-accent', text: 'Profil kartı mobilde artık alt panelden açılıyor, ekrana sığıyor!' },
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
