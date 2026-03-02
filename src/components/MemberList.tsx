import { DbMember } from '@/pages/Index';
import { ArrowLeft } from 'lucide-react';

interface MemberListProps {
  members: DbMember[];
  isMobile?: boolean;
  onBack?: () => void;
}

const statusColor: Record<string, string> = {
  online: 'bg-status-online',
  idle: 'bg-status-idle',
  dnd: 'bg-status-dnd',
  offline: 'bg-muted-foreground',
};

const MemberList = ({ members, isMobile, onBack }: MemberListProps) => {
  const online = members.filter((m) => m.status !== 'offline');
  const offline = members.filter((m) => m.status === 'offline');

  const renderMember = (member: DbMember) => (
    <div
      key={member.id}
      className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-secondary/50 cursor-pointer transition-colors"
    >
      <div className="relative">
        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-sm overflow-hidden">
          {member.avatarUrl ? (
            <img src={member.avatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            member.avatar
          )}
        </div>
        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-sidebar ${statusColor[member.status]}`} />
      </div>
      <div className="min-w-0">
        <p className={`text-sm truncate ${member.role === 'Bot' ? 'text-primary' : member.role === 'Admin' ? 'text-aurora-purple' : 'text-muted-foreground'}`}>
          {member.name}
        </p>
      </div>
      {member.role && (
        <span className="ml-auto text-[9px] bg-secondary text-muted-foreground px-1.5 py-0.5 rounded uppercase font-bold">
          {member.role}
        </span>
      )}
    </div>
  );

  return (
    <div className={`${isMobile ? 'flex-1 h-full' : 'w-60'} bg-sidebar border-l border-border overflow-y-auto scrollbar-thin py-4 px-2 flex flex-col`}>
      {isMobile && onBack && (
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3 px-2">
          <ArrowLeft className="w-4 h-4" /> Geri
        </button>
      )}
      {online.length > 0 && (
        <>
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-2 mb-2">
            Çevrimiçi — {online.length}
          </p>
          {online.map(renderMember)}
        </>
      )}
      {offline.length > 0 && (
        <>
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-2 mt-4 mb-2">
            Çevrimdışı — {offline.length}
          </p>
          {offline.map(renderMember)}
        </>
      )}
    </div>
  );
};

export default MemberList;
