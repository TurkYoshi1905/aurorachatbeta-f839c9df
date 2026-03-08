import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface VoiceParticipant {
  identity: string;
  displayName: string;
  avatarUrl?: string | null;
  isSpeaking: boolean;
}

export const useVoiceChannel = () => {
  const { user, profile } = useAuth();
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [voiceChannelId, setVoiceChannelId] = useState<string | null>(null);
  const [voiceChannelName, setVoiceChannelName] = useState<string>('');
  const [participants, setParticipants] = useState<VoiceParticipant[]>([]);
  const [micMuted, setMicMuted] = useState(false);
  const [deafened, setDeafened] = useState(false);
  const roomRef = useRef<any>(null);
  const retryCountRef = useRef(0);
  const MAX_RETRIES = 3;

  const updateParticipants = useCallback((r: any) => {
    try {
      const parts: VoiceParticipant[] = [];
      const allParticipants = [r.localParticipant, ...Array.from(r.remoteParticipants.values())];
      for (const p of allParticipants) {
        parts.push({
          identity: (p as any).identity,
          displayName: (p as any).name || (p as any).identity,
          avatarUrl: null,
          isSpeaking: (p as any).isSpeaking,
        });
      }
      setParticipants(parts);
    } catch (err) {
      console.error('Error updating participants:', err);
    }
  }, []);

  const connect = useCallback(async (channelId: string, channelName: string) => {
    if (!user || !profile || connecting) return;
    if (roomRef.current) {
      roomRef.current.disconnect();
      roomRef.current = null;
    }
    setConnecting(true);
    toast.info(`${channelName} sesli kanalına bağlanılıyor...`);

    try {
      const { Room, RoomEvent } = await import('livekit-client');
      
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;
      if (!token) throw new Error('No session');

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const resp = await fetch(`https://${projectId}.supabase.co/functions/v1/livekit-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ room: channelId, displayName: profile.display_name }),
      });

      if (!resp.ok) {
        const errBody = await resp.text().catch(() => '');
        throw new Error(`Token request failed: ${resp.status} ${errBody}`);
      }
      const { token: livekitToken, url } = await resp.json();

      const newRoom = new Room();
      roomRef.current = newRoom;

      newRoom.on(RoomEvent.ParticipantConnected, () => updateParticipants(newRoom));
      newRoom.on(RoomEvent.ParticipantDisconnected, () => updateParticipants(newRoom));
      newRoom.on(RoomEvent.ActiveSpeakersChanged, () => updateParticipants(newRoom));
      newRoom.on(RoomEvent.Disconnected, () => {
        setConnected(false);
        setVoiceChannelId(null);
        setVoiceChannelName('');
        setParticipants([]);
        roomRef.current = null;
        toast.warning('Sesli kanaldan ayrıldınız.');
      });

      await newRoom.connect(url, livekitToken);
      await newRoom.localParticipant.setMicrophoneEnabled(true);

      setConnected(true);
      setVoiceChannelId(channelId);
      setVoiceChannelName(channelName);
      setMicMuted(false);
      setDeafened(false);
      retryCountRef.current = 0;
      updateParticipants(newRoom);
      toast.success(`${channelName} sesli kanalına bağlandı!`);
    } catch (err) {
      console.error('Voice connection failed:', err);
      toast.error('Sesli kanala bağlanılamadı. Lütfen tekrar deneyin.');
      
      if (retryCountRef.current < MAX_RETRIES) {
        retryCountRef.current++;
        const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 8000);
        setTimeout(() => {
          if (!roomRef.current) {
            connect(channelId, channelName);
          }
        }, delay);
      }
    } finally {
      setConnecting(false);
    }
  }, [user, profile, connecting, updateParticipants]);

  const disconnect = useCallback(() => {
    if (roomRef.current) {
      roomRef.current.disconnect();
      roomRef.current = null;
    }
    setConnected(false);
    setVoiceChannelId(null);
    setVoiceChannelName('');
    setParticipants([]);
  }, []);

  const toggleMic = useCallback(async () => {
    if (!roomRef.current) return;
    const newMuted = !micMuted;
    try {
      await roomRef.current.localParticipant.setMicrophoneEnabled(!newMuted);
      setMicMuted(newMuted);
    } catch (err) {
      console.error('Mic toggle failed:', err);
      toast.error('Mikrofon durumu değiştirilemedi.');
    }
  }, [micMuted]);

  const toggleDeafen = useCallback(async () => {
    if (!roomRef.current) return;
    const newDeafened = !deafened;
    try {
      if (newDeafened) {
        await roomRef.current.localParticipant.setMicrophoneEnabled(false);
        setMicMuted(true);
        roomRef.current.remoteParticipants.forEach((p: any) => {
          p.audioTrackPublications.forEach((pub: any) => {
            if (pub.audioTrack) pub.audioTrack.detach();
          });
        });
      } else {
        roomRef.current.remoteParticipants.forEach((p: any) => {
          p.audioTrackPublications.forEach((pub: any) => {
            if (pub.audioTrack) {
              const el = pub.audioTrack.attach();
              document.body.appendChild(el);
            }
          });
        });
      }
      setDeafened(newDeafened);
    } catch (err) {
      console.error('Deafen toggle failed:', err);
    }
  }, [deafened]);

  useEffect(() => {
    return () => {
      if (roomRef.current) {
        roomRef.current.disconnect();
      }
    };
  }, []);

  return {
    connected,
    connecting,
    voiceChannelId,
    voiceChannelName,
    participants,
    micMuted,
    deafened,
    connect,
    disconnect,
    toggleMic,
    toggleDeafen,
  };
};
