export type PlaySession = 'local' | 'online' | 'none';

export type PlayEvent =
  | 'missing-socket'
  | 'game-state'
  | 'socket-connect'
  | 'socket-reconnect'
  | 'app-background'
  | 'app-active';

export type PlayCommand =
  | { type: 'stay' }
  | { type: 'error'; message: string }
  | { type: 'open-online-game' };

const LOST_ROOM = 'Lost the room connection. Go back to start a new game.';

/**
 * Local pass-and-play owns the screen. Lobby socket, LiveKit, and AppState
 * events must not send the player home or into an online room.
 */
export function decidePlayEvent(session: PlaySession, event: PlayEvent): PlayCommand {
  if (session === 'local') {
    return { type: 'stay' };
  }
  if (event === 'missing-socket') {
    return { type: 'error', message: LOST_ROOM };
  }
  if (session === 'online' && event === 'game-state') {
    return { type: 'open-online-game' };
  }
  return { type: 'stay' };
}

export function createPlaySessionFlag(): {
  setLocal: (on: boolean) => void;
  session: () => PlaySession;
} {
  let local = false;
  return {
    setLocal: (on) => {
      local = on;
    },
    session: () => (local ? 'local' : 'online'),
  };
}

export const playSessionFlag = createPlaySessionFlag();
