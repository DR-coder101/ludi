import { io, type Socket } from 'socket.io-client';
import { LiveFrameSchema } from '@ludi/protocol';
import type { LiveEvent, LiveGameState } from '@ludi/live-game';

export type FrameHandler = (snapshot: LiveGameState, events: LiveEvent[]) => void;

export function connectLive(url: string, onFrame: FrameHandler): () => void {
  const socket: Socket = io(url, { transports: ['websocket', 'polling'] });
  socket.on('live', (raw: unknown) => {
    const parsed = LiveFrameSchema.safeParse(raw);
    if (!parsed.success) return;
    onFrame(parsed.data.snapshot as LiveGameState, parsed.data.events as LiveEvent[]);
  });
  return () => {
    socket.close();
  };
}
