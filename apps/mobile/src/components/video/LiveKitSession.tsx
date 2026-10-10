import type { CallParticipant } from './seatVideo';
import type { LiveKitSessionProps } from './liveKitHost';

export type { LiveKitSessionProps };

/** Web, Expo Go, and tests have no native WebRTC. Children still render. */
export function LiveKitSession({ children }: LiveKitSessionProps) {
  return <>{children}</>;
}

export function useCallParticipants(): Record<string, CallParticipant> {
  return {};
}
