import { describe, expect, it } from 'vitest';
import {
  createPlaySessionFlag,
  decidePlayEvent,
  type PlayEvent,
} from './playNavigation';

const LOCAL_NOISE: PlayEvent[] = [
  'missing-socket',
  'game-state',
  'socket-connect',
  'socket-reconnect',
  'app-background',
  'app-active',
];

describe('decidePlayEvent', () => {
  it('keeps a local board up across socket reconnect and AppState resume', () => {
    for (const event of LOCAL_NOISE) {
      expect(decidePlayEvent('local', event), event).toEqual({ type: 'stay' });
    }
  });

  it('does not send a local game home when the lobby socket is missing', () => {
    expect(decidePlayEvent('local', 'missing-socket')).toEqual({ type: 'stay' });
  });

  it('surfaces a missing online socket instead of resetting to home', () => {
    expect(decidePlayEvent('online', 'missing-socket')).toEqual({
      type: 'error',
      message: 'Lost the room connection. Go back to start a new game.',
    });
    expect(decidePlayEvent('none', 'missing-socket').type).toBe('error');
  });

  it('opens the online game only when an online lobby receives game:state', () => {
    expect(decidePlayEvent('online', 'game-state')).toEqual({ type: 'open-online-game' });
    expect(decidePlayEvent('none', 'game-state')).toEqual({ type: 'stay' });
  });
});

describe('playSessionFlag', () => {
  it('treats reconnect as local once the pass-and-play screen is up', () => {
    const flag = createPlaySessionFlag();
    flag.setLocal(true);
    expect(decidePlayEvent(flag.session(), 'socket-reconnect')).toEqual({ type: 'stay' });
    expect(decidePlayEvent(flag.session(), 'app-active')).toEqual({ type: 'stay' });
    flag.setLocal(false);
    expect(decidePlayEvent(flag.session(), 'game-state')).toEqual({ type: 'open-online-game' });
  });
});
