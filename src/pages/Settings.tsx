import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, X, User, Shield, Megaphone, Camera, ExternalLink, Pencil, Check, XIcon, Calendar, Lock, Globe, Monitor, Sun, Moon as MoonIcon, QrCode, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useState, useEffect, useRef } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { changelogData } from '@/data/changelogData';
import { useTranslation } from '@/i18n';
import { LANGUAGES, type Language } from '@/i18n';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

const TwoFactorSection = () => {
  const { t } = useTranslation();
  const [showDialog, setShowDialog] = useState(false);
  const [qrUri, setQrUri] = useState('');
  const [factorId, setFactorId] = useState('');
  const [otp, setOtp] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);

  useEffect(() => {
    const checkMFA = async () => {
      const { data } = await supabase.auth.mfa.listFactors();
      if (data?.totp && data.totp.length > 0) {
        const verified = data.totp.some(f => f.status === 'verified');
        setIs2FAEnabled(verified);
      }
    };
    checkMFA();
  }, []);

  const handleEnroll = async () => {
    setEnrolling(true);
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
    setEnrolling(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data) {
      setQrUri(data.totp.uri);
      setFactorId(data.id);
      setShowDialog(true);
    }
  };

  const handleVerify = async () => {
    if (otp.length !== 6) return;
    setVerifying(true);
    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
    if (challengeError) {
      toast.error(challengeError.message);
      setVerifying(false);
      return;
    }
    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code: otp,
    });
    setVerifying(false);
    if (verifyError) {
      toast.error(verifyError.message);
      return;
    }
    toast.success(t('settings.twoFactorEnabled'));
    setIs2FAEnabled(true);
    setShowDialog(false);
    setOtp('');
  };

  const handleUnenroll = async () => {
    const { data } = await supabase.auth.mfa.listFactors();
    const factor = data?.totp?.find(f => f.status === 'verified');
    if (!factor) return;
    const { error } = await supabase.auth.mfa.unenroll({ factorId: factor.id });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(t('settings.twoFactorDisabled'));
    setIs2FAEnabled(false);
  };

  return (
    <>
      <div className="rounded-xl border border-border bg-card p-4 md:p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-muted-foreground" />
          <p className="text-sm font-semibold text-foreground">{t('settings.twoFactor')}</p>
        </div>
        <p className="text-xs text-muted-foreground">{t('settings.twoFactorDesc')}</p>
        {is2FAEnabled ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-status-online font-medium">
              <ShieldCheck className="w-4 h-4" />
              {t('settings.twoFactorActive')}
            </div>
            <Button variant="outline" size="sm" onClick={handleUnenroll}>{t('settings.twoFactorDisable')}</Button>
          </div>
        ) : (
          <Button variant="outline" size="sm" onClick={handleEnroll} disabled={enrolling}>
            {enrolling ? <div className="w-4 h-4 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" /> : t('settings.twoFactorEnable')}
          </Button>
        )}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-primary" />
              {t('settings.twoFactorSetup')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{t('settings.twoFactorScanQR')}</p>
            {qrUri && (
              <div className="flex justify-center p-4 bg-white rounded-xl">
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrUri)}`} alt="TOTP QR Code" className="w-48 h-48" />
              </div>
            )}
            <p className="text-sm text-muted-foreground">{t('settings.twoFactorEnterCode')}</p>
            <div className="flex justify-center">
              <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
            <Button onClick={handleVerify} disabled={verifying || otp.length !== 6} className="w-full">
              {verifying ? <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> : t('settings.twoFactorVerify')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

const Settings = () => {
  const { profile, signOut, user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('account');
  const isMobile = useIsMobile();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editingField, setEditingField] = useState<'display_name' | 'username' | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [savingLang, setSavingLang] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  const tabs = [
    { id: 'account', label: t('settings.account'), icon: User },
    { id: 'privacy', label: t('settings.privacy'), icon: Shield },
    { id: 'appearance', label: t('settings.appearance'), icon: Globe },
    { id: 'changelog', label: t('settings.changelog'), icon: Megaphone },
  ];

  useEffect(() => {
    if (profile?.avatar_url) setAvatarUrl(profile.avatar_url);
  }, [profile]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith('image/')) { toast.error(t('settings.selectImage')); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error(t('settings.fileTooLarge')); return; }
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${user.id}/avatar.${ext}`;
    const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (uploadError) { toast.error(t('settings.uploadFailed')); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
    const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;
    await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('user_id', user.id);
    setAvatarUrl(publicUrl);
    toast.success(t('settings.avatarUpdated'));
    setUploading(false);
  };

  const startEdit = (field: 'display_name' | 'username') => {
    setEditingField(field);
    setEditValue(field === 'display_name' ? (profile?.display_name || '') : (profile?.username || ''));
  };
  const cancelEdit = () => { setEditingField(null); setEditValue(''); };
  const saveEdit = async () => {
    if (!user || !editingField || !editValue.trim()) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({ [editingField]: editValue.trim() }).eq('user_id', user.id);
    setSaving(false);
    if (error) { toast.error(t('settings.updateFailed')); }
    else {
      toast.success(editingField === 'display_name' ? t('settings.displayNameUpdated') : t('settings.usernameUpdated'));
      setEditingField(null);
    }
  };

  const handleLanguageChange = async (lang: Language) => {
    if (!user) return;
    setSavingLang(true);
    const { error } = await supabase.from('profiles').update({ language: lang } as any).eq('user_id', user.id);
    setSavingLang(false);
    if (error) { toast.error(t('settings.languageError')); return; }
    toast.success(t('settings.languageSaved'));
    setTimeout(() => window.location.reload(), 500);
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    // Apply theme
    const root = document.documentElement;
    if (newTheme === 'light') {
      root.classList.add('light');
      root.classList.remove('dark');
    } else if (newTheme === 'dark') {
      root.classList.remove('light');
      root.classList.add('dark');
    } else {
      // system
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) { root.classList.add('dark'); root.classList.remove('light'); }
      else { root.classList.add('light'); root.classList.remove('dark'); }
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error('Oturum bulunamadı'); setDeleting(false); return; }

      const res = await supabase.functions.invoke('delete-account', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (res.error) {
        toast.error('Hesap silme başarısız oldu');
        setDeleting(false);
        return;
      }

      toast.success('Hesabınız silindi');
      await signOut();
      navigate('/login');
    } catch {
      toast.error('Hesap silme başarısız oldu');
      setDeleting(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { editingField ? cancelEdit() : navigate('/'); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, editingField]);

  const handleSignOut = async () => { await signOut(); };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(profile?.language === 'en' ? 'en-US' : profile?.language === 'de' ? 'de-DE' : profile?.language === 'ja' ? 'ja-JP' : profile?.language === 'ru' ? 'ru-RU' : profile?.language === 'az' ? 'az-AZ' : 'tr-TR', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  };

  const themeOptions = [
    { value: 'dark', label: 'Koyu', icon: MoonIcon },
    { value: 'light', label: 'Açık', icon: Sun },
    { value: 'system', label: 'Sistem', icon: Monitor },
  ];

  return (
    <div className="h-screen flex flex-col md:flex-row bg-background text-foreground overflow-hidden">
      {isMobile && (
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-sidebar overflow-x-auto shrink-0">
          <button onClick={() => navigate('/')} className="w-8 h-8 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-foreground shrink-0">
            <X className="w-4 h-4" />
          </button>
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors shrink-0 ${activeTab === tab.id ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
          <button onClick={handleSignOut} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-destructive whitespace-nowrap shrink-0">
            <LogOut className="w-4 h-4" />
            {t('auth.logoutShort')}
          </button>
        </div>
      )}

      {!isMobile && (
        <div className="w-56 bg-sidebar flex flex-col items-end py-10 pr-2 pl-4 overflow-y-auto shrink-0">
          <div className="w-full space-y-0.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-2 mb-2">{t('settings.title')}</p>
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors ${activeTab === tab.id ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'}`}>
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
            <div className="border-t border-border my-2" />
            <button onClick={handleSignOut} className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors">
              <LogOut className="w-4 h-4" />
              {t('auth.logout')}
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 flex min-h-0">
        <div className="w-full max-w-2xl py-6 md:py-10 px-4 md:px-10 overflow-y-auto">
          {activeTab === 'account' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">{t('settings.myAccount')}</h2>
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
                    <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <Camera className="w-5 h-5 text-white" />
                    </button>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg font-semibold text-foreground truncate">{profile?.display_name || t('common.user')}</p>
                    <p className="text-sm text-muted-foreground truncate">@{profile?.username || 'user'}</p>
                  </div>
                </div>
                <div className="border-t border-border pt-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs uppercase text-muted-foreground font-semibold mb-1">{t('settings.displayName')}</p>
                      {editingField === 'display_name' ? (
                        <div className="flex items-center gap-2">
                          <Input value={editValue} onChange={(e) => setEditValue(e.target.value)} className="h-8 bg-input border-border text-sm" autoFocus onKeyDown={(e) => e.key === 'Enter' && saveEdit()} />
                          <button onClick={saveEdit} disabled={saving} className="text-primary hover:text-primary/80 shrink-0"><Check className="w-4 h-4" /></button>
                          <button onClick={cancelEdit} className="text-muted-foreground hover:text-foreground shrink-0"><XIcon className="w-4 h-4" /></button>
                        </div>
                      ) : (
                        <p className="text-sm text-foreground">{profile?.display_name || '—'}</p>
                      )}
                    </div>
                    {editingField !== 'display_name' && (
                      <button onClick={() => startEdit('display_name')} className="p-2 rounded-lg bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors shrink-0">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs uppercase text-muted-foreground font-semibold mb-1">{t('settings.username')}</p>
                      {editingField === 'username' ? (
                        <div className="flex items-center gap-2">
                          <Input value={editValue} onChange={(e) => setEditValue(e.target.value)} className="h-8 bg-input border-border text-sm" autoFocus onKeyDown={(e) => e.key === 'Enter' && saveEdit()} />
                          <button onClick={saveEdit} disabled={saving} className="text-primary hover:text-primary/80 shrink-0"><Check className="w-4 h-4" /></button>
                          <button onClick={cancelEdit} className="text-muted-foreground hover:text-foreground shrink-0"><XIcon className="w-4 h-4" /></button>
                        </div>
                      ) : (
                        <p className="text-sm text-foreground">@{profile?.username || '—'}</p>
                      )}
                    </div>
                    {editingField !== 'username' && (
                      <button onClick={() => startEdit('username')} className="p-2 rounded-lg bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors shrink-0">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div>
                    <p className="text-xs uppercase text-muted-foreground font-semibold mb-1">{t('settings.emailLabel')}</p>
                    <p className="text-sm text-foreground">{user?.email || '—'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                      {user?.created_at ? formatDate(user.created_at) : '—'} {t('settings.memberSince')}
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-destructive/30 bg-card p-4 md:p-5 space-y-3">
                <p className="text-sm font-semibold text-foreground">{t('settings.deleteAccount')}</p>
                <p className="text-xs text-muted-foreground">{t('settings.deleteAccountDesc')}</p>
                <Button variant="destructive" size="sm" onClick={() => setDeleteDialogOpen(true)}>{t('settings.deleteAccountButton')}</Button>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">{t('settings.privacySecurity')}</h2>
              <div className="rounded-xl border border-border bg-card p-4 md:p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t('settings.allowDM')}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t('settings.allowDMDesc')}</p>
                  </div>
                  <Switch defaultChecked={localStorage.getItem('privacy_allow_dm') !== 'false'} onCheckedChange={(v) => localStorage.setItem('privacy_allow_dm', String(v))} />
                </div>
              </div>
              <div className="rounded-xl border border-border bg-card p-4 md:p-5 space-y-4">
                <p className="text-sm font-semibold text-foreground">{t('settings.friendRequests')}</p>
                <p className="text-xs text-muted-foreground">{t('settings.friendRequestsDesc')}</p>
                <RadioGroup defaultValue={localStorage.getItem('privacy_friend_requests') || 'everyone'} onValueChange={(v) => localStorage.setItem('privacy_friend_requests', v)} className="space-y-2">
                  <div className="flex items-center gap-3"><RadioGroupItem value="everyone" id="fr-everyone" /><Label htmlFor="fr-everyone" className="text-sm cursor-pointer">{t('settings.everyone')}</Label></div>
                  <div className="flex items-center gap-3"><RadioGroupItem value="friends" id="fr-friends" /><Label htmlFor="fr-friends" className="text-sm cursor-pointer">{t('settings.mutualFriends')}</Label></div>
                  <div className="flex items-center gap-3"><RadioGroupItem value="none" id="fr-none" /><Label htmlFor="fr-none" className="text-sm cursor-pointer">{t('settings.nobody')}</Label></div>
                </RadioGroup>
              </div>
              <TwoFactorSection />
              <div className="rounded-xl border border-border bg-card p-4 md:p-5">
                <button onClick={() => navigate('/privacy-policy')} className="flex items-center gap-2 text-sm text-primary hover:underline">
                  <ExternalLink className="w-3.5 h-3.5" />
                  {t('settings.viewPrivacyPolicy')}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">{t('settings.appearance')}</h2>

              {/* Theme Picker */}
              <div className="rounded-xl border border-border bg-card p-4 md:p-5 space-y-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">Tema</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Uygulamanın görünümünü özelleştir</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {themeOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleThemeChange(opt.value)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                        theme === opt.value
                          ? 'bg-primary/10 border-primary/40 text-primary'
                          : 'border-border text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                      }`}
                    >
                      <opt.icon className="w-5 h-5" />
                      <span className="text-xs font-medium">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Language */}
              <div className="rounded-xl border border-border bg-card p-4 md:p-5 space-y-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">{t('settings.languageTitle')}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{t('settings.languageDesc')}</p>
                </div>
                <div className="space-y-1">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageChange(lang.code)}
                      disabled={savingLang}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors ${
                        profile?.language === lang.code
                          ? 'bg-primary/10 text-primary border border-primary/30'
                          : 'text-foreground hover:bg-secondary/50'
                      }`}
                    >
                      <span className="font-medium">{lang.label}</span>
                      {profile?.language === lang.code && <Check className="w-4 h-4" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'changelog' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">{t('settings.changelog')}</h2>
                <button onClick={() => navigate('/changelog')} className="flex items-center gap-1.5 text-xs text-primary hover:underline">
                  {t('settings.viewAll')} <ExternalLink className="w-3 h-3" />
                </button>
              </div>
              {changelogData.slice(0, 3).map((release) => (
                <div key={release.version} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 rounded-lg bg-primary text-primary-foreground text-xs font-bold">v{release.version}</span>
                    <span className="text-sm text-muted-foreground">{release.date}</span>
                  </div>
                  {release.sections.map((section) => (
                    <div key={section.title} className="rounded-xl border border-border bg-card p-4 md:p-5 space-y-3">
                      <div className="flex items-center gap-2">
                        <section.icon className={`w-4 h-4 ${section.color}`} />
                        <p className="text-sm font-semibold text-foreground">{section.title}</p>
                      </div>
                      <ul className="space-y-1.5 ml-6">
                        {section.items.map((item, i) => (<li key={i} className="text-sm text-muted-foreground list-disc">{item}</li>))}
                      </ul>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        {!isMobile && (
          <div className="py-10 pr-6 shrink-0">
            <button onClick={() => navigate('/')} className="w-9 h-9 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground transition-colors">
              <X className="w-5 h-5" />
            </button>
            <p className="text-[10px] text-muted-foreground text-center mt-1">ESC</p>
          </div>
        )}
      </div>

      {/* Delete Account Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hesabı Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. Hesabınız kalıcı olarak silinecek, mesajlarınız anonim olarak korunacaktır. Sahip olduğunuz sunucular silinecektir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAccount} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? 'Siliniyor...' : 'Hesabı Sil'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Settings;
