import { describe, it, expect } from 'vitest';
import type { HouseRules } from '@ludi/protocol';
import { RoomRegistry } from './RoomRegistry.js';
import { publicRoom } from './publicRoom.js';

const HOUSE_RULES: HouseRules = {
  maxConsecutiveSixes: 2,
  extraRollOnCapture: false,
  blockadeCanMoveTogether: false,
  exactFinishBonus: false,
  playForPlacements: true,
};

describe('publicRoom', () => {
  it('omits sessionToken from a copy and leaves the stored player token in place', () => {
    const registry = new RoomRegistry();
    const hostToken = registry.generateSessionToken();
    const { roomCode, playerId } = registry.createRoom('Host', HOUSE_RULES, hostToken);
    const guestToken = registry.generateSessionToken();
    const joined = registry.joinRoom(roomCode, 'Guest', guestToken);
    expect(joined.success).toBe(true);

    const stored = registry.getRoom(roomCode)!;
    const published = publicRoom(stored);

    expect(JSON.stringify(published)).not.toContain(hostToken);
    expect(JSON.stringify(published)).not.toContain(guestToken);
    for (const player of published.players) {
      expect(player).not.toHaveProperty('sessionToken');
    }

    expect(stored.players[0].sessionToken).toBe(hostToken);
    expect(stored.players[1].sessionToken).toBe(guestToken);
    expect(registry.getPlayerBySessionToken(hostToken)?.player.id).toBe(playerId);
    expect(registry.getPlayerBySessionToken(guestToken)?.player.id).toBe(joined.playerId);
  });
});
