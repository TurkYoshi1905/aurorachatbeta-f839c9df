import { useState } from 'react';
import { DbServer } from '@/pages/Index';
import CreateServerDialog from './CreateServerDialog';

interface ServerSidebarProps {
  activeServer: string;
  onServerChange: (id: string) => void;
  servers: DbServer[];
  onServerCreated: () => void;
}

const ServerSidebar = ({ activeServer, onServerChange, servers, onServerCreated }: ServerSidebarProps) => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  return (
    <div className="w-[72px] bg-server-bg flex flex-col items-center py-3 gap-2 overflow-y-auto scrollbar-thin">
      <button
        className={`server-icon bg-secondary hover:bg-primary hover:text-primary-foreground transition-colors ${
          activeServer === 'home' ? 'bg-primary text-primary-foreground rounded-[16px]' : ''
        }`}
        onClick={() => onServerChange('home')}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </button>

      <div className="w-8 h-[2px] bg-border rounded-full" />

      {servers.map((server) => (
        <button
          key={server.id}
          className={`server-icon font-semibold text-lg transition-colors ${
            activeServer === server.id
              ? 'bg-primary text-primary-foreground rounded-[16px]'
              : 'bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground'
          }`}
          onClick={() => onServerChange(server.id)}
          title={server.name}
        >
          {server.icon}
        </button>
      ))}

      <button
        className="server-icon bg-secondary text-aurora-green hover:bg-aurora-green hover:text-primary-foreground text-2xl transition-colors"
        onClick={() => setShowCreateDialog(true)}
      >
        +
      </button>

      <CreateServerDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onServerCreated={onServerCreated}
      />
    </div>
  );
};

export default ServerSidebar;
