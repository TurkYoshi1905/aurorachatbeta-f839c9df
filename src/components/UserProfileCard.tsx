import { useState, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from '@/i18n';
import { useIsMobile } from '@/hooks/use-mobile';
import { format } from 'date-fns';
import { tr as trLocale, enUS, ru as ruLocale, ja as jaLocale, de as deLocale } from 'date-fns/locale';
import { MessageSquare, Moon, Circle, MinusCircle, EyeOff } from 'lucide-react';
import type { Language } from '@/i18n';

interface UserProfileCardProps {
  userId: string;
  serverId?: string;
  children: React.ReactNode;
  onSendMessage?: (userId: string) => void;
}

interface ProfileData {
  display_name: string;
  username: string;
  avatar_url: string | null;
  created_at: string;
  bio: string;
  banner_color: string;
}

interface RoleData {
  name: string;
  color: string;
}

const dateLocaleMap: Record<string, Locale> = { tr: trLocale, en: enUS, az: trLocale, ru: ruLocale, ja: jaLocale, de: deLocale };

const statusConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  online: { icon: <Circle className="w-3 h-3 text-status-online fill-status-online" />, label: 'Çevrimiçi', color: 'text-status-online' },
  idle: { icon: <Moon className="w-3 h-3 text-status-idle fill-status-idle" />, label: 'Boşta', color: 'text-status-idle' },
  dnd: { icon: <MinusCircle className="w-3 h-3 text-status-dnd fill-status-dnd" />, label: 'Rahatsız Etmeyin', color: 'text-status-dnd' },
  offline: { icon: <EyeOff className="w-3 h-3 text-muted-foreground" />, label: 'Çevrimdışı', color: 'text-muted-foreground' },
};

const UserProfileCard = ({ userId, serverId, children, onSendMessage }: UserProfileCardProps) => {
  const { t, language } = useTranslation();
  const isMobile = useIsMobile();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [roles, setRoles] = useState<RoleData[]>([]);
  const [joinedAt, setJoinedAt] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');
  const [userStatus, setUserStatus] = useState<string>('offline');

  useEffect(() => {
    if (!open || !userId) return;
    const savedNote = localStorage.getItem(`user_note_${userId}`);
    if (savedNote) setNote(savedNote);

    const fetchData = async () => {
      const { data: prof } = await supabase
        .from('profiles')
        .select('display_name, username, avatar_url, created_at, bio, banner_color')
        .eq('user_id', userId)
        .maybeSingle();
      if (prof) setProfile(prof as ProfileData);

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

  const handleNoteChange = (val: string) => {
    setNote(val);
    localStorage.setItem(`user_note_${userId}`, val);
  };

  const profileContent = (
    <>
      {/* Banner */}
      <div className="h-16 rounded-t-lg" style={{ background: profile?.banner_color ? `linear-gradient(135deg, ${profile.banner_color}, ${profile.banner_color}88)` : 'linear-gradient(135deg, hsl(var(--primary) / 0.6), hsl(var(--accent) / 0.4))' }} />
      
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

        {profile?.bio && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">{t('profileCard.aboutMe')}</p>
            <p className="text-xs text-foreground">{profile.bio}</p>
          </div>
        )}

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

        <div className="h-px bg-border" />

        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">{t('profileCard.note')}</p>
          <input
            type="text"
            value={note}
            onChange={e => handleNoteChange(e.target.value)}
            placeholder={t('profileCard.notePlaceholder')}
            className="w-full bg-secondary/50 rounded px-2 py-1.5 text-xs outline-none text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-primary/40"
          />
        </div>

        {onSendMessage && (
          <button
            onClick={() => { onSendMessage(userId); setOpen(false); }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            {t('profileCard.sendMessage')}
          </button>
        )}
      </div>
    </>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          {children}
        </SheetTrigger>
        <SheetContent side="bottom" className="p-0 bg-sidebar border-border overflow-y-auto max-h-[85vh] rounded-t-2xl">
          {profileContent}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent side="right" align="start" className="w-72 p-0 bg-sidebar border-border overflow-hidden">
        {profileContent}
      </PopoverContent>
    </Popover>
  );
};

export default UserProfileCard;
