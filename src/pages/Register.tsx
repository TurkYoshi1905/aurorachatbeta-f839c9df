import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Eye, EyeOff, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

type Step = 'names' | 'password' | 'email';

const Register = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('names');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (step === 'names') {
      if (!displayName.trim()) e.displayName = 'Görünen ad gerekli';
      if (!username.trim()) e.username = 'Kullanıcı adı gerekli';
      else if (username !== username.toLowerCase()) e.username = 'Sadece küçük harfler kullanılabilir';
      else if (username.length < 3) e.username = 'En az 3 karakter olmalı';
      else if (!/^[a-z0-9_]+$/.test(username)) e.username = 'Sadece küçük harf, rakam ve _ kullanılabilir';
    }
    if (step === 'password') {
      if (password.length < 6) e.password = 'En az 6 karakter olmalı';
      if (password !== confirmPassword) e.confirmPassword = 'Şifreler eşleşmiyor';
    }
    if (step === 'email') {
      if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Geçerli bir e-posta girin';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = async () => {
    if (!validate()) return;

    if (step === 'names') {
      setLoading(true);
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .maybeSingle();
      setLoading(false);
      if (data) {
        setErrors({ username: 'Bu kullanıcı adı zaten alınmış' });
        return;
      }
      setStep('password');
    } else if (step === 'password') {
      setStep('email');
    } else if (step === 'email') {
      setLoading(true);
      try {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              display_name: displayName,
              username,
            },
          },
        });
        if (error) {
          setErrors({ email: error.message });
          setLoading(false);
          return;
        }
        toast.success('Doğrulama bağlantısı e-posta adresinize gönderildi! Lütfen kontrol edin.');
        navigate('/login');
      } catch {
        setErrors({ email: 'Bir hata oluştu' });
      }
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 'password') setStep('names');
    else if (step === 'email') setStep('password');
  };

  const steps: Step[] = ['names', 'password', 'email'];
  const currentIndex = steps.indexOf(step);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <Sparkles className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">AuroraChat</h1>
          </div>
          <p className="text-muted-foreground">Hesap oluştur</p>
        </div>

        <div className="flex gap-2 mb-8">
          {steps.map((s, i) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                i <= currentIndex ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>

        <div className="bg-card rounded-2xl p-8 shadow-xl border border-border">
          {step === 'names' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-1">Kendini tanıt</h2>
                <p className="text-sm text-muted-foreground">Diğer kullanıcıların seni göreceği isim</p>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-muted-foreground mb-2">Görünen Ad</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Örn: Mehmet Güneş"
                  className="w-full bg-input rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  maxLength={50}
                />
                {errors.displayName && <p className="text-destructive text-xs mt-1">{errors.displayName}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-muted-foreground mb-2">Kullanıcı Adı</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="Örn: mehmet_gunes"
                  className="w-full bg-input rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  maxLength={30}
                />
                {errors.username && <p className="text-destructive text-xs mt-1">{errors.username}</p>}
                <p className="text-[11px] text-muted-foreground mt-1">Sadece küçük harfler, rakamlar ve alt çizgi</p>
              </div>
            </div>
          )}

          {step === 'password' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-1">Şifreni belirle</h2>
                <p className="text-sm text-muted-foreground">Güçlü bir şifre seç</p>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-muted-foreground mb-2">Şifre</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-input rounded-lg px-4 py-3 pr-10 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-destructive text-xs mt-1">{errors.password}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-muted-foreground mb-2">Şifreyi Tekrarla</label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-input rounded-lg px-4 py-3 pr-10 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-destructive text-xs mt-1">{errors.confirmPassword}</p>}
              </div>
            </div>
          )}

          {step === 'email' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-1">E-posta adresin</h2>
                <p className="text-sm text-muted-foreground">Doğrulama bağlantısı göndereceğiz</p>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-muted-foreground mb-2">E-Posta</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ornek@email.com"
                  className="w-full bg-input rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  maxLength={255}
                />
                {errors.email && <p className="text-destructive text-xs mt-1">{errors.email}</p>}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 mt-8">
            {step !== 'names' && (
              <button onClick={handleBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Geri
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={loading}
              className="ml-auto flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-6 py-2.5 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <>
                  {step === 'email' ? 'Kayıt Ol' : 'Devam'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Zaten hesabın var mı?{' '}
          <Link to="/login" className="text-primary hover:underline font-medium">
            Giriş yap
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
