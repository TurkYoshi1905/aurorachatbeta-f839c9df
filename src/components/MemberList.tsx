import { DbMember } from '@/pages/Index';
import { ArrowLeft, Moon, Crown } from 'lucide-react';
import { useTranslation } from '@/i18n';
import UserProfileCard from './UserProfileCard';

interface MemberListProps { members: DbMember[]; isMobile?: boolean; onBack?: () => void; serverId?: string; premiumUsers?: Set<string>; }

const statusColor: Record<string, string> = { online: 'bg-status-online', idle: 'bg-status-idle', dnd: 'bg-status-dnd', offline: 'bg-muted-foreground' };

const MemberList = ({ members, isMobile, onBack, serverId }: MemberListProps) => {
  const { t } = useTranslation();

  const roleGroups: { roleName: string; roleColor: string; position: number; members: DbMember[] }[] = [];
  const noRoleMembers: DbMember[] = [];

  members.forEach(member => {
    if (member.role && member.role !== 'Member' && member.roleColor) {
      const existing = roleGroups.find(g => g.roleName === member.role);
      if (existing) {
        existing.members.push(member);
      } else {
        roleGroups.push({ roleName: member.role!, roleColor: member.roleColor!, position: member.rolePosition || 0, members: [member] });
      }
    } else {
      noRoleMembers.push(member);
    }
  });

  roleGroups.sort((a, b) => b.position - a.position);

  const online = members.filter((m) => m.status !== 'offline');
  const offline = members.filter((m) => m.status === 'offline');
  const hasRoles = roleGroups.length > 0;

  const renderMember = (member: DbMember) => (
    <UserProfileCard key={member.id} userId={member.id} serverId={serverId} status={member.status}>
      <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-secondary/50 cursor-pointer transition-colors">
        <div className="relative">
          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-sm overflow-hidden">
            {member.avatarUrl ? (<img src={member.avatarUrl} alt="" className="w-full h-full object-cover" />) : (member.avatar)}
          </div>
          {member.status === 'idle' ? (
            <div className="absolute -bottom-1 -right-1 w-4 h-4 flex items-center justify-center">
              <Moon className="w-3.5 h-3.5 text-status-idle fill-status-idle" />
            </div>
          ) : (
            <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-sidebar ${statusColor[member.status]}`} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm truncate font-medium" style={member.roleColor ? { color: member.roleColor } : undefined}>
            {!member.roleColor && (
              <span className={member.role === 'Bot' ? 'text-primary' : member.role === 'Admin' ? 'text-aurora-purple' : 'text-muted-foreground'}>
                {member.name}
              </span>
            )}
            {member.roleColor && member.name}
          </p>
        </div>
        {member.role && (
          <span className="ml-auto text-[9px] bg-secondary text-muted-foreground px-1.5 py-0.5 rounded uppercase font-bold" style={member.roleColor ? { color: member.roleColor, borderColor: member.roleColor + '40', borderWidth: 1 } : undefined}>
            {member.role}
          </span>
        )}
      </div>
    </UserProfileCard>
  );

  if (hasRoles) {
    const onlineNoRole = noRoleMembers.filter(m => m.status !== 'offline');
    const offlineAll = members.filter(m => m.status === 'offline');

    return (
      <div className={`${isMobile ? 'flex-1 h-full' : 'w-60'} bg-sidebar border-l border-border overflow-y-auto scrollbar-thin py-4 px-2 flex flex-col`}>
        {isMobile && onBack && (<button onClick={onBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3 px-2"><ArrowLeft className="w-4 h-4" /> {t('members.back')}</button>)}
        {roleGroups.map(group => {
          const groupOnline = group.members.filter(m => m.status !== 'offline');
          if (groupOnline.length === 0) return null;
          return (
            <div key={group.roleName} className="mb-2">
              <p className="text-[11px] font-bold uppercase tracking-wider px-2 mb-2" style={{ color: group.roleColor }}>{group.roleName} — {groupOnline.length}</p>
              {groupOnline.map(renderMember)}
            </div>
          );
        })}
        {onlineNoRole.length > 0 && (
          <>
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-2 mb-2">{t('members.online')} — {onlineNoRole.length}</p>
            {onlineNoRole.map(renderMember)}
          </>
        )}
        {offlineAll.length > 0 && (
          <>
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-2 mt-4 mb-2">{t('members.offline')} — {offlineAll.length}</p>
            {offlineAll.map(renderMember)}
          </>
        )}
      </div>
    );
  }

  return (
    <div className={`${isMobile ? 'flex-1 h-full' : 'w-60'} bg-sidebar border-l border-border overflow-y-auto scrollbar-thin py-4 px-2 flex flex-col`}>
      {isMobile && onBack && (<button onClick={onBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3 px-2"><ArrowLeft className="w-4 h-4" /> {t('members.back')}</button>)}
      {online.length > 0 && (<><p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-2 mb-2">{t('members.online')} — {online.length}</p>{online.map(renderMember)}</>)}
      {offline.length > 0 && (<><p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-2 mt-4 mb-2">{t('members.offline')} — {offline.length}</p>{offline.map(renderMember)}</>)}
    </div>
  );
};

export default MemberList;
