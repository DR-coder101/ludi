import { describe, expect, it } from 'vitest';
import { legalMoves, type Color, type TokenPos } from '@ludi/rules';
import { cellForToken, tokenPosForProgress } from '@ludi/board-geometry';
import { buildBoardModel, cellOf } from '../components/board/boardModel';
import { decidePlayEvent, type PlayEvent } from '../nav/playNavigation';
import {
  clearLocalGame,
  createLocalGame,
  loadLocalGame,
  parseLocalGame,
  reduceLocalGame,
  saveLocalGame,
  serializeLocalGame,
  type LocalGame,
} from './localGame';

const COLORS: Color[] = ['red', 'green', 'yellow', 'blue'];

function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function assertRenderable(game: LocalGame, at: string): void {
  for (const token of game.state.tokens) {
    if (token.pos.zone === 'yard') continue;
    const cell = cellOf(token.pos, token.color);
    expect(cell, `${at} ${token.color}#${token.index} ${JSON.stringify(token.pos)}`).toEqual(
      expect.objectContaining({ row: expect.any(Number), col: expect.any(Number) }),
    );
    expect(cellForToken(token.color, token.pos)).toEqual(cell);
  }
  const moves = game.state.phase === 'awaiting_move' ? legalMoves(game.state) : [];
  const model = buildBoardModel(game.state, moves);
  expect(model.turn).toBe(game.state.turn);
}

function playToWinner(colors: Color[], seed: number): LocalGame {
  const random = mulberry32(seed);
  let game = createLocalGame(colors);
  let steps = 0;
  while (game.state.phase !== 'finished') {
    assertRenderable(game, `seed ${seed} step ${steps}`);
    if (game.state.phase === 'awaiting_roll') {
      game = reduceLocalGame(game, { type: 'roll', random });
    } else if (game.state.phase === 'awaiting_move') {
      const moves = legalMoves(game.state);
      expect(moves.length, `seed ${seed} step ${steps} has no legal move`).toBeGreaterThan(0);
      const pick = moves[Math.floor(random() * moves.length)];
      game = reduceLocalGame(game, {
        type: 'move',
        tokenIndex: pick.tokenIndex,
        dieIndex: pick.dieIndex,
      });
    } else {
      throw new Error(`stuck at ${game.state.phase}`);
    }
    steps += 1;
    if (steps > 4000) throw new Error(`seed ${seed} exceeded 4000 plies`);
  }
  assertRenderable(game, `seed ${seed} finished`);
  expect(game.state.winner).toBeTruthy();
  expect(colors).toContain(game.state.winner);
  return game;
}

describe('local pass-and-play reducer', () => {
  it.each([
    { players: 2, colors: ['red', 'green'] as Color[], seed: 1 },
    { players: 2, colors: ['yellow', 'blue'] as Color[], seed: 2 },
    { players: 3, colors: ['red', 'green', 'yellow'] as Color[], seed: 3 },
    { players: 3, colors: ['green', 'blue', 'red'] as Color[], seed: 4 },
    { players: 4, colors: COLORS, seed: 5 },
    { players: 4, colors: COLORS, seed: 19 },
    { players: 4, colors: COLORS, seed: 42 },
  ])('plays $players-player seed $seed to a winner', ({ colors, seed }) => {
    const finished = playToWinner(colors, seed);
    expect(finished.state.phase).toBe('finished');
  });

  it('maps every reachable progress for every colour through the board renderer', () => {
    for (const color of COLORS) {
      const yard: TokenPos = { zone: 'yard' };
      expect(cellOf(yard, color)).toBeNull();
      expect(cellForToken(color, yard)).toBeDefined();
      for (let progress = 0; progress <= 74; progress++) {
        const pos = tokenPosForProgress(color, progress);
        expect(pos, `${color} progress ${progress}`).toBeDefined();
        if (!pos) continue;
        if (pos.zone === 'home' || pos.zone === 'track' || pos.zone === 'homeColumn') {
          expect(cellOf(pos, color), `${color} ${progress}`).toBeDefined();
        }
      }
    }
  });

  it('keeps the local snapshot after a socket reconnect or AppState resume', async () => {
    const memory = new Map<string, string>();
    const store = {
      async getItem(key: string) {
        return memory.get(key) ?? null;
      },
      async setItem(key: string, value: string) {
        memory.set(key, value);
      },
      async deleteItem(key: string) {
        memory.delete(key);
      },
    };
    let game = createLocalGame(COLORS);
    game = reduceLocalGame(game, { type: 'roll', random: mulberry32(7) });
    await saveLocalGame(store, game);
    const events: PlayEvent[] = ['socket-reconnect', 'app-background', 'app-active', 'game-state'];
    for (const event of events) {
      expect(decidePlayEvent('local', event)).toEqual({ type: 'stay' });
    }
    const restored = await loadLocalGame(store);
    expect(restored?.state).toEqual(game.state);
    expect(restored?.lastRoll).toEqual(game.lastRoll);
    await clearLocalGame(store);
    expect(await loadLocalGame(store)).toBeNull();
  });

  it('rejects a broken snapshot instead of inventing a board', () => {
    expect(parseLocalGame('{"colors":["red"]}')).toBeNull();
    expect(parseLocalGame(serializeLocalGame(createLocalGame(['red', 'blue'])))?.colors).toEqual([
      'red',
      'blue',
    ]);
  });
});
