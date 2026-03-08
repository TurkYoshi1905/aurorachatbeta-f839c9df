import { useState, useRef, useCallback, useEffect } from 'react';
import { Room, RoomEvent, Track, RemoteParticipant, LocalParticipant, ConnectionState } from 'livekit-client';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface VoiceParticipant {
  identity: string;
  displayName: string;
  avatarUrl?: string | null;
  isSpeaking: boolean;
}

export const useVoiceChannel = () => {
  const { user, profile } = useAuth();
  const [room, setRoom] = useState<Room | null>(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [voiceChannelId, setVoiceChannelId] = useState<string | null>(null);
  const [voiceChannelName, setVoiceChannelName] = useState<string>('');
  const [participants, setParticipants] = useState<VoiceParticipant[]>([]);
  const [micMuted, setMicMuted] = useState(false);
  const [deafened, setDeafened] = useState(false);
  const roomRef = useRef<Room | null>(null);

  const updateParticipants = useCallback((r: Room) => {
    const parts: VoiceParticipant[] = [];
    const allParticipants = [r.localParticipant, ...Array.from(r.remoteParticipants.values())];
    for (const p of allParticipants) {
      parts.push({
        identity: p.identity,
        displayName: p.name || p.identity,
        avatarUrl: null,
        isSpeaking: p.isSpeaking,
      });
    }
    setParticipants(parts);
  }, []);

  const connect = useCallback(async (channelId: string, channelName: string) => {
    if (!user || !profile || connecting) return;
    // Disconnect existing connection before joining new one
    if (roomRef.current) {
      roomRef.current.disconnect();
      roomRef.current = null;
    }
    setConnecting(true);

    try {
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

      if (!resp.ok) throw new Error('Failed to get token');
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
      });

      await newRoom.connect(url, livekitToken);
      await newRoom.localParticipant.setMicrophoneEnabled(true);

      setRoom(newRoom);
      setConnected(true);
      setVoiceChannelId(channelId);
      setVoiceChannelName(channelName);
      setMicMuted(false);
      setDeafened(false);
      updateParticipants(newRoom);
    } catch (err) {
      console.error('Voice connection failed:', err);
    } finally {
      setConnecting(false);
    }
  }, [user, profile, connecting, updateParticipants]);

  const disconnect = useCallback(() => {
    if (roomRef.current) {
      roomRef.current.disconnect();
      roomRef.current = null;
    }
    setRoom(null);
    setConnected(false);
    setVoiceChannelId(null);
    setVoiceChannelName('');
    setParticipants([]);
  }, []);

  const toggleMic = useCallback(async () => {
    if (!roomRef.current) return;
    const newMuted = !micMuted;
    await roomRef.current.localParticipant.setMicrophoneEnabled(!newMuted);
    setMicMuted(newMuted);
  }, [micMuted]);

  const toggleDeafen = useCallback(async () => {
    if (!roomRef.current) return;
    const newDeafened = !deafened;
    if (newDeafened) {
      await roomRef.current.localParticipant.setMicrophoneEnabled(false);
      setMicMuted(true);
      // Mute all remote audio by detaching elements
      roomRef.current.remoteParticipants.forEach((p) => {
        p.audioTrackPublications.forEach((pub) => {
          if (pub.audioTrack) {
            pub.audioTrack.detach();
          }
        });
      });
    } else {
      // Re-attach audio tracks
      roomRef.current.remoteParticipants.forEach((p) => {
        p.audioTrackPublications.forEach((pub) => {
          if (pub.audioTrack) {
            const el = pub.audioTrack.attach();
            document.body.appendChild(el);
          }
        });
      });
    }
    setDeafened(newDeafened);
  }, [deafened]);

  // Cleanup on unmount
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
