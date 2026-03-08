import { useState, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from '@/i18n';
import { format } from 'date-fns';

interface UserProfileCardProps {
  userId: string;
  serverId?: string;
  children: React.ReactNode;
}

interface ProfileData {
  display_name: string;
  username: string;
  avatar_url: string | null;
  created_at: string;
}

interface RoleData {
  name: string;
  color: string;
}

const UserProfileCard = ({ userId, serverId, children }: UserProfileCardProps) => {
  const { t } = useTranslation();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [roles, setRoles] = useState<RoleData[]>([]);
  const [joinedAt, setJoinedAt] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open || !userId) return;
    const fetchData = async () => {
      const { data: prof } = await supabase
        .from('profiles')
        .select('display_name, username, avatar_url, created_at')
        .eq('user_id', userId)
        .maybeSingle();
      if (prof) setProfile(prof);

      if (serverId) {
        const { data: member } = await supabase
          .from('server_members')
          .select('joined_at')
          .eq('server_id', serverId)
          .eq('user_id', userId)
          .maybeSingle();
        if (member) setJoinedAt(member.joined_at);

        const { data: memberRoles } = await supabase
          .from('server_member_roles')
          .select('role_id')
          .eq('server_id', serverId)
          .eq('user_id', userId);

        if (memberRoles && memberRoles.length > 0) {
          const roleIds = memberRoles.map(r => r.role_id);
          const { data: serverRoles } = await supabase
            .from('server_roles')
            .select('name, color')
            .in('id', roleIds)
            .order('position', { ascending: false });
          if (serverRoles) setRoles(serverRoles);
        }
      }
    };
    fetchData();
  }, [open, userId, serverId]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent side="right" align="start" className="w-72 p-0 bg-sidebar border-border overflow-hidden">
        {/* Banner */}
        <div className="h-16 bg-gradient-to-r from-primary/60 to-accent/40" />
        
        {/* Avatar */}
        <div className="px-4 -mt-8 relative z-10">
          <div className="w-16 h-16 rounded-full border-4 border-sidebar bg-secondary flex items-center justify-center text-2xl font-bold overflow-hidden">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-foreground">{profile?.display_name?.charAt(0)?.toUpperCase() || '?'}</span>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="px-4 pt-2 pb-4 space-y-3">
          <div>
            <h3 className="text-lg font-bold text-foreground">{profile?.display_name || '...'}</h3>
            <p className="text-sm text-muted-foreground">@{profile?.username || '...'}</p>
          </div>

          <div className="h-px bg-border" />

          {/* Roles */}
          {roles.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">{t('profileCard.roles')}</p>
              <div className="flex flex-wrap gap-1">
                {roles.map((role) => (
                  <span
                    key={role.name}
                    className="text-[11px] px-2 py-0.5 rounded-full font-medium border"
                    style={{ color: role.color, borderColor: role.color + '40', backgroundColor: role.color + '15' }}
                  >
                    {role.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Dates */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">{t('profileCard.memberSince')}</p>
            <div className="space-y-1 text-xs text-muted-foreground">
              {profile?.created_at && (
                <div className="flex items-center gap-2">
                  <span>🗓️</span>
                  <span>{format(new Date(profile.created_at), 'dd MMM yyyy')}</span>
                </div>
              )}
              {joinedAt && (
                <div className="flex items-center gap-2">
                  <span>📥</span>
                  <span>{format(new Date(joinedAt), 'dd MMM yyyy')}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default UserProfileCard;
