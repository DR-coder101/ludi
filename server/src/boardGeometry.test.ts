import { describe, it, expect } from 'vitest';
import {
  BOARD_TRACK_SIZE,
  BOARD_HOME_COLUMN_LENGTH,
  GameStateSchema,
  LegalMoveSchema,
  TokenPosSchema,
} from '@ludi/protocol';
import {
  TRACK_SIZE,
  HOME_COLUMN_LENGTH,
  START_CELLS,
  HOME_COLUMN_ENTRY,
  type GameConfig,
} from '@ludi/rules';
import { GameManagerRegistry } from './GameManager.js';

const config: GameConfig = {
  playerColors: ['red', 'green', 'yellow', 'blue'],
  houseRules: {
    maxConsecutiveSixes: 2,
    extraRollOnCapture: false,
    blockadeCanMoveTogether: false,
    exactFinishBonus: false,
    playForPlacements: false,
  },
};

describe('Board geometry contract (68 track / 7 home)', () => {
  it('protocol bounds match the rules engine', () => {
    expect(BOARD_TRACK_SIZE).toBe(TRACK_SIZE);
    expect(BOARD_TRACK_SIZE).toBe(68);
    expect(BOARD_HOME_COLUMN_LENGTH).toBe(HOME_COLUMN_LENGTH);
    expect(BOARD_HOME_COLUMN_LENGTH).toBe(7);
    expect(START_CELLS).toEqual({ red: 0, green: 17, yellow: 34, blue: 51 });
    expect(HOME_COLUMN_ENTRY).toEqual({ red: 66, green: 15, yellow: 32, blue: 49 });
  });

  it('TokenPosSchema accepts exactly track 0..67 and homeColumn 1..7', () => {
    for (let cell = 0; cell < 68; cell++) {
      expect(TokenPosSchema.safeParse({ zone: 'track', cell }).success).toBe(true);
    }
    for (let step = 1; step <= 7; step++) {
      expect(TokenPosSchema.safeParse({ zone: 'homeColumn', step }).success).toBe(true);
    }

    for (const cell of [-1, 68, 1.5]) {
      expect(TokenPosSchema.safeParse({ zone: 'track', cell }).success).toBe(false);
    }
    for (const step of [0, 8, 2.5]) {
      expect(TokenPosSchema.safeParse({ zone: 'homeColumn', step }).success).toBe(false);
    }
  });

  it('every server game state and legal move through a full game validates against the protocol', () => {
    const registry = new GameManagerRegistry({ gracePeriodMs: 1000, aiThinkDelayMs: 0 });
    const roomCode = 'GEO068';
    registry.createGame(roomCode, config);

    let pick = 0;
    let maxHomeStep = 0;
    for (let i = 0; i < 50000; i++) {
      const game = registry.getGame(roomCode)!;
      expect(GameStateSchema.safeParse(game.state).success).toBe(true);
      if (game.state.phase === 'finished') break;

      if (game.state.phase === 'awaiting_roll') {
        expect(registry.rollDice(roomCode).success).toBe(true);
        continue;
      }

      const moves = registry.getLegalMoves(roomCode);
      for (const move of moves) {
        expect(LegalMoveSchema.safeParse(move).success).toBe(true);
        if (move.resulting.zone === 'homeColumn') {
          maxHomeStep = Math.max(maxHomeStep, move.resulting.step);
        }
      }
      const result = registry.applyMove(roomCode, moves[pick++ % moves.length].tokenIndex);
      expect(result.success).toBe(true);
    }

    const final = registry.getGame(roomCode)!.state;
    expect(final.phase).toBe('finished');
    expect(final.winner).not.toBeNull();
    expect(maxHomeStep).toBeGreaterThan(0);
    expect(maxHomeStep).toBeLessThanOrEqual(7);
    registry.deleteGame(roomCode);
  });
});
