export interface Message {
  id: string;
  author: string;
  avatar: string;
  content: string;
  timestamp: string;
  isBot?: boolean;
}

export interface Channel {
  id: string;
  name: string;
  type: 'text' | 'voice';
  unread?: number;
}

export interface Server {
  id: string;
  name: string;
  icon: string;
  channels: Channel[];
}

export interface Member {
  id: string;
  name: string;
  avatar: string;
  status: 'online' | 'idle' | 'dnd' | 'offline';
  role?: string;
}

export const mockServers: Server[] = [
  {
    id: '1',
    name: 'AuroraChat',
    icon: 'A',
    channels: [
      { id: 'c1', name: 'genel', type: 'text', unread: 3 },
      { id: 'c2', name: 'sohbet', type: 'text' },
      { id: 'c3', name: 'müzik', type: 'text' },
      { id: 'c4', name: 'oyun', type: 'text' },
      { id: 'c5', name: 'Sesli Sohbet', type: 'voice' },
    ],
  },
  {
    id: '2',
    name: 'Yazılım',
    icon: 'Y',
    channels: [
      { id: 'c6', name: 'javascript', type: 'text' },
      { id: 'c7', name: 'react', type: 'text', unread: 1 },
      { id: 'c8', name: 'genel', type: 'text' },
    ],
  },
  {
    id: '3',
    name: 'Tasarım',
    icon: 'T',
    channels: [
      { id: 'c9', name: 'showcase', type: 'text' },
      { id: 'c10', name: 'feedback', type: 'text' },
    ],
  },
];

export const mockMembers: Member[] = [
  { id: '1', name: 'AuroraBot', avatar: '🤖', status: 'online', role: 'Bot' },
  { id: '2', name: 'Ahmet', avatar: 'A', status: 'online', role: 'Admin' },
  { id: '3', name: 'Elif', avatar: 'E', status: 'idle' },
  { id: '4', name: 'Mehmet', avatar: 'M', status: 'dnd' },
  { id: '5', name: 'Zeynep', avatar: 'Z', status: 'offline' },
  { id: '6', name: 'Can', avatar: 'C', status: 'online' },
];

export const mockMessages: Message[] = [
  { id: '1', author: 'AuroraBot', avatar: '🤖', content: 'AuroraChat\'a hoş geldiniz! 🌌', timestamp: '14:30', isBot: true },
  { id: '2', author: 'Ahmet', avatar: 'A', content: 'Herkese merhaba!', timestamp: '14:32' },
  { id: '3', author: 'Elif', avatar: 'E', content: 'Selam! Nasılsınız?', timestamp: '14:33' },
];
