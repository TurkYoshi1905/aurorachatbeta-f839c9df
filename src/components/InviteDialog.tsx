import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Copy, RefreshCw } from 'lucide-react';

interface InviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serverId: string;
  serverName: string;
}

const InviteDialog = ({ open, onOpenChange, serverId, serverName }: InviteDialogProps) => {
  const { user } = useAuth();
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    return code;
  };

  const fetchOrCreateInvite = async () => {
    if (!user) return;
    setLoading(true);

    // Check existing invite
    const { data: existing } = await supabase
      .from('server_invites')
      .select('code')
      .eq('server_id', serverId)
      .eq('created_by', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing) {
      setInviteCode(existing.code);
      setLoading(false);
      return;
    }

    // Create new
    const code = generateCode();
    const { error } = await supabase.from('server_invites').insert({
      server_id: serverId,
      code,
      created_by: user.id,
    });

    if (error) {
      toast.error('Davet oluşturulamadı');
      setLoading(false);
      return;
    }

    setInviteCode(code);
    setLoading(false);
  };

  useEffect(() => {
    if (open) fetchOrCreateInvite();
  }, [open]);

  const inviteLink = `${window.location.origin}/invite/${inviteCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    toast.success('Davet linki kopyalandı!');
  };

  const handleNewCode = async () => {
    if (!user) return;
    setLoading(true);
    const code = generateCode();
    const { error } = await supabase.from('server_invites').insert({
      server_id: serverId,
      code,
      created_by: user.id,
    });
    if (!error) {
      setInviteCode(code);
      toast.success('Yeni davet kodu oluşturuldu!');
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-background border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground text-center">
            Arkadaşlarını {serverName} sunucusuna davet et
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label className="text-xs font-semibold uppercase text-muted-foreground">Davet Linki</Label>
            <div className="flex gap-2 mt-1.5">
              <Input
                value={inviteLink}
                readOnly
                className="bg-input border-border text-sm"
              />
              <Button size="icon" variant="secondary" onClick={handleCopy} disabled={!inviteCode}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-muted-foreground">Bu linki paylaşarak arkadaşlarını davet et.</p>
            <Button variant="ghost" size="sm" onClick={handleNewCode} disabled={loading}>
              <RefreshCw className="w-3.5 h-3.5 mr-1" />
              Yeni Kod
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InviteDialog;
