import type { Color } from '@ludi/rules';
import type { SeatVideo } from '../video/seatVideo';
import { accent, PLACES, TURN_ORDER } from '../../theme/tokens';

export type SoundMode =
  | { kind: 'game' }
  | { kind: 'voice'; name: string; tint: string };

export type DockKey = 'voice' | 'camera' | 'chat';

export type BoardChrome = {
  live: boolean;
  leaveBody: string;
  sound: SoundMode;
  dock: readonly DockKey[];
};

export function leaveBody(roomCode: string | null): string {
  if (roomCode) return `You'll leave room ${roomCode}.`;
  return "You'll leave this game.";
}

export function speakingSeat(
  seats: Partial<Record<Color, SeatVideo>> | undefined,
  names: Partial<Record<Color, string>>,
): { name: string; tint: string } | null {
  if (!seats) return null;
  for (const color of TURN_ORDER) {
    const seat = seats[color];
    if (!seat || seat.kind === 'none' || !seat.speaking) continue;
    const name = names[color] ?? seat.name;
    return { name, tint: accent[PLACES[color].piece] };
  }
  return null;
}

export function boardChrome(input: {
  live: boolean;
  roomCode: string | null;
  chat: boolean;
  speaking: { name: string; tint: string } | null;
}): BoardChrome {
  const sound: SoundMode =
    input.live && input.speaking
      ? { kind: 'voice', name: input.speaking.name, tint: input.speaking.tint }
      : { kind: 'game' };
  const dock: DockKey[] = [];
  if (input.live) {
    dock.push('voice', 'camera');
  }
  if (input.chat) dock.push('chat');
  return {
    live: input.live,
    leaveBody: leaveBody(input.roomCode),
    sound,
    dock,
  };
}
