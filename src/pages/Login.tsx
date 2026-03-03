import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Eye, EyeOff, LogIn, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from '@/i18n';

const Login = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!identifier.trim()) errs.identifier = t('auth.emailRequired');
    if (!password) errs.password = t('auth.passwordRequired');
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    setErrors({});

    let email = identifier;
    if (!identifier.includes('@')) {
      setErrors({ identifier: t('auth.useEmailToLogin') });
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      if (error.message.includes('Email not confirmed')) {
        setErrors({ identifier: t('auth.emailNotConfirmed') });
      } else {
        setErrors({ identifier: t('auth.invalidCredentials') });
      }
      return;
    }

    toast.success(t('auth.loginSuccess'));
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <Sparkles className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">AuroraChat</h1>
          </div>
          <p className="text-muted-foreground">{t('auth.welcomeBack')}</p>
        </div>

        <form onSubmit={handleLogin} className="bg-card rounded-2xl p-8 shadow-xl border border-border space-y-5">
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-1">{t('auth.loginTitle')}</h2>
            <p className="text-sm text-muted-foreground">{t('auth.loginSubtitle')}</p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-muted-foreground mb-2">
              {t('auth.email')}
            </label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder={t('auth.emailPlaceholder')}
              className="w-full bg-input rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              maxLength={255}
            />
            {errors.identifier && <p className="text-destructive text-xs mt-1">{errors.identifier}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-muted-foreground mb-2">
              {t('auth.password')}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-input rounded-lg px-4 py-3 pr-10 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-destructive text-xs mt-1">{errors.password}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                {t('auth.loginButton')}
              </>
            )}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          {t('auth.noAccount')}{' '}
          <Link to="/register" className="text-primary hover:underline font-medium">
            {t('auth.register')}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
