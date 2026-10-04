import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { io as ioClient, Socket as ClientSocket } from 'socket.io-client';
import { createLudiServer } from './server.js';
import type { RoomState, GameState, DiceRolledPayload } from '@ludi/protocol';

interface TestSocket extends ClientSocket {
  playerId?: string;
}

const PORT = 3012;
const SERVER_URL = `http://localhost:${PORT}`;
const TEST_AI_DELAY_MS = 50;

const HOUSE_RULES = {
  maxConsecutiveSixes: 2 as const,
  extraRollOnCapture: false,
  blockadeCanMoveTogether: false,
  exactFinishBonus: false,
  playForPlacements: true,
};

describe('1-player vs bots', () => {
  let server: ReturnType<typeof createLudiServer>;

  beforeAll(async () => {
    server = createLudiServer({
      port: PORT,
      timingConfig: {
        gracePeriodMs: 500,
        aiThinkDelayMs: TEST_AI_DELAY_MS,
      },
    });
    await server.start();
  });

  afterAll(async () => {
    await server.stop();
  });

  it('fills empty seats with bots and AI takes the first turn when host sits green', async () => {
    const client = ioClient(SERVER_URL, { autoConnect: false }) as TestSocket;

    await new Promise<void>((resolve) => {
      client.on('connect', resolve);
      client.connect();
    });

    let roomCode = '';

    await new Promise<void>((resolve) => {
      client.emit(
        'room:create',
        { displayName: 'Solo Host', houseRules: HOUSE_RULES },
        (response) => {
          expect(response.success).toBe(true);
          roomCode = response.roomCode!;
          client.playerId = response.playerId;
          resolve();
        },
      );
    });

    await new Promise<void>((resolve) => {
      client.emit('room:selectSeat', { color: 'green' }, (response) => {
        expect(response.success).toBe(true);
        resolve();
      });
    });

    const roomAfterFill = new Promise<RoomState>((resolve) => {
      client.on('room:state', (state: RoomState) => {
        if (state.players.length === 4 && state.status === 'lobby') {
          resolve(state);
        }
      });
    });

    const gameStarted = new Promise<GameState>((resolve) => {
      client.on('game:state', (state: GameState) => {
        resolve(state);
      });
    });

    const diceRolled = new Promise<DiceRolledPayload>((resolve) => {
      client.on('game:diceRolled', (payload: DiceRolledPayload) => {
        resolve(payload);
      });
    });

    client.emit('room:ready');

    const filled = await roomAfterFill;
    expect(filled.players).toHaveLength(4);
    const bots = filled.players.filter((p) => p.status === 'ai-substitute');
    expect(bots).toHaveLength(3);
    expect(bots.every((p) => p.connected === false)).toBe(true);
    expect(bots.map((p) => p.color).sort()).toEqual(['blue', 'red', 'yellow']);
    expect(filled.players.find((p) => p.id === client.playerId)?.color).toBe('green');

    const game = await gameStarted;
    expect(game.turn).toBe('red');
    expect(game.config.playerColors).toEqual(['red', 'green', 'yellow', 'blue']);

    const roll = await diceRolled;
    const redBot = filled.players.find((p) => p.color === 'red');
    expect(redBot).toBeTruthy();
    expect(roll.playerId).toBe(redBot!.id);

    client.disconnect();
  });

  it('does not fill bots when two humans start', async () => {
    const client1 = ioClient(SERVER_URL, { autoConnect: false }) as TestSocket;
    const client2 = ioClient(SERVER_URL, { autoConnect: false }) as TestSocket;

    await new Promise<void>((resolve) => {
      let n = 0;
      const ready = () => {
        n += 1;
        if (n === 2) resolve();
      };
      client1.on('connect', ready);
      client2.on('connect', ready);
      client1.connect();
      client2.connect();
    });

    let roomCode = '';

    await new Promise<void>((resolve) => {
      client1.emit(
        'room:create',
        { displayName: 'Host', houseRules: HOUSE_RULES },
        (response) => {
          expect(response.success).toBe(true);
          roomCode = response.roomCode!;
          resolve();
        },
      );
    });

    await new Promise<void>((resolve) => {
      client2.emit(
        'room:join',
        { roomCode, displayName: 'Guest' },
        (response) => {
          expect(response.success).toBe(true);
          resolve();
        },
      );
    });

    let sawBotFill = false;
    client1.on('room:state', (state: RoomState) => {
      if (state.players.some((p) => p.status === 'ai-substitute') || state.players.length > 2) {
        sawBotFill = true;
      }
    });

    const gameStarted = new Promise<GameState>((resolve) => {
      client1.on('game:state', (state: GameState) => {
        resolve(state);
      });
    });

    client1.emit('room:ready');

    const game = await gameStarted;
    expect(game.config.playerColors).toHaveLength(2);
    await new Promise((r) => setTimeout(r, TEST_AI_DELAY_MS + 50));
    expect(sawBotFill).toBe(false);

    client1.disconnect();
    client2.disconnect();
  });
});
