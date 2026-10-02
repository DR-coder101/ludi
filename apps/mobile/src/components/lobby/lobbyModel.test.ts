import { describe, expect, it } from 'vitest';
import type { Player, RoomState } from '@ludi/protocol';
import { lobbySeats, roomNote, SEAT_ORDER, startCta } from './lobbyModel';

const player = (over: Partial<Player> & Pick<Player, 'id' | 'color'>): Player => ({
  displayName: over.id,
  connected: true,
  isHost: false,
  status: 'connected',
  ...over,
});

const room = (players: Player[]): RoomState => ({
  roomCode: 'K7Q2MX',
  players,
  hostId: players.find((p) => p.isHost)?.id ?? '',
  status: 'lobby',
  houseRules: {
    maxConsecutiveSixes: 2,
    extraRollOnCapture: false,
    blockadeCanMoveTogether: false,
    exactFinishBonus: false,
    playForPlacements: false,
  },
});

describe('lobbySeats', () => {
  it('lays seats out TL, TR, BL, BR like the board corners', () => {
    expect(SEAT_ORDER).toEqual(['yellow', 'green', 'blue', 'red']);
  });

  it('places players by colour and leaves the rest open', () => {
    const seats = lobbySeats(
      room([
        player({ id: 'dean', displayName: 'Dean', color: 'red', isHost: true }),
        player({ id: 'shanice', displayName: 'Shanice', color: 'green' }),
      ]),
      'dean',
    );
    expect(seats.map((s) => [s.color, s.name, s.status, s.ready, s.you])).toEqual([
      ['yellow', null, 'Tap to sit', false, false],
      ['green', 'Shanice', 'Ready', true, false],
      ['blue', null, 'Tap to sit', false, false],
      ['red', 'Dean (You)', 'Host · Ready', true, true],
    ]);
  });

  it('shows dropped players as reconnecting or offline', () => {
    const seats = lobbySeats(
      room([
        player({ id: 'a', color: 'red', isHost: true }),
        player({ id: 'b', color: 'green', connected: false, status: 'reconnecting' }),
        player({ id: 'c', color: 'yellow', connected: false, status: 'disconnected' }),
      ]),
      'a',
    );
    expect(seats.find((s) => s.color === 'green')).toMatchObject({ status: 'Reconnecting…', ready: false });
    expect(seats.find((s) => s.color === 'yellow')).toMatchObject({ status: 'Offline', ready: false });
  });
});

describe('roomNote', () => {
  it('counts open seats while connected', () => {
    expect(roomNote(3, true)).toEqual({ text: 'Live · 1 seat open', tone: 'muted' });
    expect(roomNote(1, true).text).toBe('Live · 3 seats open');
    expect(roomNote(4, true).text).toBe('Live · room full');
  });

  it('warns while the socket is down', () => {
    expect(roomNote(3, false)).toEqual({ text: 'Reconnecting…', tone: 'warn' });
  });
});

describe('startCta', () => {
  it('lets the host start with two or more players', () => {
    expect(startCta(3, true)).toEqual({ role: 'host', title: 'START GAME', detail: '· 3 players', enabled: true });
    expect(startCta(1, true)).toMatchObject({ enabled: false, detail: '· need 2 players' });
  });

  it('never lets a guest start', () => {
    expect(startCta(4, false)).toMatchObject({ role: 'guest', title: 'WAITING FOR HOST', enabled: false });
  });
});
