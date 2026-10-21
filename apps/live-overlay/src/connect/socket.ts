import { io, type Socket } from 'socket.io-client';
import { LiveFrameSchema } from '@ludi/protocol';
import type { LiveEvent, LiveGameState } from '@ludi/live-game';

export type PauseInfo = { paused: boolean; reason: 'manual' | 'tiktok' | null; turnLeftMs: number | null };
export type FrameHandler = (snapshot: LiveGameState, events: LiveEvent[], pause: PauseInfo) => void;

export function connectLive(url: string, onFrame: FrameHandler): () => void {
  const socket: Socket = io(url, { transports: ['websocket', 'polling'] });
  socket.on('live', (raw: unknown) => {
    const parsed = LiveFrameSchema.safeParse(raw);
    if (!parsed.success) return;
    const p = (raw as { pause?: PauseInfo }).pause;
    const snap = parsed.data.snapshot as LiveGameState;
    onFrame(snap, parsed.data.events as LiveEvent[], p ?? { paused: snap.paused, reason: snap.paused ? 'manual' : null, turnLeftMs: null });
  });
  return () => {
    socket.close();
  };
}
