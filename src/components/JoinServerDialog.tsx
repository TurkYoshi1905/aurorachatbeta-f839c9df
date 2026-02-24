import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface JoinServerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onServerJoined: () => void;
}

const JoinServerDialog = ({ open, onOpenChange, onServerJoined }: JoinServerDialogProps) => {
  const { user } = useAuth();
  const [inviteInput, setInviteInput] = useState('');
  const [loading, setLoading] = useState(false);

  const extractCode = (input: string): string => {
    const trimmed = input.trim();
    // Match invite URL pattern: /invite/CODE
    const urlMatch = trimmed.match(/\/invite\/([a-zA-Z0-9]+)$/);
    if (urlMatch) return urlMatch[1];
    // Otherwise treat as raw code
    return trimmed;
  };

  const handleJoin = async () => {
    if (!inviteInput.trim() || !user) return;
    setLoading(true);

    const code = extractCode(inviteInput);

    const { data: invite, error: inviteError } = await supabase
      .from('server_invites')
      .select('*, servers(id, name, icon)')
      .eq('code', code)
      .maybeSingle();

    if (inviteError || !invite) {
      toast.error('Geçersiz davet kodu veya linki');
      setLoading(false);
      return;
    }

    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      toast.error('Bu davet süresi dolmuş');
      setLoading(false);
      return;
    }

    if (invite.max_uses && invite.uses >= invite.max_uses) {
      toast.error('Bu davetin kullanım limiti dolmuş');
      setLoading(false);
      return;
    }

    // Check if already a member
    const { data: existing } = await supabase
      .from('server_members')
      .select('id')
      .eq('server_id', invite.server_id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) {
      toast.info('Bu sunucuya zaten katılmışsın!');
      setLoading(false);
      onOpenChange(false);
      return;
    }

    // Join server
    const { error: joinError } = await supabase
      .from('server_members')
      .insert({ server_id: invite.server_id, user_id: user.id });

    if (joinError) {
      toast.error('Sunucuya katılırken hata oluştu');
      setLoading(false);
      return;
    }

    // Increment uses
    await supabase
      .from('server_invites')
      .update({ uses: invite.uses + 1 })
      .eq('id', invite.id);

    toast.success(`${(invite as any).servers?.name || 'Sunucu'} sunucusuna katıldın!`);
    setInviteInput('');
    setLoading(false);
    onOpenChange(false);
    onServerJoined();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-background border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground text-center">Sunucuya Katıl</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label className="text-xs font-semibold uppercase text-muted-foreground">Davet Linki veya Kodu</Label>
            <Input
              value={inviteInput}
              onChange={(e) => setInviteInput(e.target.value)}
              placeholder="https://aurorachatdeneme.lovable.app/invite/abc123 veya abc123"
              className="mt-1.5 bg-input border-border"
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            />
            <p className="text-[11px] text-muted-foreground mt-1.5">Sunucu sahibinden aldığın davet linkini veya kodunu gir.</p>
          </div>
          <Button onClick={handleJoin} disabled={loading || !inviteInput.trim()} className="w-full">
            {loading ? 'Katılınıyor...' : 'Sunucuya Katıl'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default JoinServerDialog;
