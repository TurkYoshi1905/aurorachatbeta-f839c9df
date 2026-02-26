import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Trash2, Camera, UserMinus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Member {
  id: string;
  user_id: string;
  display_name: string;
  avatar_url: string | null;
}

interface ServerSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serverId: string;
  serverName: string;
  serverIcon: string;
  onServerDeleted: () => void;
  onServerUpdated: () => void;
}

const ServerSettingsDialog = ({
  open, onOpenChange, serverId, serverName, serverIcon, onServerDeleted, onServerUpdated,
}: ServerSettingsDialogProps) => {
  const { user } = useAuth();
  const [tab, setTab] = useState<'general' | 'members'>('general');
  const [name, setName] = useState(serverName);
  const [icon, setIcon] = useState(serverIcon);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMembers = async () => {
    setLoadingMembers(true);
    const { data } = await supabase
      .from('server_members')
      .select('id, user_id')
      .eq('server_id', serverId);

    if (data) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', data.map((m) => m.user_id));

      setMembers(
        data.map((m) => {
          const p = profiles?.find((pr) => pr.user_id === m.user_id);
          return {
            id: m.id,
            user_id: m.user_id,
            display_name: p?.display_name || 'Kullanıcı',
            avatar_url: p?.avatar_url || null,
          };
        })
      );
    }
    setLoadingMembers(false);
  };

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      setName(serverName);
      setIcon(serverIcon);
      setConfirmDelete(false);
      setTab('general');
    }
    onOpenChange(isOpen);
  };

  const handleTabChange = (t: 'general' | 'members') => {
    setTab(t);
    if (t === 'members' && members.length === 0) fetchMembers();
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    const { error } = await supabase
      .from('servers')
      .update({ name: name.trim(), icon })
      .eq('id', serverId);
    setSaving(false);
    if (error) {
      toast.error('Sunucu güncellenemedi');
    } else {
      toast.success('Sunucu güncellendi!');
      onServerUpdated();
      onOpenChange(false);
    }
  };

  const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Lütfen bir resim dosyası seçin');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Dosya boyutu 5MB'dan küçük olmalı");
      return;
    }

    const ext = file.name.split('.').pop();
    const path = `${serverId}/icon.${ext}`;
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (error) {
      toast.error('Yükleme başarısız');
      return;
    }
    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
    setIcon(urlData.publicUrl + '?t=' + Date.now());
    toast.success('Sunucu fotoğrafı yüklendi!');
  };

  const handleDelete = async () => {
    setDeleting(true);
    // Delete channels, members, invites, messages first
    await supabase.from('messages').delete().eq('server_id', serverId);
    await supabase.from('channels').delete().eq('server_id', serverId);
    await supabase.from('server_invites').delete().eq('server_id', serverId);
    await supabase.from('server_members').delete().eq('server_id', serverId);
    const { error } = await supabase.from('servers').delete().eq('id', serverId);
    setDeleting(false);
    if (error) {
      toast.error('Sunucu silinemedi');
    } else {
      toast.success('Sunucu silindi');
      onOpenChange(false);
      onServerDeleted();
    }
  };

  const handleKickMember = async (memberId: string, userId: string) => {
    if (userId === user?.id) {
      toast.error('Kendinizi atamazsınız');
      return;
    }
    const { error } = await supabase.from('server_members').delete().eq('id', memberId);
    if (error) {
      toast.error('Üye atılamadı');
    } else {
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
      toast.success('Üye sunucudan atıldı');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="sm:max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Sunucu Ayarları</DialogTitle>
          <DialogDescription className="text-muted-foreground">Sunucu ayarlarını düzenle</DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 border-b border-border mb-4">
          <button
            onClick={() => handleTabChange('general')}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${tab === 'general' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            Genel
          </button>
          <button
            onClick={() => handleTabChange('members')}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${tab === 'members' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            Üyeler
          </button>
        </div>

        {tab === 'general' && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative group">
                {icon && (icon.startsWith('http') || icon.startsWith('/')) ? (
                  <img src={icon} alt="Server" className="w-16 h-16 rounded-full object-cover" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center text-2xl font-bold text-secondary-foreground">
                    {icon || name.charAt(0)?.toUpperCase()}
                  </div>
                )}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <Camera className="w-5 h-5 text-white" />
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleIconUpload} className="hidden" />
              </div>
              <div className="flex-1 space-y-2">
                <label className="text-xs uppercase text-muted-foreground font-semibold">Sunucu Adı</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-input border-border" />
              </div>
            </div>

            <Button onClick={handleSave} disabled={saving || !name.trim()} className="w-full">
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>

            <div className="border-t border-border pt-4 space-y-3">
              <p className="text-sm font-semibold text-destructive">Tehlikeli Alan</p>
              {!confirmDelete ? (
                <Button variant="destructive" size="sm" onClick={() => setConfirmDelete(true)}>
                  <Trash2 className="w-4 h-4 mr-1" /> Sunucuyu Sil
                </Button>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Bu işlem geri alınamaz. Tüm kanallar, mesajlar ve üyelikler silinecek.</p>
                  <div className="flex gap-2">
                    <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting}>
                      {deleting ? 'Siliniyor...' : 'Evet, Sil'}
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => setConfirmDelete(false)}>İptal</Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'members' && (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {loadingMembers ? (
              <p className="text-sm text-muted-foreground text-center py-4">Yükleniyor...</p>
            ) : members.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Üye bulunamadı</p>
            ) : (
              members.map((m) => (
                <div key={m.id} className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-secondary/50 transition-colors">
                  {m.avatar_url ? (
                    <img src={m.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-sm font-medium">
                      {m.display_name.charAt(0)?.toUpperCase()}
                    </div>
                  )}
                  <span className="flex-1 text-sm text-foreground truncate">
                    {m.display_name}
                    {m.user_id === user?.id && <span className="text-muted-foreground text-xs ml-1">(Sen)</span>}
                  </span>
                  {m.user_id !== user?.id && (
                    <button
                      onClick={() => handleKickMember(m.id, m.user_id)}
                      className="text-destructive hover:text-destructive/80 transition-colors"
                      title="Sunucudan At"
                    >
                      <UserMinus className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ServerSettingsDialog;
