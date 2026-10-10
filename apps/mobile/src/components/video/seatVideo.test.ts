import { describe, expect, it } from 'vitest';
import { seatVideoAppearance, type SeatVideoFacts } from './seatVideo';

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
