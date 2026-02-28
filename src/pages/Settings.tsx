import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, X, User, Shield, Megaphone, Sparkles, Wrench, Bug, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect, useRef } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const tabs = [
  { id: 'account', label: 'Hesabım', icon: User },
  { id: 'privacy', label: 'Gizlilik', icon: Shield },
  { id: 'changelog', label: 'Güncelleme Notları', icon: Megaphone },
];

const changelogData = [
  {
    version: '0.0.3',
    date: '28 Şubat 2026',
    sections: [
      {
        title: 'Güncellemeler',
        icon: Sparkles,
        color: 'text-primary',
        items: [
          'Kullanıcılar kendi mesajlarını silebilir',
          'Sunucu sahipleri herhangi bir mesajı silebilir',
          'Üyeler sunucudan ayrılabilir',
          'Sunucu sahipleri üyeleri atabilir',
          'Sunucu ayarları (ad, simge güncelleme) eklendi',
        ],
      },
      {
        title: 'Düzeltilen Hatalar',
        icon: Bug,
        color: 'text-destructive',
        items: [
          'Mobil arayüzde sohbet alanı kaydırma sorunu giderildi',
          'Üye atıldığında üye listesinin güncellenmeme sorunu düzeltildi',
        ],
      },
    ],
  },
  {
    version: '0.0.2',
    date: '25 Şubat 2026',
    sections: [
      {
        title: 'Güncellemeler',
        icon: Sparkles,
        color: 'text-primary',
        items: [
          'Profil fotoğrafı yükleme özelliği eklendi',
          'Mesajlardaki linkler için Discord tarzı embed önizleme eklendi',
          'Kanal oluşturma artık gerçek zamanlı olarak diğer üyelere yansıyor',
        ],
      },
      {
        title: 'Küçük İyileştirmeler',
        icon: Wrench,
        color: 'text-accent-foreground',
        items: [
          'Sunucu yükleme hızı optimize edildi',
          'Avatar görüntüleme tüm bileşenlere entegre edildi',
        ],
      },
      {
        title: 'Düzeltilen Hatalar',
        icon: Bug,
        color: 'text-destructive',
        items: [
          'Kanal listesi gerçek zamanlı güncellenmeme sorunu giderildi',
        ],
      },
    ],
  },
  {
    version: '0.0.1',
    date: '25 Şubat 2026',
    sections: [
      {
        title: 'Güncellemeler',
        icon: Sparkles,
        color: 'text-primary',
        items: [
          'Sunucu oluşturma ve katılma sistemi eklendi',
          'Davet linki oluşturma ve paylaşma özelliği eklendi',
          'Gerçek zamanlı mesajlaşma altyapısı kuruldu',
          'Kullanıcı durumu (çevrimiçi/meşgul/rahatsız etmeyin) desteği eklendi',
          'Güncelleme notları sayfası eklendi',
        ],
      },
      {
        title: 'Küçük İyileştirmeler',
        icon: Wrench,
        color: 'text-accent-foreground',
        items: [
          'Sunucular artık sadece üyelere görünür (Discord benzeri)',
          'Mobil arayüz iyileştirmeleri yapıldı',
          'Ayarlar sayfası responsive tasarımı güncellendi',
        ],
      },
      {
        title: 'Düzeltilen Hatalar',
        icon: Bug,
        color: 'text-destructive',
        items: [
          'Farklı hesaplardan sunucu görünürlük sorunu düzeltildi',
          'Kanal listesi sıralama hatası giderildi',
        ],
      },
    ],
  },
];

const Settings = () => {
  const { profile, signOut, user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('account');
  const isMobile = useIsMobile();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') navigate('/');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="h-screen flex flex-col md:flex-row bg-background text-foreground">
      {/* Mobil üst bar */}
      {isMobile && (
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-sidebar overflow-x-auto shrink-0">
          <button
            onClick={() => navigate('/')}
            className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm whitespace-nowrap transition-colors shrink-0 ${
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-destructive whitespace-nowrap shrink-0"
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
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors ${
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
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-destructive hover:bg-destructive/10 transition-colors"
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

              <div className="rounded-lg border border-border bg-card p-4 md:p-5 space-y-4">
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

                <div className="border-t border-border pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs uppercase text-muted-foreground font-semibold mb-1">Görünen Ad</p>
                    <p className="text-sm text-foreground">{profile?.display_name || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-muted-foreground font-semibold mb-1">Kullanıcı Adı</p>
                    <p className="text-sm text-foreground">{profile?.username || '—'}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-destructive/30 bg-card p-4 md:p-5 space-y-3">
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
              <div className="rounded-lg border border-border bg-card p-4 md:p-5">
                <p className="text-sm text-muted-foreground">Yakında eklenecek.</p>
              </div>
            </div>
          )}

          {activeTab === 'changelog' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Güncelleme Notları</h2>
              {changelogData.map((release) => (
                <div key={release.version} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 rounded-md bg-primary text-primary-foreground text-xs font-bold">
                      v{release.version}
                    </span>
                    <span className="text-sm text-muted-foreground">{release.date}</span>
                  </div>

                  {release.sections.map((section) => (
                    <div key={section.title} className="rounded-lg border border-border bg-card p-4 md:p-5 space-y-3">
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
              className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
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
