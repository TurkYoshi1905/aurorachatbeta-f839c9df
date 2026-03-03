import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { I18nContext, getTranslationFunction, type Language } from '@/i18n';

interface Profile {
  id: string;
  user_id: string;
  display_name: string;
  username: string;
  avatar_url: string | null;
  language: Language;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    if (data) {
      setProfile({ ...data, language: (data as any).language || 'tr' });
    } else {
      setProfile(null);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setTimeout(() => fetchProfile(session.user.id), 0);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Realtime profile sync
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`profile-sync-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const updated = payload.new as any;
          setProfile({
            id: updated.id,
            user_id: updated.user_id,
            display_name: updated.display_name,
            username: updated.username,
            avatar_url: updated.avatar_url,
            language: updated.language || 'tr',
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  // i18n — derive language from profile
  const lang: Language = profile?.language || 'tr';
  const i18n = getTranslationFunction(lang);

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signOut }}>
      <I18nContext.Provider value={i18n}>
        {children}
      </I18nContext.Provider>
    </AuthContext.Provider>
  );
};