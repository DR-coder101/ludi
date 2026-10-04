import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { io as ioClient, Socket } from 'socket.io-client';
import type { ClientToServerEvents, GameState, HouseRules, ServerToClientEvents, RoomState } from '@ludi/protocol';
import { createLudiServer } from './server.js';

const SERVER_URL = 'http://localhost:3001';
const TEST_PORT = 3001;

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

describe('Room Lifecycle', () => {
  describe('room:create', () => {
    it('should create a room with valid payload', async () => {
      const client = createTestClient();
      await waitForConnection(client);

      const roomStatePromise = new Promise<RoomState>((resolve) => {
        client.once('room:state', resolve);
      });

      const response = await new Promise<any>((resolve) => {
        client.emit('room:create', {
          displayName: 'TestHost',
          houseRules: {
            maxConsecutiveSixes: 2,
            extraRollOnCapture: false,
            blockadeCanMoveTogether: false,
            exactFinishBonus: false,
            playForPlacements: true,
          },
        }, resolve);
      });

      expect(response.success).toBe(true);
      expect(response.roomCode).toBeDefined();
      expect(response.roomCode).toHaveLength(5);

      const roomState = await roomStatePromise;

      expect(roomState.roomCode).toBe(response.roomCode);
      expect(roomState.players).toHaveLength(1);
      expect(roomState.players[0].displayName).toBe('TestHost');
      expect(roomState.players[0].isHost).toBe(true);
      expect(roomState.players[0].color).toBe('red');
      expect(roomState.status).toBe('lobby');

      client.disconnect();
    });

    it('should reject invalid payload', async () => {
      const client = createTestClient();
      await waitForConnection(client);

      const response = await new Promise<any>((resolve) => {
        client.emit('room:create', {
          displayName: '',
          houseRules: {} as any,
        }, resolve);
      });

      expect(response.success).toBe(false);
      expect(response.error).toBe('Invalid payload');

      client.disconnect();
    });
  });

  describe('room:join', () => {
    it('should allow joining an existing room', async () => {
      const host = createTestClient();
      await waitForConnection(host);

      const createStatePromise = new Promise<RoomState>((resolve) => {
        host.once('room:state', resolve);
      });

      const createResponse = await new Promise<any>((resolve) => {
        host.emit('room:create', {
          displayName: 'Host',
          houseRules: {
            maxConsecutiveSixes: 2,
            extraRollOnCapture: false,
            blockadeCanMoveTogether: false,
            exactFinishBonus: false,
            playForPlacements: true,
          },
        }, resolve);
      });

      await createStatePromise;
      const roomCode = createResponse.roomCode;

      const guest = createTestClient();
      await waitForConnection(guest);

      const hostStatePromise = new Promise<RoomState>((resolve) => {
        host.once('room:state', resolve);
      });

      const guestStatePromise = new Promise<RoomState>((resolve) => {
        guest.once('room:state', resolve);
      });

      const joinResponse = await new Promise<any>((resolve) => {
        guest.emit('room:join', {
          roomCode,
          displayName: 'Guest',
        }, resolve);
      });

      expect(joinResponse.success).toBe(true);

      const guestState = await guestStatePromise;
      const hostState = await hostStatePromise;

      expect(guestState.players).toHaveLength(2);
      expect(hostState.players).toHaveLength(2);
      expect(guestState.players[1].displayName).toBe('Guest');
      expect(guestState.players[1].color).toBe('green');

      host.disconnect();
      guest.disconnect();
    });

    it('should reject joining non-existent room', async () => {
      const client = createTestClient();
      await waitForConnection(client);

      const response = await new Promise<any>((resolve) => {
        client.emit('room:join', {
          roomCode: 'FAKE9',
          displayName: 'Test',
        }, resolve);
      });

      expect(response.success).toBe(false);
      expect(response.error).toBe('Room not found');

      client.disconnect();
    });

    it('should reject 5th player joining full room', async () => {
      const host = createTestClient();
      await waitForConnection(host);

      const createResponse = await new Promise<any>((resolve) => {
        host.emit('room:create', {
          displayName: 'Host',
          houseRules: {
            maxConsecutiveSixes: 2,
            extraRollOnCapture: false,
            blockadeCanMoveTogether: false,
            exactFinishBonus: false,
            playForPlacements: true,
          },
        }, resolve);
      });

      const roomCode = createResponse.roomCode;

      const players: TestSocket[] = [host];
      
      for (let i = 1; i < 4; i++) {
        const player = createTestClient();
        await waitForConnection(player);
        await new Promise<any>((resolve) => {
          player.emit('room:join', {
            roomCode,
            displayName: `Player${i}`,
          }, resolve);
        });
        players.push(player);
      }

      const fifthPlayer = createTestClient();
      await waitForConnection(fifthPlayer);

      const response = await new Promise<any>((resolve) => {
        fifthPlayer.emit('room:join', {
          roomCode,
          displayName: 'Player5',
        }, resolve);
      });

      expect(response.success).toBe(false);
      expect(response.error).toBe('Room is full');

      players.forEach(p => p.disconnect());
      fifthPlayer.disconnect();
    });

    it('should reject invalid join payload', async () => {
      const client = createTestClient();
      await waitForConnection(client);

      const response = await new Promise<any>((resolve) => {
        client.emit('room:join', {
          roomCode: 'ABC',
          displayName: 'Test',
        } as any, resolve);
      });

      expect(response.success).toBe(false);
      expect(response.error).toBe('Invalid payload');

      client.disconnect();
    });
  });

  describe('room:requestState', () => {
    it('should return room state for player in room', async () => {
      const client = createTestClient();
      await waitForConnection(client);

      const createResponse = await new Promise<any>((resolve) => {
        client.emit('room:create', {
          displayName: 'TestHost',
          houseRules: {
            maxConsecutiveSixes: 2,
            extraRollOnCapture: false,
            blockadeCanMoveTogether: false,
            exactFinishBonus: false,
            playForPlacements: true,
          },
        }, resolve);
      });

      expect(createResponse.success).toBe(true);
      const roomCode = createResponse.roomCode;

      const statePromise = new Promise<RoomState>((resolve) => {
        client.once('room:state', resolve);
      });

      client.emit('room:requestState');

      const state = await statePromise;

      expect(state.roomCode).toBe(roomCode);
      expect(state.players).toHaveLength(1);
      expect(state.players[0].displayName).toBe('TestHost');

      client.disconnect();
    });

    it('should send error when not in a room', async () => {
      const client = createTestClient();
      await waitForConnection(client);

      const errorPromise = new Promise<string>((resolve) => {
        client.once('error', resolve);
      });

      client.emit('room:requestState');

      const error = await errorPromise;

      expect(error).toBe('Not in a room');

      client.disconnect();
    });
  });

  describe('room:selectSeat', () => {
    it('should allow selecting an empty seat', async () => {
      const host = createTestClient();
      await waitForConnection(host);

      const createResponse = await new Promise<any>((resolve) => {
        host.emit('room:create', {
          displayName: 'Host',
          houseRules: {
            maxConsecutiveSixes: 2,
            extraRollOnCapture: false,
            blockadeCanMoveTogether: false,
            exactFinishBonus: false,
            playForPlacements: false,
          },
        }, resolve);
      });

      expect(createResponse.success).toBe(true);

      const selectResponse = await new Promise<any>((resolve) => {
        host.emit('room:selectSeat', { color: 'green' }, resolve);
      });

      expect(selectResponse.success).toBe(true);

      host.disconnect();
    });

    it('should reject selecting an occupied seat', async () => {
      const host = createTestClient();
      const guest = createTestClient();
      await waitForConnection(host);
      await waitForConnection(guest);

      const createResponse = await new Promise<any>((resolve) => {
        host.emit('room:create', {
          displayName: 'Host',
          houseRules: {
            maxConsecutiveSixes: 2,
            extraRollOnCapture: false,
            blockadeCanMoveTogether: false,
            exactFinishBonus: false,
            playForPlacements: false,
          },
        }, resolve);
      });

      await new Promise<any>((resolve) => {
        guest.emit('room:join', {
          roomCode: createResponse.roomCode,
          displayName: 'Guest',
        }, resolve);
      });

      const selectResponse = await new Promise<any>((resolve) => {
        guest.emit('room:selectSeat', { color: 'red' }, resolve);
      });

      expect(selectResponse.success).toBe(false);
      expect(selectResponse.error).toBe('Seat already taken');

      host.disconnect();
      guest.disconnect();
    });

    it('should reject seat selection after game starts', async () => {
      const host = createTestClient();
      const guest = createTestClient();
      await waitForConnection(host);
      await waitForConnection(guest);

      const createResponse = await new Promise<any>((resolve) => {
        host.emit('room:create', {
          displayName: 'Host',
          houseRules: {
            maxConsecutiveSixes: 2,
            extraRollOnCapture: false,
            blockadeCanMoveTogether: false,
            exactFinishBonus: false,
            playForPlacements: false,
          },
        }, resolve);
      });

      await new Promise<any>((resolve) => {
        guest.emit('room:join', {
          roomCode: createResponse.roomCode,
          displayName: 'Guest',
        }, resolve);
      });

      host.emit('room:ready');
      await new Promise(resolve => setTimeout(resolve, 100));

      const selectResponse = await new Promise<any>((resolve) => {
        host.emit('room:selectSeat', { color: 'blue' }, resolve);
      });

      expect(selectResponse.success).toBe(false);
      expect(selectResponse.error).toBe('Cannot change seats after game starts');

      host.disconnect();
      guest.disconnect();
    });

    it('should return success when selecting own current seat', async () => {
      const host = createTestClient();
      await waitForConnection(host);

      const createResponse = await new Promise<any>((resolve) => {
        host.emit('room:create', {
          displayName: 'Host',
          houseRules: {
            maxConsecutiveSixes: 2,
            extraRollOnCapture: false,
            blockadeCanMoveTogether: false,
            exactFinishBonus: false,
            playForPlacements: false,
          },
        }, resolve);
      });

      expect(createResponse.success).toBe(true);

      const selectResponse = await new Promise<any>((resolve) => {
        host.emit('room:selectSeat', { color: 'red' }, resolve);
      });

      expect(selectResponse.success).toBe(true);

      host.disconnect();
    });
  });

  describe('room:leave', () => {
    it('should handle player leaving room', async () => {
      const host = createTestClient();
      await waitForConnection(host);

      const createStatePromise = new Promise<RoomState>((resolve) => {
        host.once('room:state', resolve);
      });

      const createResponse = await new Promise<any>((resolve) => {
        host.emit('room:create', {
          displayName: 'Host',
          houseRules: {
            maxConsecutiveSixes: 2,
            extraRollOnCapture: false,
            blockadeCanMoveTogether: false,
            exactFinishBonus: false,
            playForPlacements: true,
          },
        }, resolve);
      });

      await createStatePromise;
      const roomCode = createResponse.roomCode;

      const guest = createTestClient();
      await waitForConnection(guest);

      const joinStatePromise = new Promise<RoomState>((resolve) => {
        guest.once('room:state', resolve);
      });

      await new Promise<any>((resolve) => {
        guest.emit('room:join', {
          roomCode,
          displayName: 'Guest',
        }, resolve);
      });

      await joinStatePromise;

      const hostStatePromise = new Promise<RoomState>((resolve) => {
        host.once('room:state', resolve);
      });

      guest.emit('room:leave');

      const hostState = await hostStatePromise;
      expect(hostState.players).toHaveLength(1);
      expect(hostState.players[0].displayName).toBe('Host');

      host.disconnect();
      guest.disconnect();
    });

    it('should transfer host when host leaves', async () => {
      const host = createTestClient();
      await waitForConnection(host);

      const createStatePromise = new Promise<RoomState>((resolve) => {
        host.once('room:state', resolve);
      });

      const createResponse = await new Promise<any>((resolve) => {
        host.emit('room:create', {
          displayName: 'Host',
          houseRules: {
            maxConsecutiveSixes: 2,
            extraRollOnCapture: false,
            blockadeCanMoveTogether: false,
            exactFinishBonus: false,
            playForPlacements: true,
          },
        }, resolve);
      });

      await createStatePromise;
      const roomCode = createResponse.roomCode;

      const guest = createTestClient();
      await waitForConnection(guest);

      const joinStatePromise = new Promise<RoomState>((resolve) => {
        guest.once('room:state', resolve);
      });

      await new Promise<any>((resolve) => {
        guest.emit('room:join', {
          roomCode,
          displayName: 'Guest',
        }, resolve);
      });

      await joinStatePromise;

      const guestStatePromise = new Promise<RoomState>((resolve) => {
        guest.once('room:state', resolve);
      });

      host.emit('room:leave');

      const guestState = await guestStatePromise;
      expect(guestState.players).toHaveLength(1);
      expect(guestState.players[0].displayName).toBe('Guest');
      expect(guestState.players[0].isHost).toBe(true);

      host.disconnect();
      guest.disconnect();
    });
  });

  describe('room:updateHouseRules', () => {
    const baseRules: HouseRules = {
      maxConsecutiveSixes: 2,
      extraRollOnCapture: false,
      blockadeCanMoveTogether: false,
      exactFinishBonus: false,
      playForPlacements: false,
    };

    async function openRoom() {
      const host = createTestClient();
      await waitForConnection(host);

      const created = await new Promise<{ success: boolean; roomCode?: string; error?: string }>((resolve) => {
        host.emit('room:create', { displayName: 'Host', houseRules: baseRules }, resolve);
      });
      if (!created.success || !created.roomCode) {
        host.disconnect();
        throw new Error(created.error ?? 'room:create failed');
      }

      const guest = createTestClient();
      await waitForConnection(guest);
      const joined = await new Promise<{ success: boolean; error?: string }>((resolve) => {
        guest.emit('room:join', { roomCode: created.roomCode!, displayName: 'Guest' }, resolve);
      });
      if (!joined.success) {
        host.disconnect();
        guest.disconnect();
        throw new Error(joined.error ?? 'room:join failed');
      }

      return { host, guest };
    }

    it('stores the host update, forces blockade off, and copies the rules into the game', async () => {
      const { host, guest } = await openRoom();
      try {
        const sent: HouseRules = {
          maxConsecutiveSixes: 3,
          extraRollOnCapture: true,
          blockadeCanMoveTogether: true,
          exactFinishBonus: true,
          playForPlacements: true,
        };
        const stored: HouseRules = {
          maxConsecutiveSixes: 3,
          extraRollOnCapture: true,
          blockadeCanMoveTogether: false,
          exactFinishBonus: true,
          playForPlacements: true,
        };

        const statePromise = new Promise<RoomState>((resolve) => {
          guest.once('room:state', resolve);
        });
        const response = await new Promise<{ success: boolean; error?: string }>((resolve) => {
          host.emit('room:updateHouseRules', sent, resolve);
        });

        expect(response).toEqual({ success: true });
        const state = await statePromise;
        expect(state.status).toBe('lobby');
        expect(state.houseRules).toEqual(stored);

        const gamePromise = new Promise<GameState>((resolve) => {
          host.once('game:state', resolve);
        });
        host.emit('room:ready');
        const game = await gamePromise;
        expect(game.config.houseRules).toEqual(stored);
      } finally {
        host.disconnect();
        guest.disconnect();
      }
    });

    it('rejects a guest and leaves the stored rules unchanged', async () => {
      const { host, guest } = await openRoom();
      try {
        const response = await new Promise<{ success: boolean; error?: string }>((resolve) => {
          guest.emit('room:updateHouseRules', {
            ...baseRules,
            extraRollOnCapture: true,
          }, resolve);
        });

        expect(response).toEqual({ success: false, error: 'Only the host can change house rules' });

        const state = await new Promise<RoomState>((resolve) => {
          host.once('room:state', resolve);
          host.emit('room:requestState');
        });
        expect(state.houseRules).toEqual(baseRules);
      } finally {
        host.disconnect();
        guest.disconnect();
      }
    });

    it('rejects an update after the game has started', async () => {
      const { host, guest } = await openRoom();
      try {
        const gamePromise = new Promise<GameState>((resolve) => {
          host.once('game:state', resolve);
        });
        host.emit('room:ready');
        const game = await gamePromise;
        expect(game.config.houseRules).toEqual(baseRules);

        const response = await new Promise<{ success: boolean; error?: string }>((resolve) => {
          host.emit('room:updateHouseRules', {
            ...baseRules,
            maxConsecutiveSixes: 'unlimited',
          }, resolve);
        });
        expect(response).toEqual({
          success: false,
          error: 'Cannot change house rules after the game starts',
        });

        const state = await new Promise<RoomState>((resolve) => {
          host.once('room:state', resolve);
          host.emit('room:requestState');
        });
        expect(state.status).toBe('in_progress');
        expect(state.houseRules).toEqual(baseRules);
      } finally {
        host.disconnect();
        guest.disconnect();
      }
    });

    it('rejects an invalid payload', async () => {
      const client = createTestClient();
      await waitForConnection(client);
      try {
        const response = await new Promise<{ success: boolean; error?: string }>((resolve) => {
          client.emit('room:updateHouseRules', {
            maxConsecutiveSixes: 4,
            extraRollOnCapture: true,
          } as HouseRules, resolve);
        });
        expect(response).toEqual({ success: false, error: 'Invalid payload' });
      } finally {
        client.disconnect();
      }
    });
  });
});
