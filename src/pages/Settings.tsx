import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, X, User, Shield, Megaphone, Camera, ExternalLink, Pencil, Check, XIcon, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState, useEffect, useRef } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { changelogData } from '@/data/changelogData';

const tabs = [
  { id: 'account', label: 'Hesabım', icon: User },
  { id: 'privacy', label: 'Gizlilik', icon: Shield },
  { id: 'changelog', label: 'Güncelleme Notları', icon: Megaphone },
];

const Settings = () => {
  const { profile, signOut, user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('account');
  const isMobile = useIsMobile();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Inline editing states
  const [editingField, setEditingField] = useState<'display_name' | 'username' | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile?.avatar_url) setAvatarUrl(profile.avatar_url);
  }, [profile]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Lütfen bir resim dosyası seçin');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Dosya boyutu 5MB\'dan küçük olmalı');
      return;
    }

    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${user.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true });

    if (uploadError) {
      toast.error('Yükleme başarısız');
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
    const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

    await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('user_id', user.id);
    setAvatarUrl(publicUrl);
    toast.success('Profil fotoğrafı güncellendi!');
    setUploading(false);
  };

  const startEdit = (field: 'display_name' | 'username') => {
    setEditingField(field);
    setEditValue(field === 'display_name' ? (profile?.display_name || '') : (profile?.username || ''));
  };

  const cancelEdit = () => {
    setEditingField(null);
    setEditValue('');
  };

  const saveEdit = async () => {
    if (!user || !editingField || !editValue.trim()) return;
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ [editingField]: editValue.trim() })
      .eq('user_id', user.id);
    setSaving(false);
    if (error) {
      toast.error('Güncelleme başarısız');
    } else {
      toast.success(editingField === 'display_name' ? 'Görünen ad güncellendi!' : 'Kullanıcı adı güncellendi!');
      setEditingField(null);
      // Profile will refresh via AuthContext
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (editingField) {
          cancelEdit();
        } else {
          navigate('/');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, editingField]);

  const handleSignOut = async () => {
    await signOut();
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('tr-TR', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  };

  return (
    <div className="h-screen flex flex-col md:flex-row bg-background text-foreground overflow-hidden">
      {/* Mobil üst bar */}
      {isMobile && (
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-sidebar overflow-x-auto shrink-0">
          <button
            onClick={() => navigate('/')}
            className="w-8 h-8 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-foreground shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors shrink-0 ${
                activeTab === tab.id
                  ? 'bg-secondary text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-destructive whitespace-nowrap shrink-0"
          >
            <LogOut className="w-4 h-4" />
            Çıkış
          </button>
        </div>
      )}

      {/* Desktop sidebar */}
      {!isMobile && (
        <div className="w-56 bg-sidebar flex flex-col items-end py-10 pr-2 pl-4 overflow-y-auto shrink-0">
          <div className="w-full space-y-0.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-2 mb-2">
              Kullanıcı Ayarları
            </p>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'bg-secondary text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}

            <div className="border-t border-border my-2" />

            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Çıkış Yap
            </button>
          </div>
        </div>
      )}

      {/* İçerik */}
      <div className="flex-1 flex min-h-0">
        <div className="w-full max-w-2xl py-6 md:py-10 px-4 md:px-10 overflow-y-auto">
          {activeTab === 'account' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Hesabım</h2>

              <div className="rounded-xl border border-border bg-card p-4 md:p-5 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="relative group">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="w-14 h-14 md:w-16 md:h-16 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-primary flex items-center justify-center text-xl md:text-2xl font-bold text-primary-foreground shrink-0">
                        {profile?.display_name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                    )}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <Camera className="w-5 h-5 text-white" />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg font-semibold text-foreground truncate">{profile?.display_name || 'Kullanıcı'}</p>
                    <p className="text-sm text-muted-foreground truncate">@{profile?.username || 'user'}</p>
                  </div>
                </div>

                <div className="border-t border-border pt-4 space-y-3">
                  {/* Görünen Ad */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs uppercase text-muted-foreground font-semibold mb-1">Görünen Ad</p>
                      {editingField === 'display_name' ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="h-8 bg-input border-border text-sm"
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                          />
                          <button onClick={saveEdit} disabled={saving} className="text-primary hover:text-primary/80 shrink-0">
                            <Check className="w-4 h-4" />
                          </button>
                          <button onClick={cancelEdit} className="text-muted-foreground hover:text-foreground shrink-0">
                            <XIcon className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <p className="text-sm text-foreground">{profile?.display_name || '—'}</p>
                      )}
                    </div>
                    {editingField !== 'display_name' && (
                      <button onClick={() => startEdit('display_name')} className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Kullanıcı Adı */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs uppercase text-muted-foreground font-semibold mb-1">Kullanıcı Adı</p>
                      {editingField === 'username' ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="h-8 bg-input border-border text-sm"
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                          />
                          <button onClick={saveEdit} disabled={saving} className="text-primary hover:text-primary/80 shrink-0">
                            <Check className="w-4 h-4" />
                          </button>
                          <button onClick={cancelEdit} className="text-muted-foreground hover:text-foreground shrink-0">
                            <XIcon className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <p className="text-sm text-foreground">@{profile?.username || '—'}</p>
                      )}
                    </div>
                    {editingField !== 'username' && (
                      <button onClick={() => startEdit('username')} className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* E-posta (salt okunur) */}
                  <div>
                    <p className="text-xs uppercase text-muted-foreground font-semibold mb-1">E-posta</p>
                    <p className="text-sm text-foreground">{user?.email || '—'}</p>
                  </div>

                  {/* Hesap Oluşturma Tarihi */}
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                      {user?.created_at ? formatDate(user.created_at) : '—'} tarihinden beri üye
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-destructive/30 bg-card p-4 md:p-5 space-y-3">
                <p className="text-sm font-semibold text-foreground">Hesap Silme</p>
                <p className="text-xs text-muted-foreground">Hesabınızı silmek geri alınamaz bir işlemdir.</p>
                <Button variant="destructive" size="sm" disabled>
                  Hesabı Sil
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Gizlilik & Güvenlik</h2>
              <div className="rounded-xl border border-border bg-card p-4 md:p-5">
                <p className="text-sm text-muted-foreground">Yakında eklenecek.</p>
              </div>
            </div>
          )}

          {activeTab === 'changelog' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Güncelleme Notları</h2>
                <button
                  onClick={() => navigate('/changelog')}
                  className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                >
                  Tümünü Gör <ExternalLink className="w-3 h-3" />
                </button>
              </div>
              {changelogData.slice(0, 3).map((release) => (
                <div key={release.version} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 rounded-lg bg-primary text-primary-foreground text-xs font-bold">
                      v{release.version}
                    </span>
                    <span className="text-sm text-muted-foreground">{release.date}</span>
                  </div>

                  {release.sections.map((section) => (
                    <div key={section.title} className="rounded-xl border border-border bg-card p-4 md:p-5 space-y-3">
                      <div className="flex items-center gap-2">
                        <section.icon className={`w-4 h-4 ${section.color}`} />
                        <p className="text-sm font-semibold text-foreground">{section.title}</p>
                      </div>
                      <ul className="space-y-1.5 ml-6">
                        {section.items.map((item, i) => (
                          <li key={i} className="text-sm text-muted-foreground list-disc">
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Desktop kapat butonu */}
        {!isMobile && (
          <div className="py-10 pr-6 shrink-0">
            <button
              onClick={() => navigate('/')}
              className="w-9 h-9 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <p className="text-[10px] text-muted-foreground text-center mt-1">ESC</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
