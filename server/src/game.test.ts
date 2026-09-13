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

  it('should play a full 4-player game to completion', async () => {
    const clients: TestSocket[] = [];

    for (let i = 0; i < 4; i++) {
      const client = createTestClient();
      await waitForConnection(client);
      clients.push(client);
    }

    let roomCode = '';
    let currentGameState: GameState | null = null;
    let gameOverPayload: GameOverPayload | null = null;
    let lastDiceRolled: DiceRolledPayload | null = null;
    
    const gameStateHandler = (state: GameState) => {
      currentGameState = state;
    };
    
    const gameOverHandler = (payload: GameOverPayload) => {
      gameOverPayload = payload;
    };
    
    const diceRolledHandler = (payload: DiceRolledPayload) => {
      lastDiceRolled = payload;
    };
    
    for (const client of clients) {
      client.on('game:state', gameStateHandler);
      client.on('game:over', gameOverHandler);
      client.on('game:diceRolled', diceRolledHandler);
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

      roomCode = await createPromise;
      expect(roomCode).toBeTruthy();

      let room: RoomState | null = null;
      const roomStateHandler = (state: RoomState) => {
        room = state;
      };
      clients[0].on('room:state', roomStateHandler);

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

      await new Promise<void>((resolve) => {
        const checkRoom = () => {
          if (room && room.players.length === 4) {
            resolve();
          } else {
            setTimeout(checkRoom, 50);
          }
        };
        checkRoom();
      });
      
      clients[0].off('room:state', roomStateHandler);
      expect(room).toBeTruthy();
      
      const colorToClient = new Map<Color, TestSocket>();
      for (let i = 0; i < 4; i++) {
        colorToClient.set(room.players[i].color, clients[i]);
      }

      const gameStartPromise = new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Game did not start within 5s')), 5000);
        const checkState = () => {
          if (currentGameState) {
            clearTimeout(timeout);
            resolve();
          } else {
            setTimeout(checkState, 50);
          }
        };
        setTimeout(checkState, 10);
      });

      clients[0].emit('room:ready');
      
      try {
        await gameStartPromise;
      } catch (e) {
        console.error('Game start error:', e);
        throw e;
      }

      expect(currentGameState?.phase).toBe('awaiting_roll');
      expect(currentGameState?.tokens).toHaveLength(16);

      let turnCount = 0;
      const maxTurns = 2000;

      while (!gameOverPayload && turnCount < maxTurns) {
        turnCount++;

        if (!currentGameState || currentGameState.phase === 'finished') {
          break;
        }

        const currentColor = currentGameState.turn;
        const currentClient = colorToClient.get(currentColor);

        if (!currentClient) {
          console.log(`No client found for color ${currentColor}`);
          break;
        }

        if (currentGameState.phase === 'awaiting_roll') {
          lastDiceRolled = null;
          
          await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Roll timeout')), 5000);
            
            const checkDice = () => {
              if (lastDiceRolled) {
                clearTimeout(timeout);
                resolve();
              } else {
                setTimeout(checkDice, 50);
              }
            };
            
            currentClient.emit('game:roll', {}, (response) => {
              if (!response.success) {
                clearTimeout(timeout);
                reject(new Error(`Roll failed: ${response.error}`));
              } else {
                checkDice();
              }
            });
          });
          
          await new Promise(resolve => setTimeout(resolve, 50));
          
          if (lastDiceRolled && lastDiceRolled.legalMoves.length === 0) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        } else if (currentGameState.phase === 'awaiting_move' && lastDiceRolled) {
          if (lastDiceRolled.legalMoves.length === 0) {
            await new Promise(resolve => setTimeout(resolve, 100));
            continue;
          }

          const randomMoveIndex = Math.floor(Math.random() * lastDiceRolled.legalMoves.length);
          const moveToMake = lastDiceRolled.legalMoves[randomMoveIndex];

          await new Promise<void>((resolve) => {
            const timeout = setTimeout(() => resolve(), 5000);
            
            const originalPhase = currentGameState?.phase;
            const originalTurn = currentGameState?.turn;
            
            const checkStateChange = () => {
              if (currentGameState &&
                  (currentGameState.phase !== originalPhase || 
                   currentGameState.turn !== originalTurn)) {
                clearTimeout(timeout);
                resolve();
              } else {
                setTimeout(checkStateChange, 50);
              }
            };
            
            currentClient.emit('game:move', { tokenIndex: moveToMake.tokenIndex }, (response) => {
              if (response.success) {
                checkStateChange();
              } else {
                clearTimeout(timeout);
                resolve();
              }
            });
          });
          
          await new Promise(resolve => setTimeout(resolve, 50));
        }

        if (gameOverPayload) break;
      }

      expect(gameOverPayload).toBeTruthy();
      expect(gameOverPayload!.winnerId).toBeTruthy();
      expect(gameOverPayload!.placements.length).toBeGreaterThan(0);
      expect(gameOverPayload!.placements[0].placement).toBe(1);
      
      console.log(`✅ Game completed in ${turnCount} turns. Winner: ${gameOverPayload!.winnerId}`);

    } finally {
      for (const client of clients) {
        client.disconnect();
      }
    }
  }, 300000);

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
