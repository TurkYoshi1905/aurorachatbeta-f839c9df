import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const AuthCallback = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const { error } = await supabase.auth.getSession();
        if (error) throw error;
        setStatus('success');
      } catch {
        setStatus('error');
      }
    };
    handleCallback();
  }, []);

  return (
    <div className="h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        {status === 'loading' && (
          <>
            <Loader2 className="w-16 h-16 text-primary mx-auto animate-spin mb-4" />
            <h1 className="text-xl font-semibold text-foreground">Doğrulanıyor...</h1>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 text-aurora-green mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">E-postanız başarıyla doğrulandı!</h1>
            <p className="text-muted-foreground mb-6">Bu sekmeyi kapatabilirsiniz veya giriş yapabilirsiniz.</p>
            <Link
              to="/login"
              className="inline-block bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              Giriş Yap
            </Link>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Doğrulama başarısız</h1>
            <p className="text-muted-foreground mb-6">Bağlantı geçersiz veya süresi dolmuş olabilir.</p>
            <Link
              to="/login"
              className="inline-block bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              Giriş sayfasına dön
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;
