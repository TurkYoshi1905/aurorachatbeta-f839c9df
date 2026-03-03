import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useTranslation } from '@/i18n';

interface JoinServerDialogProps { open: boolean; onOpenChange: (open: boolean) => void; onServerJoined: () => void; }

const JoinServerDialog = ({ open, onOpenChange, onServerJoined }: JoinServerDialogProps) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [inviteInput, setInviteInput] = useState('');
  const [loading, setLoading] = useState(false);

  const extractCode = (input: string): string => { const trimmed = input.trim(); const urlMatch = trimmed.match(/\/invite\/([a-zA-Z0-9]+)$/); if (urlMatch) return urlMatch[1]; return trimmed; };

  const handleJoin = async () => {
    if (!inviteInput.trim() || !user) return;
    setLoading(true);
    const code = extractCode(inviteInput);
    const { data: invite, error: inviteError } = await supabase.from('server_invites').select('*, servers(id, name, icon)').eq('code', code).maybeSingle();
    if (inviteError || !invite) { toast.error(t('joinServer.invalidCode')); setLoading(false); return; }
    if (invite.expires_at && new Date(invite.expires_at) < new Date()) { toast.error(t('joinServer.expired')); setLoading(false); return; }
    if (invite.max_uses && invite.uses >= invite.max_uses) { toast.error(t('joinServer.maxUses')); setLoading(false); return; }
    const { data: existing } = await supabase.from('server_members').select('id').eq('server_id', invite.server_id).eq('user_id', user.id).maybeSingle();
    if (existing) { toast.info(t('joinServer.alreadyMember')); setLoading(false); onOpenChange(false); return; }
    const { error: joinError } = await supabase.from('server_members').insert({ server_id: invite.server_id, user_id: user.id });
    if (joinError) { toast.error(t('joinServer.joinError')); setLoading(false); return; }
    await supabase.from('server_invites').update({ uses: invite.uses + 1 }).eq('id', invite.id);
    toast.success(t('joinServer.joined', { server: (invite as any).servers?.name || 'Server' }));
    setInviteInput(''); setLoading(false); onOpenChange(false); onServerJoined();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-background border-border">
        <DialogHeader><DialogTitle className="text-foreground text-center">{t('joinServer.title')}</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label className="text-xs font-semibold uppercase text-muted-foreground">{t('joinServer.inviteLinkLabel')}</Label>
            <Input value={inviteInput} onChange={(e) => setInviteInput(e.target.value)} placeholder={t('joinServer.placeholder')} className="mt-1.5 bg-input border-border" onKeyDown={(e) => e.key === 'Enter' && handleJoin()} />
            <p className="text-[11px] text-muted-foreground mt-1.5">{t('joinServer.hint')}</p>
          </div>
          <Button onClick={handleJoin} disabled={loading || !inviteInput.trim()} className="w-full">{loading ? t('joinServer.joining') : t('joinServer.joinButton')}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default JoinServerDialog;
