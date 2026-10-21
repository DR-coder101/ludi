import type { HouseRules, RoomState } from '@ludi/protocol';
import { DEFAULT_INVITE_HOUSE_RULES } from '../invite/defaults.js';

export type CasualSeat = {
  roomCode: string;
  playerId: string;
  sessionToken: string;
};

export function findOpenPublicLobby(
  rooms: Iterable<RoomState>,
  publicCodes: Set<string>,
): RoomState | undefined {
  for (const room of rooms) {
    if (!publicCodes.has(room.roomCode)) {
      continue;
    }
    if (room.status !== 'lobby') {
      continue;
    }
    if (room.players.length >= 4) {
      continue;
    }
    return room;
  }
  return undefined;
}

export function casualHouseRules(): HouseRules {
  return { ...DEFAULT_INVITE_HOUSE_RULES, blockadeCanMoveTogether: false };
}
