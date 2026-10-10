import { describe, expect, it } from 'vitest';
import { seatVideoAppearance, seatsFromCall, tileLabel, type SeatVideoFacts } from './seatVideo';

const seated: SeatVideoFacts = {
  seated: true,
  substitute: false,
  participant: true,
  cameraOn: true,
  micOn: true,
  speaking: false,
  local: false,
  displayName: 'Marcus',
};

describe('seatVideoAppearance', () => {
  it('maps a speaking participant to a live speaking tile', () => {
    expect(seatVideoAppearance({ ...seated, speaking: true })).toEqual({
      kind: 'live',
      name: 'Marcus',
      you: false,
      muted: false,
      speaking: true,
    });
  });

  it('maps a muted live camera to a muted live tile', () => {
    expect(seatVideoAppearance({ ...seated, displayName: 'Shanice', micOn: false })).toEqual({
      kind: 'live',
      name: 'Shanice',
      you: false,
      muted: true,
      speaking: false,
    });
  });

  it('maps camera off to a CAM OFF tile with the initial letter', () => {
    expect(
      seatVideoAppearance({
        ...seated,
        displayName: 'Andre',
        cameraOn: false,
        micOn: false,
      }),
    ).toEqual({
      kind: 'camOff',
      name: 'Andre',
      you: false,
      muted: true,
      speaking: false,
      initial: 'A',
    });
  });

  it('marks the local player You', () => {
    expect(seatVideoAppearance({ ...seated, displayName: 'Dean', local: true })).toEqual({
      kind: 'live',
      name: 'Dean',
      you: true,
      muted: false,
      speaking: false,
    });
  });

  it('keeps the existing yard look when there is no video', () => {
    expect(seatVideoAppearance({ ...seated, seated: false })).toEqual({ kind: 'none' });
    expect(seatVideoAppearance({ ...seated, substitute: true, displayName: 'Bot' })).toEqual({
      kind: 'none',
    });
    expect(seatVideoAppearance({ ...seated, participant: false })).toEqual({ kind: 'none' });
  });
});

describe('seatsFromCall', () => {
  const players = [
    { id: 'p1', color: 'red' as const, displayName: 'Dean' },
    { id: 'bot', color: 'blue' as const, displayName: 'Andre', status: 'ai-substitute' as const },
  ];

  it('returns no overlays when the call is down', () => {
    expect(
      seatsFromCall({
        players,
        myPlayerId: 'p1',
        inCall: false,
        participants: {},
        local: { cameraOn: true, micOn: true, speaking: false },
      }),
    ).toEqual({});
  });

  it('keeps a bot seat on the existing yard look', () => {
    const seats = seatsFromCall({
      players,
      myPlayerId: 'p1',
      inCall: true,
      participants: {},
      local: { cameraOn: true, micOn: true, speaking: false },
    });
    expect(seats.red).toEqual({
      kind: 'live',
      name: 'Dean',
      you: true,
      muted: false,
      speaking: false,
      identity: 'p1',
    });
    expect(seats.blue).toEqual({ kind: 'none' });
  });
});

describe('tileLabel', () => {
  it('marks the local seat as Name · You', () => {
    expect(
      tileLabel({ kind: 'live', name: 'Dean', you: true, muted: false, speaking: false }),
    ).toBe('Dean · You');
    expect(
      tileLabel({ kind: 'live', name: 'Marcus', you: false, muted: false, speaking: true }),
    ).toBe('Marcus');
    expect(tileLabel({ kind: 'none' })).toBe('');
  });
});
