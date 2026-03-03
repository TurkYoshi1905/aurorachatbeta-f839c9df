import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ServerInviteEmbedProps {
  code: string;
}

const ServerInviteEmbed = ({ code }: ServerInviteEmbedProps) => {
  const { user } = useAuth();
  const [server, setServer] = useState<{ id: string; name: string; icon: string } | null>(null);
  const [alreadyMember, setAlreadyMember] = useState(false);
  const [joining, setJoining] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const fetchInvite = async () => {
      const { data } = await supabase.rpc('get_server_by_invite_code', { _code: code });

      if (data && data.length > 0) {
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
      }
      setLoaded(true);
    };
    fetchInvite();
  }, [code, user]);

  if (!loaded || !server) return null;

  const handleJoin = async () => {
    if (!user || !server) return;
    setJoining(true);
    const { error } = await supabase
      .from('server_members')
      .insert({ server_id: server.id, user_id: user.id });

    if (!error) {
      setAlreadyMember(true);
      toast.success(`${server.name} sunucusuna katıldın!`);
    } else {
      toast.error('Katılırken hata oluştu');
    }
    setJoining(false);
  };

  return (
    <div className="mt-1 inline-flex items-center gap-3 bg-secondary/60 border border-border rounded-lg px-3 py-2.5 max-w-xs">
      <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-lg font-bold text-primary-foreground shrink-0 overflow-hidden">
        {server.icon && (server.icon.startsWith('http') || server.icon.startsWith('/')) ? (
          <img src={server.icon} alt="" className="w-full h-full object-cover rounded-xl" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
        ) : (
          server.icon || server.name.charAt(0).toUpperCase()
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{server.name}</p>
        <p className="text-[10px] text-muted-foreground">Sunucu Daveti</p>
      </div>
      {alreadyMember ? (
        <Button size="sm" variant="secondary" disabled className="text-xs shrink-0">Katıldın</Button>
      ) : (
        <Button size="sm" onClick={handleJoin} disabled={joining} className="text-xs shrink-0">
          {joining ? '...' : 'Katıl'}
        </Button>
      )}
    </div>
  );
};

export default ServerInviteEmbed;
