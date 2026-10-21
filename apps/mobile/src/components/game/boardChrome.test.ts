import { describe, expect, it } from 'vitest';
import { boardChrome, leaveBody, speakingSeat } from './boardChrome';
import type { SeatVideo } from '../video/seatVideo';

describe('leaveBody', () => {
  it('names the room when a code exists', () => {
    expect(leaveBody('7X8K9')).toBe("You'll leave room 7X8K9.");
  });

  it('uses local copy when there is no room', () => {
    expect(leaveBody(null)).toBe("You'll leave this game.");
  });
});

describe('boardChrome', () => {
  it('puts Chat only on the normal board when chat exists', () => {
    expect(
      boardChrome({ live: false, roomCode: '7X8K9', chat: true, speaking: null }),
    ).toEqual({
      live: false,
      leaveBody: "You'll leave room 7X8K9.",
      sound: { kind: 'game' },
      dock: ['chat'],
    });
  });

  it('puts Voice, Camera, and Chat on the live board', () => {
    expect(
      boardChrome({
        live: true,
        roomCode: '7X8K9',
        chat: true,
        speaking: { name: 'Dean', tint: '#FF3340' },
      }),
    ).toEqual({
      live: true,
      leaveBody: "You'll leave room 7X8K9.",
      sound: { kind: 'voice', name: 'Dean', tint: '#FF3340' },
      dock: ['voice', 'camera', 'chat'],
    });
  });

  it('falls back to game sound when nobody is speaking', () => {
    expect(boardChrome({ live: true, roomCode: null, chat: false, speaking: null }).sound).toEqual({
      kind: 'game',
    });
  });
});

describe('speakingSeat', () => {
  it('returns the first speaking seated player in turn order', () => {
    const seats: Partial<Record<'red' | 'green', SeatVideo>> = {
      green: { kind: 'live', name: 'Shanice', you: false, muted: false, speaking: false },
      red: { kind: 'live', name: 'Dean', you: true, muted: false, speaking: true },
    };
    expect(speakingSeat(seats, { red: 'Dean' })).toEqual({ name: 'Dean', tint: '#FF3340' });
  });

  it('returns null when no seat is speaking', () => {
    expect(speakingSeat(undefined, {})).toBeNull();
  });
});
