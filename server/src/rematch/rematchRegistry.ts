import type { RematchStatePayload, RematchStatus } from '@ludi/protocol';

export const DEFAULT_REMATCH_TIMEOUT_MS = 30_000;

export type RematchSession = {
  roomCode: string;
  requiredPlayerIds: string[];
  accepted: Set<string>;
  deadlineTs: number;
  status: RematchStatus;
};

export type RematchRegistry = {
  offer(
    roomCode: string,
    requiredPlayerIds: string[],
    timeoutMs: number,
    onExpired: (payload: RematchStatePayload) => void,
  ): { success: boolean; error?: string; session?: RematchSession };
  respond(
    roomCode: string,
    playerId: string,
    accept: boolean,
  ): { success: boolean; error?: string; session?: RematchSession };
  get(roomCode: string): RematchSession | undefined;
  clear(roomCode: string): void;
  snapshot(session: RematchSession): RematchStatePayload;
  close(): void;
};

export function createRematchRegistry(now: () => number = Date.now): RematchRegistry {
  const sessions = new Map<string, RematchSession>();
  const timers = new Map<string, NodeJS.Timeout>();

  function snapshot(session: RematchSession): RematchStatePayload {
    return {
      roomCode: session.roomCode,
      status: session.status,
      acceptedPlayerIds: [...session.accepted],
      requiredPlayerIds: session.requiredPlayerIds,
      deadlineTs: session.deadlineTs,
    };
  }

  function clearTimer(roomCode: string): void {
    const timer = timers.get(roomCode);
    if (timer) {
      clearTimeout(timer);
      timers.delete(roomCode);
    }
  }

  function allAccepted(session: RematchSession): boolean {
    return session.requiredPlayerIds.every((id) => session.accepted.has(id));
  }

  return {
    offer(roomCode, requiredPlayerIds, timeoutMs, onExpired) {
      const existing = sessions.get(roomCode);
      if (existing && existing.status === 'pending') {
        return { success: false, error: 'Rematch already pending' };
      }
      if (requiredPlayerIds.length === 0) {
        return { success: false, error: 'No players to rematch' };
      }

      clearTimer(roomCode);
      const session: RematchSession = {
        roomCode,
        requiredPlayerIds: [...requiredPlayerIds],
        accepted: new Set(),
        deadlineTs: now() + timeoutMs,
        status: 'pending',
      };
      sessions.set(roomCode, session);

      const timer = setTimeout(() => {
        const current = sessions.get(roomCode);
        if (!current || current.status !== 'pending') {
          return;
        }
        current.status = 'expired';
        timers.delete(roomCode);
        onExpired(snapshot(current));
      }, timeoutMs);
      timers.set(roomCode, timer);

      return { success: true, session };
    },

    respond(roomCode, playerId, accept) {
      const session = sessions.get(roomCode);
      if (!session) {
        return { success: false, error: 'No rematch pending' };
      }
      if (session.status !== 'pending') {
        return { success: false, error: `Rematch already ${session.status}` };
      }
      if (!session.requiredPlayerIds.includes(playerId)) {
        return { success: false, error: 'Player is not in this rematch' };
      }

      if (!accept) {
        session.status = 'declined';
        clearTimer(roomCode);
        return { success: true, session };
      }

      session.accepted.add(playerId);
      if (allAccepted(session)) {
        session.status = 'accepted';
        clearTimer(roomCode);
      }
      return { success: true, session };
    },

    get(roomCode) {
      return sessions.get(roomCode);
    },

    clear(roomCode) {
      clearTimer(roomCode);
      sessions.delete(roomCode);
    },

    snapshot,

    close() {
      for (const roomCode of timers.keys()) {
        clearTimer(roomCode);
      }
      sessions.clear();
    },
  };
}
