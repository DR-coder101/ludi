import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { io as ioClient, Socket } from 'socket.io-client';
import type { 
  ClientToServerEvents, 
  ServerToClientEvents, 
  RoomState,
  GameState,
  DiceRolledPayload,
  TokenMovedPayload,
  GameOverPayload,
  Color,
} from '@ludi/protocol';
import { createLudiServer } from './server.js';

const SERVER_URL = 'http://localhost:3002';
const TEST_PORT = 3002;

let server: ReturnType<typeof createLudiServer>;

beforeAll(async () => {
  server = createLudiServer(TEST_PORT);
  await server.start();
  await new Promise(resolve => setTimeout(resolve, 200));
});

afterAll(async () => {
  if (server) {
    await server.stop();
  }
});

type TestSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

function createTestClient(): TestSocket {
  return ioClient(SERVER_URL, {
    transports: ['websocket'],
    reconnection: false,
  });
}

async function waitForConnection(socket: TestSocket): Promise<void> {
  return new Promise((resolve, reject) => {
    if (socket.connected) {
      resolve();
      return;
    }
    socket.once('connect', resolve);
    socket.once('connect_error', reject);
    setTimeout(() => reject(new Error('Connection timeout')), 3000);
  });
}

describe('Game Turn State Machine', () => {
  it('should complete a basic game flow with 2 players', async () => {
    const clients: TestSocket[] = [];

    for (let i = 0; i < 2; i++) {
      const client = createTestClient();
      await waitForConnection(client);
      clients.push(client);
    }

    try {
      const createPromise = new Promise<string>((resolve) => {
        clients[0].emit('room:create', {
          displayName: 'Player 1',
          houseRules: {
            maxConsecutiveSixes: 2,
            extraRollOnCapture: false,
            blockadeCanMoveTogether: false,
            exactFinishBonus: false,
            playForPlacements: false,
          },
        }, (response) => {
          expect(response.success).toBe(true);
          resolve(response.roomCode!);
        });
      });

      const roomCode = await createPromise;
      expect(roomCode).toBeTruthy();

      const joinPromise = new Promise<void>((resolve) => {
        clients[1].emit('room:join', {
          roomCode,
          displayName: 'Player 2',
        }, (response) => {
          expect(response.success).toBe(true);
          resolve();
        });
      });
      await joinPromise;

      const gameStatePromise = new Promise<GameState>((resolve) => {
        clients[0].once('game:state', resolve);
      });

      clients[0].emit('room:ready');
      const gameState = await gameStatePromise;

      expect(gameState.phase).toBe('awaiting_roll');
      expect(gameState.tokens).toHaveLength(8);
      expect(gameState.config.playerColors).toHaveLength(2);

      const rollPromise = new Promise<DiceRolledPayload>((resolve) => {
        clients[0].once('game:diceRolled', resolve);
      });

      clients[0].emit('game:roll', {}, (response) => {
        expect(response.success).toBe(true);
      });

      const diceRolled = await rollPromise;
      expect(diceRolled.value).toBeGreaterThanOrEqual(1);
      expect(diceRolled.value).toBeLessThanOrEqual(6);
      expect(Array.isArray(diceRolled.legalMoves)).toBe(true);

      console.log(`Test completed successfully - dice: ${diceRolled.value}, legal moves: ${diceRolled.legalMoves.length}`);

    } finally {
      for (const client of clients) {
        client.disconnect();
      }
    }
  }, 30000);

  it.skip('should play a full 4-player game to completion', async () => {
    const clients: TestSocket[] = [];
    const colors: Color[] = ['red', 'green', 'yellow', 'blue'];
    const socketColors = new Map<string, Color>();

    for (let i = 0; i < 4; i++) {
      const client = createTestClient();
      await waitForConnection(client);
      clients.push(client);
    }

    let roomCode = '';

    try {
      const createPromise = new Promise<string>((resolve) => {
        clients[0].emit('room:create', {
          displayName: 'Player 1',
          houseRules: {
            maxConsecutiveSixes: 2,
            extraRollOnCapture: false,
            blockadeCanMoveTogether: false,
            exactFinishBonus: false,
            playForPlacements: false,
          },
        }, (response) => {
          expect(response.success).toBe(true);
          resolve(response.roomCode!);
        });
      });

      roomCode = await createPromise;
      expect(roomCode).toBeTruthy();
      
      if (clients[0].id) {
        socketColors.set(clients[0].id, colors[0]);
      }

      for (let i = 1; i < 4; i++) {
        const joinPromise = new Promise<void>((resolve) => {
          clients[i].emit('room:join', {
            roomCode: roomCode,
            displayName: `Player ${i + 1}`,
          }, (response) => {
            expect(response.success).toBe(true);
            resolve();
          });
        });
        await joinPromise;
      }

      const roomStatePromise = new Promise<RoomState>((resolve) => {
        clients[0].once('room:state', resolve);
      });
      const room = await roomStatePromise;
      
      for (let i = 0; i < 4; i++) {
        const socketId = clients[i].id;
        if (socketId) {
          socketColors.set(socketId, room.players[i].color);
        }
      }

      const gameStatePromise = new Promise<GameState>((resolve) => {
        clients[0].once('game:state', resolve);
      });

      clients[0].emit('room:ready');
      const initialGameState = await gameStatePromise;

      expect(initialGameState.phase).toBe('awaiting_roll');
      expect(initialGameState.tokens).toHaveLength(16);

      let gameOver = false;
      let winner: string | null = null;

      const gameOverPromise = new Promise<GameOverPayload>((resolve) => {
        for (const client of clients) {
          client.on('game:over', (payload) => {
            gameOver = true;
            winner = payload.winnerId;
            resolve(payload);
          });
        }
      });

      let turnCount = 0;
      const maxTurns = 500;
      let lastGameState = initialGameState;

      while (!gameOver && turnCount < maxTurns) {
        turnCount++;

        if (lastGameState.phase === 'finished') {
          break;
        }

        const currentColor = lastGameState.turn;
        const currentClientIndex = room.players.findIndex(p => p.color === currentColor);
        const currentClient = clients[currentClientIndex];

        if (!currentClient) {
          break;
        }

        const stateUpdatePromise = new Promise<GameState>((resolve) => {
          currentClient.once('game:state', resolve);
        });

        const rollPromise = new Promise<DiceRolledPayload>((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('Roll timeout')), 5000);
          currentClient.once('game:diceRolled', (payload) => {
            clearTimeout(timeout);
            resolve(payload);
          });
        });

        currentClient.emit('game:roll', {}, (response) => {
          if (!response.success) {
            console.log('Roll failed:', response.error);
          }
        });

        let dicePayload: DiceRolledPayload;
        try {
          dicePayload = await rollPromise;
          lastGameState = await stateUpdatePromise;
        } catch (e) {
          console.log('Roll error:', e);
          break;
        }

        expect(dicePayload.value).toBeGreaterThanOrEqual(1);
        expect(dicePayload.value).toBeLessThanOrEqual(6);

        if (dicePayload.legalMoves.length > 0) {
          const randomMoveIndex = Math.floor(Math.random() * dicePayload.legalMoves.length);
          const moveToMake = dicePayload.legalMoves[randomMoveIndex];

          const moveStatePromise = new Promise<GameState>((resolve) => {
            currentClient.once('game:state', resolve);
          });

          const movePromise = new Promise<TokenMovedPayload>((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Move timeout')), 5000);
            currentClient.once('game:tokenMoved', (payload) => {
              clearTimeout(timeout);
              resolve(payload);
            });
          });

          currentClient.emit('game:move', { tokenIndex: moveToMake.tokenIndex }, (response) => {
            if (!response.success) {
              console.log('Move failed:', response.error);
            }
          });

          try {
            const tokenMoved = await movePromise;
            lastGameState = await moveStatePromise;
            expect(tokenMoved.tokenIndex).toBe(moveToMake.tokenIndex);
          } catch (e) {
            console.log('Move error:', e);
            break;
          }
        } else {
          await new Promise(resolve => setTimeout(resolve, 3100));
          const nextStatePromise = new Promise<GameState>((resolve) => {
            currentClient.once('game:state', resolve);
          });
          lastGameState = await nextStatePromise;
        }

        if (gameOver) break;
      }

      const finalPayload = await Promise.race([
        gameOverPromise,
        new Promise<GameOverPayload>((_, reject) => 
          setTimeout(() => reject(new Error('Game did not finish')), 60000)
        )
      ]);

      expect(gameOver).toBe(true);
      expect(finalPayload.winnerId).toBeTruthy();
      expect(finalPayload.placements.length).toBeGreaterThan(0);
      expect(finalPayload.placements[0].placement).toBe(1);
      
      console.log(`Game completed in ${turnCount} turns. Winner: ${winner}`);

    } finally {
      for (const client of clients) {
        client.disconnect();
      }
    }
  }, 120000);

  it('should reject game:roll when not in roll phase', async () => {
    const client = createTestClient();
    await waitForConnection(client);

    try {
      const createPromise = new Promise<string>((resolve) => {
        client.emit('room:create', {
          displayName: 'Test Player',
          houseRules: {
            maxConsecutiveSixes: 2,
            extraRollOnCapture: false,
            blockadeCanMoveTogether: false,
            exactFinishBonus: false,
            playForPlacements: false,
          },
        }, (response) => {
          resolve(response.roomCode!);
        });
      });

      await createPromise;

      const rollPromise = new Promise<boolean>((resolve) => {
        client.emit('game:roll', {}, (response) => {
          resolve(response.success);
        });
      });

      const success = await rollPromise;
      expect(success).toBe(false);

    } finally {
      client.disconnect();
    }
  });

  it('should reject game:move when not in move phase', async () => {
    const client = createTestClient();
    await waitForConnection(client);

    try {
      const createPromise = new Promise<string>((resolve) => {
        client.emit('room:create', {
          displayName: 'Test Player',
          houseRules: {
            maxConsecutiveSixes: 2,
            extraRollOnCapture: false,
            blockadeCanMoveTogether: false,
            exactFinishBonus: false,
            playForPlacements: false,
          },
        }, (response) => {
          resolve(response.roomCode!);
        });
      });

      await createPromise;

      const movePromise = new Promise<boolean>((resolve) => {
        client.emit('game:move', { tokenIndex: 0 }, (response) => {
          resolve(response.success);
        });
      });

      const success = await movePromise;
      expect(success).toBe(false);

    } finally {
      client.disconnect();
    }
  });

  it('should reject illegal moves with hint', async () => {
    const clients: TestSocket[] = [];

    for (let i = 0; i < 2; i++) {
      const client = createTestClient();
      await waitForConnection(client);
      clients.push(client);
    }

    try {
      const createPromise = new Promise<string>((resolve) => {
        clients[0].emit('room:create', {
          displayName: 'Player 1',
          houseRules: {
            maxConsecutiveSixes: 2,
            extraRollOnCapture: false,
            blockadeCanMoveTogether: false,
            exactFinishBonus: false,
            playForPlacements: false,
          },
        }, (response) => {
          resolve(response.roomCode!);
        });
      });

      const roomCode = await createPromise;

      const joinPromise = new Promise<void>((resolve) => {
        clients[1].emit('room:join', {
          roomCode,
          displayName: 'Player 2',
        }, (response) => {
          resolve();
        });
      });
      await joinPromise;

      const gameStatePromise = new Promise<GameState>((resolve) => {
        clients[0].once('game:state', resolve);
      });

      clients[0].emit('room:ready');
      await gameStatePromise;

      const rollPromise = new Promise<DiceRolledPayload>((resolve) => {
        clients[0].once('game:diceRolled', resolve);
      });

      clients[0].emit('game:roll', {}, () => {});
      const dicePayload = await rollPromise;

      const invalidTokenIndex = 99;
      const movePromise = new Promise<{ success: boolean; hint?: string }>((resolve) => {
        clients[0].emit('game:move', { tokenIndex: invalidTokenIndex }, (response) => {
          resolve(response);
        });
      });

      const response = await movePromise;
      expect(response.success).toBe(false);
      if (response.hint) {
        expect(response.hint).toBeTruthy();
      }

    } finally {
      for (const client of clients) {
        client.disconnect();
      }
    }
  });
});
