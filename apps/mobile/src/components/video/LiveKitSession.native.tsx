import { useState } from 'react';
import { LiveKitRoom, useParticipants } from '@livekit/react-native';
import type { CallParticipant } from './seatVideo';
import type { LiveKitSessionProps } from './liveKitHost';
import { createLiveKitRoomBind } from './liveKitRoomBind';

export function LiveKitSession({
  token,
  url,
  audio = true,
  video = true,
  facingUser = true,
  onConnected,
  onDisconnected,
  onError,
  children,
}: LiveKitSessionProps) {
  const [bind] = useState(createLiveKitRoomBind);
  if (!token || !url) return <>{children}</>;
  const room = bind({
    token,
    url,
    audio,
    video,
    facingUser,
    onConnected,
    onDisconnected,
    onError,
  });
  return (
    <LiveKitRoom
      serverUrl={room.serverUrl}
      token={room.token}
      connect={room.connect}
      audio={room.audio}
      video={room.video}
      onConnected={room.onConnected}
      onDisconnected={room.onDisconnected}
      onError={room.onError}
    >
      {children}
    </LiveKitRoom>
  );
}

export function useCallParticipants(): Record<string, CallParticipant> {
  const participants = useParticipants();
  const out: Record<string, CallParticipant> = {};
  for (const participant of participants) {
    out[participant.identity] = {
      cameraOn: participant.isCameraEnabled,
      micOn: participant.isMicrophoneEnabled,
      speaking: participant.isSpeaking,
    };
  }
  return out;
}
