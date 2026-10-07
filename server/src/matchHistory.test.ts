import { describe, it, expect, beforeEach } from 'vitest';
import { createMatchHistoryService } from './services/matchHistory.js';
import { createAuthService } from './services/auth.js';
import { createMockSupabaseClient, createMockStorage } from './db/mock.js';
import { createTtlCache } from './cache/ttlCache.js';
import { isPostgresUuid } from './db/postgresUuid.js';
import type { Color, MatchHistory } from '@ludi/protocol';

const BOT_HEX_ID = 'a'.repeat(32);

const defaultHouseRules = {
  maxConsecutiveSixes: 2,
  extraRollOnCapture: false,
  blockadeCanMoveTogether: false,
  exactFinishBonus: false,
  playForPlacements: true,
};

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

    it('rejects a non-UUID match_players.user_id the way Postgres does', async () => {
      const mockSupabase = createMockSupabaseClient(storage);
      const result = await mockSupabase.from('match_players').insert({
        match_id: crypto.randomUUID(),
        user_id: BOT_HEX_ID,
        color: 'green',
        final_position: 2,
      });
      expect(result.error).toEqual(
        expect.objectContaining({ code: '22P02' }),
      );
      expect(storage.match_players).toHaveLength(0);
    });

    it('saves a vs-bots match without writing non-UUID user ids', async () => {
      const human = await authService.createGuest('Human');

      const matchId = await matchHistoryService.saveMatch({
        roomCode: 'BOTS1',
        startedAt: new Date('2024-01-01T10:00:00Z'),
        endedAt: new Date('2024-01-01T10:30:00Z'),
        winnerId: human.userId,
        houseRules: defaultHouseRules,
        players: [
          { userId: human.userId, color: 'red' as Color, finalPosition: 1 },
          { userId: BOT_HEX_ID, color: 'green' as Color, finalPosition: 2 },
          { userId: 'b'.repeat(32), color: 'yellow' as Color, finalPosition: 3 },
          { userId: 'c'.repeat(32), color: 'blue' as Color, finalPosition: 4 },
        ],
      });

      expect(matchId).toEqual(expect.any(String));
      const matchPlayers = storage.match_players.filter((mp) => mp.match_id === matchId);
      expect(matchPlayers.map((row) => row.user_id)).toEqual([human.userId]);
      expect(matchPlayers.every((row) => isPostgresUuid(row.user_id))).toBe(true);
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

  describe('getUserMatches cache', () => {
    it('serves a repeat read from cache without re-querying storage', async () => {
      const cache = createTtlCache<MatchHistory[]>({ ttlMs: 30_000 });
      const mockSupabase = createMockSupabaseClient(storage);
      const cachedService = createMatchHistoryService(mockSupabase, { cache });
      const localAuth = createAuthService(mockSupabase);

      const player1 = await localAuth.createGuest('Player1');
      const player2 = await localAuth.createGuest('Player2');

      await cachedService.saveMatch({
        roomCode: 'CACHE1',
        startedAt: new Date('2024-01-01T10:00:00Z'),
        endedAt: new Date('2024-01-01T10:30:00Z'),
        winnerId: player1.userId,
        houseRules: defaultHouseRules,
        players: [
          { userId: player1.userId, color: 'red' as Color, finalPosition: 1 },
          { userId: player2.userId, color: 'green' as Color, finalPosition: 2 },
        ],
      });

      const first = await cachedService.getUserMatches(player1.userId);
      expect(first).toHaveLength(1);

      storage.matches.clear();
      storage.match_players.length = 0;

      const second = await cachedService.getUserMatches(player1.userId);
      expect(second).toHaveLength(1);
      expect(second[0].id).toBe(first[0].id);
      expect(cache.get(`match-history:${player1.userId}:50`)).toEqual(first);
    });

    it('does not serve stale data after saveMatch invalidation', async () => {
      const cache = createTtlCache<MatchHistory[]>({ ttlMs: 30_000 });
      const mockSupabase = createMockSupabaseClient(storage);
      const cachedService = createMatchHistoryService(mockSupabase, { cache });
      const localAuth = createAuthService(mockSupabase);

      const player1 = await localAuth.createGuest('Player1');
      const player2 = await localAuth.createGuest('Player2');

      await cachedService.saveMatch({
        roomCode: 'STALE1',
        startedAt: new Date('2024-01-01T10:00:00Z'),
        endedAt: new Date('2024-01-01T10:30:00Z'),
        winnerId: player1.userId,
        houseRules: defaultHouseRules,
        players: [
          { userId: player1.userId, color: 'red' as Color, finalPosition: 1 },
          { userId: player2.userId, color: 'green' as Color, finalPosition: 2 },
        ],
      });

      const first = await cachedService.getUserMatches(player1.userId);
      expect(first).toHaveLength(1);

      await cachedService.saveMatch({
        roomCode: 'STALE2',
        startedAt: new Date('2024-01-02T10:00:00Z'),
        endedAt: new Date('2024-01-02T10:30:00Z'),
        winnerId: player2.userId,
        houseRules: defaultHouseRules,
        players: [
          { userId: player1.userId, color: 'red' as Color, finalPosition: 2 },
          { userId: player2.userId, color: 'green' as Color, finalPosition: 1 },
        ],
      });

      expect(cache.get(`match-history:${player1.userId}:50`)).toBeUndefined();

      const afterSave = await cachedService.getUserMatches(player1.userId);
      expect(afterSave).toHaveLength(2);
      expect(afterSave.map((m) => m.id).sort()).not.toEqual([first[0].id]);
    });

    it('keeps history caches isolated per userId', async () => {
      const cache = createTtlCache<MatchHistory[]>({ ttlMs: 30_000 });
      const mockSupabase = createMockSupabaseClient(storage);
      const cachedService = createMatchHistoryService(mockSupabase, { cache });
      const localAuth = createAuthService(mockSupabase);

      const player1 = await localAuth.createGuest('Player1');
      const player2 = await localAuth.createGuest('Player2');
      const player3 = await localAuth.createGuest('Spectator');

      await cachedService.saveMatch({
        roomCode: 'ISO1',
        startedAt: new Date('2024-01-01T10:00:00Z'),
        endedAt: new Date('2024-01-01T10:30:00Z'),
        winnerId: player1.userId,
        houseRules: defaultHouseRules,
        players: [
          { userId: player1.userId, color: 'red' as Color, finalPosition: 1 },
          { userId: player2.userId, color: 'green' as Color, finalPosition: 2 },
        ],
      });

      const player1Matches = await cachedService.getUserMatches(player1.userId);
      const player3Matches = await cachedService.getUserMatches(player3.userId);

      expect(player1Matches).toHaveLength(1);
      expect(player3Matches).toHaveLength(0);
      expect(cache.get(`match-history:${player1.userId}:50`)).toEqual(player1Matches);
      expect(cache.get(`match-history:${player3.userId}:50`)).toEqual(player3Matches);
    });
  });
});
