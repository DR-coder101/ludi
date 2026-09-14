import { describe, it, expect, beforeEach } from 'vitest';
import { createMatchHistoryService } from './services/matchHistory.js';
import { createAuthService } from './services/auth.js';
import { createMockSupabaseClient, createMockStorage } from './db/mock.js';
import type { Color } from '@ludi/protocol';

describe('Match History Service', () => {
  let matchHistoryService: ReturnType<typeof createMatchHistoryService>;
  let authService: ReturnType<typeof createAuthService>;
  let storage: ReturnType<typeof createMockStorage>;

  beforeEach(() => {
    storage = createMockStorage();
    const mockSupabase = createMockSupabaseClient(storage);
    matchHistoryService = createMatchHistoryService(mockSupabase);
    authService = createAuthService(mockSupabase);
  });

  describe('saveMatch', () => {
    it('should save a completed match', async () => {
      const player1 = await authService.createGuest('Player1');
      const player2 = await authService.createGuest('Player2');

      const matchId = await matchHistoryService.saveMatch({
        roomCode: 'ABC123',
        startedAt: new Date('2024-01-01T10:00:00Z'),
        endedAt: new Date('2024-01-01T10:30:00Z'),
        winnerId: player1.userId,
        houseRules: {
          maxConsecutiveSixes: 2,
          extraRollOnCapture: false,
          blockadeCanMoveTogether: false,
          exactFinishBonus: false,
          playForPlacements: true,
        },
        players: [
          { userId: player1.userId, color: 'red' as Color, finalPosition: 1 },
          { userId: player2.userId, color: 'green' as Color, finalPosition: 2 },
        ],
      });

      expect(matchId).toBeDefined();

      const match = storage.matches.get(matchId);
      expect(match).toBeDefined();
      expect(match?.winner_id).toBe(player1.userId);

      const matchPlayers = storage.match_players.filter(mp => mp.match_id === matchId);
      expect(matchPlayers).toHaveLength(2);
      expect(matchPlayers[0].user_id).toBe(player1.userId);
      expect(matchPlayers[0].color).toBe('red');
      expect(matchPlayers[0].final_position).toBe(1);
    });
  });

  describe('getUserMatches', () => {
    it('should retrieve matches for a user', async () => {
      const player1 = await authService.createGuest('Player1');
      const player2 = await authService.createGuest('Player2');

      await matchHistoryService.saveMatch({
        roomCode: 'ABC123',
        startedAt: new Date('2024-01-01T10:00:00Z'),
        endedAt: new Date('2024-01-01T10:30:00Z'),
        winnerId: player1.userId,
        houseRules: {
          maxConsecutiveSixes: 2,
          extraRollOnCapture: false,
          blockadeCanMoveTogether: false,
          exactFinishBonus: false,
          playForPlacements: true,
        },
        players: [
          { userId: player1.userId, color: 'red' as Color, finalPosition: 1 },
          { userId: player2.userId, color: 'green' as Color, finalPosition: 2 },
        ],
      });

      const matches = await matchHistoryService.getUserMatches(player1.userId);

      expect(matches).toHaveLength(1);
      expect(matches[0].winnerId).toBe(player1.userId);
      expect(matches[0].players).toHaveLength(2);
      expect(matches[0].players[0].userId).toBe(player1.userId);
      expect(matches[0].players[0].color).toBe('red');
    });

    it('should return empty array if user has no matches', async () => {
      const player = await authService.createGuest('Player');

      const matches = await matchHistoryService.getUserMatches(player.userId);

      expect(matches).toHaveLength(0);
    });

    it('should respect limit parameter', async () => {
      const player1 = await authService.createGuest('Player1');
      const player2 = await authService.createGuest('Player2');

      for (let i = 0; i < 5; i++) {
        await matchHistoryService.saveMatch({
          roomCode: `ROOM${i}`,
          startedAt: new Date(),
          endedAt: new Date(),
          winnerId: player1.userId,
          houseRules: {
            maxConsecutiveSixes: 2,
            extraRollOnCapture: false,
            blockadeCanMoveTogether: false,
            exactFinishBonus: false,
            playForPlacements: true,
          },
          players: [
            { userId: player1.userId, color: 'red' as Color, finalPosition: 1 },
            { userId: player2.userId, color: 'green' as Color, finalPosition: 2 },
          ],
        });
      }

      const matches = await matchHistoryService.getUserMatches(player1.userId, 3);

      expect(matches).toHaveLength(3);
    });
  });
});
