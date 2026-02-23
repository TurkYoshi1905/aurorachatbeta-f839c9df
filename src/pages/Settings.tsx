import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, X, User, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const tabs = [
  { id: 'account', label: 'Hesabım', icon: User },
  { id: 'privacy', label: 'Gizlilik', icon: Shield },
];

const Settings = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('account');

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="h-screen flex bg-background text-foreground">
      {/* Sol sidebar */}
      <div className="w-56 bg-sidebar flex flex-col items-end py-10 pr-2 pl-4 overflow-y-auto">
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

      {/* İçerik */}
      <div className="flex-1 flex">
        <div className="w-full max-w-2xl py-10 px-10 overflow-y-auto">
          {activeTab === 'account' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Hesabım</h2>

              <div className="rounded-lg border border-border bg-card p-5 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-2xl font-bold text-primary-foreground">
                    {profile?.display_name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-foreground">{profile?.display_name || 'Kullanıcı'}</p>
                    <p className="text-sm text-muted-foreground">@{profile?.username || 'user'}</p>
                  </div>
                </div>

                <div className="border-t border-border pt-4 grid grid-cols-2 gap-4">
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

              <div className="rounded-lg border border-destructive/30 bg-card p-5 space-y-3">
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
              <div className="rounded-lg border border-border bg-card p-5">
                <p className="text-sm text-muted-foreground">Yakında eklenecek.</p>
              </div>
            </div>
          )}
        </div>

        {/* Kapat butonu */}
        <div className="py-10 pr-6">
          <button
            onClick={() => navigate('/')}
            className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <p className="text-[10px] text-muted-foreground text-center mt-1">ESC</p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
