import { useState } from 'react';
import { DbServer } from '@/pages/Index';
import CreateServerDialog from './CreateServerDialog';
import JoinServerDialog from './JoinServerDialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTranslation } from '@/i18n';

interface ServerSidebarProps { activeServer: string; onServerChange: (id: string) => void; servers: DbServer[]; onServerCreated: () => void; }

const MAX_SERVERS = 100;

const ServerSidebar = ({ activeServer, onServerChange, servers, onServerCreated }: ServerSidebarProps) => {
  const { t } = useTranslation();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const isAtLimit = servers.length >= MAX_SERVERS;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-w-[72px] max-w-[72px] h-screen bg-server-bg flex flex-col">
        <div className="flex flex-col items-center py-3 gap-2 shrink-0">
          <button className={`server-icon bg-secondary hover:bg-primary hover:text-primary-foreground transition-colors ${activeServer === 'home' ? 'bg-primary text-primary-foreground rounded-[16px]' : ''}`} onClick={() => onServerChange('home')}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
          </button>
          <div className="w-8 h-[2px] bg-border rounded-full" />
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin flex flex-col items-center gap-2 py-1 px-0">
          {servers.map((server) => (
            <Tooltip key={server.id}>
              <TooltipTrigger asChild>
                <button className={`server-icon font-semibold text-lg transition-colors shrink-0 overflow-hidden ${activeServer === server.id ? 'bg-primary text-primary-foreground rounded-[16px]' : 'bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground'}`} onClick={() => onServerChange(server.id)}>
                  {server.icon && (server.icon.startsWith('http') || server.icon.startsWith('/')) ? (<img src={server.icon} alt={server.name} className="w-full h-full object-cover rounded-[inherit]" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />) : (server.icon || server.name.charAt(0).toUpperCase())}
                </button>
              </TooltipTrigger>
              <TooltipContent side="right"><p>{server.name}</p></TooltipContent>
            </Tooltip>
          ))}
        </div>
        <div className="flex flex-col items-center py-3 gap-2 shrink-0">
          <div className="w-8 h-[2px] bg-border rounded-full" />
          <Tooltip>
            <TooltipTrigger asChild>
              <button className={`server-icon text-2xl transition-colors ${isAtLimit ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-50' : 'bg-secondary text-aurora-green hover:bg-aurora-green hover:text-primary-foreground'}`} onClick={() => !isAtLimit && setShowCreateDialog(true)} disabled={isAtLimit}>+</button>
            </TooltipTrigger>
            <TooltipContent side="right"><p>{isAtLimit ? t('server.maxReached', { max: MAX_SERVERS }) : t('server.create')}</p></TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className={`server-icon transition-colors ${isAtLimit ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-50' : 'bg-secondary text-primary hover:bg-primary hover:text-primary-foreground'}`} onClick={() => !isAtLimit && setShowJoinDialog(true)} disabled={isAtLimit}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" /></svg>
              </button>
            </TooltipTrigger>
            <TooltipContent side="right"><p>{isAtLimit ? t('server.maxReached', { max: MAX_SERVERS }) : t('server.join')}</p></TooltipContent>
          </Tooltip>
        </div>
        <CreateServerDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} onServerCreated={onServerCreated} />
        <JoinServerDialog open={showJoinDialog} onOpenChange={setShowJoinDialog} onServerJoined={onServerCreated} />
      </div>
    </TooltipProvider>
  );
};

export default ServerSidebar;
