import { Volume2 } from 'lucide-react';

interface VoiceParticipant {
  identity: string;
  displayName: string;
  avatarUrl?: string | null;
  isSpeaking: boolean;
}

interface VoiceParticipantsProps {
  participants: VoiceParticipant[];
}

const VoiceParticipants = ({ participants }: VoiceParticipantsProps) => {
  if (participants.length === 0) return null;

  return (
    <div className="pl-8 space-y-0.5">
      {participants.map((p) => (
        <div key={p.identity} className="flex items-center gap-2 px-2 py-1 rounded text-xs text-muted-foreground">
          <div className={`relative w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium overflow-hidden shrink-0 ${p.isSpeaking ? 'ring-2 ring-status-online' : ''}`}>
            {p.avatarUrl ? (
              <img src={p.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-secondary flex items-center justify-center">
                {p.displayName?.charAt(0)?.toUpperCase() || '?'}
              </div>
            )}
          </div>
          <span className={`truncate ${p.isSpeaking ? 'text-status-online font-medium' : ''}`}>
            {p.displayName}
          </span>
          {p.isSpeaking && <Volume2 className="w-3 h-3 text-status-online shrink-0" />}
        </div>
      ))}
    </div>
  );
};

export default VoiceParticipants;
