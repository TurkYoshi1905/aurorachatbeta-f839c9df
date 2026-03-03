import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/i18n';

interface CreateServerDialogProps { open: boolean; onOpenChange: (open: boolean) => void; onServerCreated: () => void; }

const CreateServerDialog = ({ open, onOpenChange, onServerCreated }: CreateServerDialogProps) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim() || !user) return;
    setLoading(true);
    const serverId = crypto.randomUUID();
    const icon = name.trim().charAt(0).toUpperCase();
    const { error: serverError } = await supabase.from('servers').insert({ id: serverId, name: name.trim(), icon, owner_id: user.id });
    if (serverError) { console.error('Server creation error:', serverError); setLoading(false); return; }
    await supabase.from('channels').insert({ id: crypto.randomUUID(), name: 'genel', type: 'text', server_id: serverId, position: 0 });
    setName(''); setLoading(false); onOpenChange(false); onServerCreated();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-background border-border">
        <DialogHeader><DialogTitle className="text-foreground text-center">{t('server.create')}</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label className="text-xs font-semibold uppercase text-muted-foreground">{t('server.serverName')}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('server.serverNamePlaceholder')} className="mt-1.5 bg-input border-border" maxLength={50} />
          </div>
          <Button onClick={handleCreate} disabled={loading || !name.trim()} className="w-full">{loading ? t('server.creating') : t('server.createButton')}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateServerDialog;
