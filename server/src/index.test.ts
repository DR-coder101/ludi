import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { io as ioClient, Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents, RoomState } from '@ludi/protocol';
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
      expect(response.roomCode).toHaveLength(6);

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
          roomCode: 'FAKE99',
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
});
