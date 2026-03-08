import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { UserPlus, MessageCircle, Check, X, Users, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from '@/i18n';

interface FriendProfile { userId: string; displayName: string; username: string; avatarUrl: string | null; }
interface FriendRequest { id: string; senderId: string; receiverId: string; status: string; profile: FriendProfile; }
interface DMDashboardProps { onOpenDM: (user: FriendProfile) => void; }

const DMDashboard = ({ onOpenDM }: DMDashboardProps) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [friends, setFriends] = useState<FriendRequest[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [searchUsername, setSearchUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchFriends = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('friends').select('*').or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);
    if (!data) return;
    const otherUserIds = data.map((f: any) => f.sender_id === user.id ? f.receiver_id : f.sender_id);
    let profilesMap = new Map<string, any>();
    if (otherUserIds.length > 0) {
      const { data: profiles } = await supabase.from('profiles').select('*').in('user_id', otherUserIds);
      if (profiles) profiles.forEach((p: any) => profilesMap.set(p.user_id, p));
    }
    const accepted: FriendRequest[] = [], pending: FriendRequest[] = [], sent: FriendRequest[] = [];
    for (const f of data as any[]) {
      const otherUserId = f.sender_id === user.id ? f.receiver_id : f.sender_id;
      const prof = profilesMap.get(otherUserId);
      const friendReq: FriendRequest = { id: f.id, senderId: f.sender_id, receiverId: f.receiver_id, status: f.status, profile: { userId: otherUserId, displayName: prof?.display_name || t('common.user'), username: prof?.username || '', avatarUrl: prof?.avatar_url || null } };
      if (f.status === 'accepted') accepted.push(friendReq);
      else if (f.status === 'pending') { if (f.receiver_id === user.id) pending.push(friendReq); else sent.push(friendReq); }
    }
    setFriends(accepted); setPendingRequests(pending); setSentRequests(sent);
  }, [user, t]);

  useEffect(() => { fetchFriends(); }, [fetchFriends]);

  const handleSendRequest = async () => {
    if (!user || !searchUsername.trim()) return;
    setLoading(true);
    const { data: targetProfile } = await supabase.from('profiles').select('user_id').eq('username', searchUsername.trim()).maybeSingle();
    if (!targetProfile) { toast.error(t('friends.userNotFound')); setLoading(false); return; }
    if (targetProfile.user_id === user.id) { toast.error(t('friends.cantAddSelf')); setLoading(false); return; }
    const { error } = await supabase.from('friends').insert({ sender_id: user.id, receiver_id: targetProfile.user_id } as any);
    if (error) { toast.error(error.code === '23505' ? t('friends.alreadyExists') : t('friends.sendFailed')); }
    else { toast.success(t('friends.requestSent')); setSearchUsername(''); fetchFriends(); }
    setLoading(false);
  };

  const handleAccept = async (friendId: string) => { await supabase.from('friends').update({ status: 'accepted' } as any).eq('id', friendId); toast.success(t('friends.accepted')); fetchFriends(); };
  const handleReject = async (friendId: string) => { await supabase.from('friends').delete().eq('id', friendId); toast.success(t('friends.rejected')); fetchFriends(); };
  const handleRemoveFriend = async (friendId: string) => { await supabase.from('friends').delete().eq('id', friendId); toast.success(t('friends.removed')); fetchFriends(); };

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-20 text-center px-6">
      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 via-accent/10 to-primary/5 flex items-center justify-center mb-6">
        <Sparkles className="w-10 h-10 text-primary/60" />
      </div>
      <p className="text-xl font-bold text-foreground mb-2">{t('friends.noFriendsTitle')}</p>
      <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">{t('friends.noFriendsDesc')}</p>
    </div>
  );

  const FriendRow = ({ friend, showMessage = true }: { friend: FriendRequest; showMessage?: boolean }) => (
    <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-secondary/40 rounded-xl transition-all group cursor-pointer">
      <Avatar className="h-10 w-10">
        {friend.profile.avatarUrl && <AvatarImage src={friend.profile.avatarUrl} />}
        <AvatarFallback className="bg-secondary text-foreground font-semibold">{friend.profile.displayName.charAt(0).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{friend.profile.displayName}</p>
        <p className="text-xs text-muted-foreground truncate">@{friend.profile.username}</p>
      </div>
      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        {showMessage && (
          <Button variant="ghost" size="icon" onClick={() => onOpenDM(friend.profile)} className="h-8 w-8 rounded-full bg-secondary/60 hover:bg-secondary text-foreground" title={t('friends.sendMessage')}>
            <MessageCircle className="w-4 h-4" />
          </Button>
        )}
        <Button variant="ghost" size="icon" onClick={() => handleRemoveFriend(friend.id)} className="h-8 w-8 rounded-full hover:bg-destructive/20 text-muted-foreground hover:text-destructive" title={t('friends.removeFriend')}>
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col min-w-0 min-h-0 h-full overflow-hidden">
      <div className="h-12 flex items-center px-4 border-b border-border shadow-sm gap-2">
        <Users className="w-5 h-5 text-muted-foreground" />
        <span className="font-semibold text-foreground">{t('friends.title')}</span>
      </div>
      <div className="flex-1 overflow-y-auto">
        <Tabs defaultValue="all" className="w-full">
          <div className="px-4 pt-4">
            <TabsList className="bg-secondary/50 rounded-xl">
              <TabsTrigger value="all">{t('friends.all')}</TabsTrigger>
              <TabsTrigger value="pending" className="relative">
                {t('friends.pending')}
                {pendingRequests.length > 0 && (<span className="ml-1.5 px-1.5 py-0.5 text-[10px] bg-destructive text-destructive-foreground rounded-full font-bold">{pendingRequests.length}</span>)}
              </TabsTrigger>
              <TabsTrigger value="add">{t('friends.addFriend')}</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="all" className="px-2 py-2">
            {friends.length === 0 ? <EmptyState /> : (
              <div className="space-y-0.5">
                <p className="text-xs font-semibold uppercase text-muted-foreground px-4 py-2">{t('friends.allFriends')} — {friends.length}</p>
                {friends.map((f) => (<FriendRow key={f.id} friend={f} />))}
              </div>
            )}
          </TabsContent>
          <TabsContent value="pending" className="px-2 py-2">
            {pendingRequests.length === 0 && sentRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-secondary/30 flex items-center justify-center mb-4">
                  <Users className="w-8 h-8 text-muted-foreground/40" />
                </div>
                <p className="text-sm text-muted-foreground">{t('friends.noPending')}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingRequests.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase text-muted-foreground px-4 py-2">{t('friends.incomingRequests')} — {pendingRequests.length}</p>
                    {pendingRequests.map((req) => (
                      <div key={req.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-secondary/40 rounded-xl transition-all">
                        <Avatar className="h-10 w-10">{req.profile.avatarUrl && <AvatarImage src={req.profile.avatarUrl} />}<AvatarFallback className="bg-secondary text-foreground font-semibold">{req.profile.displayName.charAt(0).toUpperCase()}</AvatarFallback></Avatar>
                        <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-foreground truncate">{req.profile.displayName}</p><p className="text-xs text-muted-foreground">{t('friends.incomingRequest')}</p></div>
                        <div className="flex items-center gap-1.5">
                          <Button variant="ghost" size="icon" onClick={() => handleAccept(req.id)} className="h-8 w-8 rounded-full bg-green-500/10 text-green-500 hover:bg-green-500/20 hover:text-green-400"><Check className="w-5 h-5" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleReject(req.id)} className="h-8 w-8 rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20"><X className="w-5 h-5" /></Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {sentRequests.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase text-muted-foreground px-4 py-2">{t('friends.sentRequests')} — {sentRequests.length}</p>
                    {sentRequests.map((req) => (
                      <div key={req.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-secondary/40 rounded-xl transition-all">
                        <Avatar className="h-10 w-10">{req.profile.avatarUrl && <AvatarImage src={req.profile.avatarUrl} />}<AvatarFallback className="bg-secondary text-foreground font-semibold">{req.profile.displayName.charAt(0).toUpperCase()}</AvatarFallback></Avatar>
                        <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-foreground truncate">{req.profile.displayName}</p><p className="text-xs text-muted-foreground">{t('friends.sentRequest')}</p></div>
                        <Button variant="ghost" size="icon" onClick={() => handleReject(req.id)} className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"><X className="w-4 h-4" /></Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </TabsContent>
          <TabsContent value="add" className="px-4 py-6">
            <div className="max-w-md space-y-4">
              <div><h3 className="text-base font-semibold text-foreground mb-1">{t('friends.addFriendTitle')}</h3><p className="text-sm text-muted-foreground">{t('friends.addFriendDesc')}</p></div>
              <div className="flex gap-2">
                <Input placeholder={t('friends.usernamePlaceholder')} value={searchUsername} onChange={(e) => setSearchUsername(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendRequest()} className="bg-secondary/50 border-border" />
                <Button onClick={handleSendRequest} disabled={loading || !searchUsername.trim()}><UserPlus className="w-4 h-4 mr-1" />{t('friends.send')}</Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DMDashboard;
