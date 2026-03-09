import { useState, useEffect, useRef } from 'react';
import { DbMember } from '@/pages/Index';
import { Bell } from 'lucide-react';

interface MentionPopupProps {
  query: string;
  members: DbMember[];
  onSelect: (username: string) => void;
  onClose: () => void;
  position: { bottom: number; left: number };
}

const MentionPopup = ({ query, members, onSelect, onClose, position }: MentionPopupProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const showEveryone = 'everyone'.includes(query.toLowerCase()) || query === '';
  const showHere = 'here'.includes(query.toLowerCase()) || query === '';

  const filtered = [
    ...(showEveryone ? [{ id: '__everyone__', name: 'everyone', avatar: '', avatarUrl: null, status: 'online' as const }] : []),
    ...(showHere ? [{ id: '__here__', name: 'here', avatar: '', avatarUrl: null, status: 'online' as const }] : []),
    ...members.filter((m) =>
      m.name.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 7),
  ];

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, filtered.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          onSelect(filtered[selectedIndex].name);
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [filtered, selectedIndex, onSelect, onClose]);

  if (filtered.length === 0) return null;

  return (
    <div
      ref={ref}
      className="absolute z-50 w-64 max-h-48 overflow-y-auto bg-popover border border-border rounded-lg shadow-xl p-1"
      style={{ bottom: position.bottom, left: position.left }}
    >
      {filtered.map((m, i) => (
        <button
          key={m.id}
          onClick={() => onSelect(m.name)}
          className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm transition-colors ${
            i === selectedIndex ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:bg-secondary/50'
          }`}
        >
          <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-[10px] font-medium overflow-hidden shrink-0">
            {m.id === '__everyone__' ? (
              <Bell className="w-3.5 h-3.5 text-amber-400" />
            ) : m.avatarUrl ? (
              <img src={m.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              m.avatar
            )}
          </div>
          <span className="truncate">{m.id === '__everyone__' ? '@everyone' : m.name}</span>
        </button>
      ))}
    </div>
  );
};

export default MentionPopup;
