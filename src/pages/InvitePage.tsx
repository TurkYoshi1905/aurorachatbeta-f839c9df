import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

const InvitePage = () => {
  const { code } = useParams<{ code: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [server, setServer] = useState<{ id: string; name: string; icon: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [alreadyMember, setAlreadyMember] = useState(false);

  useEffect(() => {
    const fetchInvite = async () => {
      if (!code) { setLoading(false); return; }

      const { data } = await supabase.rpc('get_server_by_invite_code', { _code: code });

      if (!data || data.length === 0) {
        setLoading(false);
        return;
      }

      const s = data[0];
      setServer({ id: s.id, name: s.name, icon: s.icon });

      if (user) {
        const { data: membership } = await supabase
          .from('server_members')
          .select('id')
          .eq('server_id', s.id)
          .eq('user_id', user.id)
          .maybeSingle();
        setAlreadyMember(!!membership);
      }

      setLoading(false);
    };
    fetchInvite();
  }, [code, user]);

  const handleJoin = async () => {
    if (!user || !server || !code) return;
    setJoining(true);

    const { error } = await supabase
      .from('server_members')
      .insert({ server_id: server.id, user_id: user.id });

    if (error) {
      toast.error('Katılırken hata oluştu');
      setJoining(false);
      return;
    }

    // Update invite uses
    const { data: inviteData } = await supabase
      .from('server_invites')
      .select('id, uses')
      .eq('code', code)
      .maybeSingle();

    if (inviteData) {
      await supabase
        .from('server_invites')
        .update({ uses: inviteData.uses + 1 })
        .eq('id', inviteData.id);
    }

    toast.success(`${server.name} sunucusuna katıldın!`);
    navigate('/');
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Yükleniyor...</p>
      </div>
    );
  }

  if (!server) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-background gap-4">
        <p className="text-xl font-semibold text-foreground">Geçersiz Davet</p>
        <p className="text-muted-foreground">Bu davet linki geçersiz veya süresi dolmuş.</p>
        <Button onClick={() => navigate('/')}>Ana Sayfaya Dön</Button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-background gap-4">
        <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center text-4xl font-bold text-primary-foreground">
          {server.icon}
        </div>
        <p className="text-xl font-semibold text-foreground">{server.name}</p>
        <p className="text-muted-foreground">Katılmak için giriş yapmalısın.</p>
        <Button onClick={() => navigate('/login')}>Giriş Yap</Button>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-background gap-4">
      <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center text-4xl font-bold text-primary-foreground">
        {server.icon}
      </div>
      <p className="text-xl font-semibold text-foreground">{server.name}</p>
      <p className="text-muted-foreground text-sm">Seni bu sunucuya davet ettiler!</p>
      {alreadyMember ? (
        <Button variant="secondary" onClick={() => navigate('/')}>Zaten Katıldın — Ana Sayfaya Dön</Button>
      ) : (
        <Button onClick={handleJoin} disabled={joining}>
          {joining ? 'Katılınıyor...' : 'Sunucuya Katıl'}
        </Button>
      )}
    </div>
  );
};

export default InvitePage;
