import { useAuth } from '@/contexts/AuthContext';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SettingsDialog = ({ open, onOpenChange }: SettingsDialogProps) => {
  const { profile, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Ayarlar</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Hesap ayarlarınızı yönetin
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Hesap Bilgileri */}
          <div className="rounded-lg border border-border p-4 space-y-2">
            <p className="text-sm font-medium text-foreground">Hesap Bilgileri</p>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Görünen Ad: <span className="text-foreground">{profile?.display_name || 'Bilinmiyor'}</span></p>
              <p>Kullanıcı Adı: <span className="text-foreground">@{profile?.username || 'user'}</span></p>
            </div>
          </div>

          {/* Çıkış */}
          <div className="rounded-lg border border-destructive/30 p-4 space-y-3">
            <p className="text-sm font-medium text-foreground">Oturumu Kapat</p>
            <p className="text-xs text-muted-foreground">Hesabınızdan çıkış yaparsınız ve giriş ekranına yönlendirilirsiniz.</p>
            <Button variant="destructive" onClick={handleSignOut} className="w-full gap-2">
              <LogOut className="w-4 h-4" />
              Çıkış Yap
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog;
