import { LiveKitRoom, useParticipants } from '@livekit/react-native';
import type { CallParticipant } from './seatVideo';
import type { LiveKitSessionProps } from './liveKitHost';

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
  if (!token || !url) return <>{children}</>;
  return (
    <LiveKitRoom
      serverUrl={url}
      token={token}
      connect
      audio={audio}
      video={video ? { facingMode: facingUser ? 'user' : 'environment' } : false}
      onConnected={onConnected}
      onDisconnected={onDisconnected}
      onError={onError}
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
