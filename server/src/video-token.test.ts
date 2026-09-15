import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { Server } from 'http';
import { createLudiServer } from './server.js';
import type { VideoTokenResponse } from '@ludi/protocol';

describe('Video Token Endpoint', () => {
  let server: Awaited<ReturnType<typeof createLudiServer>>;
  let httpServer: Server;
  let baseUrl: string;
  const originalEnv = { ...process.env };

  beforeEach(async () => {
    process.env.LIVEKIT_API_KEY = 'test-api-key';
    process.env.LIVEKIT_API_SECRET = 'test-api-secret';
    process.env.LIVEKIT_URL = 'wss://test.livekit.cloud';

    server = createLudiServer({ port: 0 });
    await server.start();
    
    httpServer = server.httpServer;
    const address = httpServer.address();
    if (typeof address === 'object' && address) {
      baseUrl = `http://localhost:${address.port}`;
    } else {
      throw new Error('Failed to get server address');
    }
  });

  afterEach(async () => {
    await server.stop();
    process.env = originalEnv;
  });

  async function createRoomWithPlayers() {
    const { io } = server;
    const roomCode = 'TEST01';
    
    const client1 = await import('socket.io-client').then(m => m.io(baseUrl));
    const client2 = await import('socket.io-client').then(m => m.io(baseUrl));
    
    let player1Id: string | undefined;
    let player2Id: string | undefined;
    
    await new Promise<void>((resolve) => {
      client1.emit('room:create', {
        displayName: 'Player1',
        houseRules: {
          maxConsecutiveSixes: 2,
          extraRollOnCapture: false,
          blockadeCanMoveTogether: false,
          exactFinishBonus: false,
          playForPlacements: true,
        },
      }, (response) => {
        if (response.success && response.roomCode) {
          const actualRoomCode = response.roomCode;
          client2.emit('room:join', {
            roomCode: actualRoomCode,
            displayName: 'Player2',
          }, (joinResponse) => {
            if (joinResponse.success) {
              resolve();
            }
          });
        }
      });
    });

    const actualRoomCode = await new Promise<string>((resolve) => {
      client1.emit('room:create', {
        displayName: 'Player1-Final',
        houseRules: {
          maxConsecutiveSixes: 2,
          extraRollOnCapture: false,
          blockadeCanMoveTogether: false,
          exactFinishBonus: false,
          playForPlacements: true,
        },
      }, (response) => {
        if (response.success && response.roomCode && response.playerId) {
          player1Id = response.playerId;
          resolve(response.roomCode);
        }
      });
    });

    await new Promise<void>((resolve) => {
      client2.emit('room:join', {
        roomCode: actualRoomCode,
        displayName: 'Player2-Final',
      }, (joinResponse) => {
        if (joinResponse.success && joinResponse.playerId) {
          player2Id = joinResponse.playerId;
          resolve();
        }
      });
    });

    client1.emit('room:ready');

    await new Promise(resolve => setTimeout(resolve, 100));

    return {
      roomCode: actualRoomCode,
      player1Id: player1Id!,
      player2Id: player2Id!,
      cleanup: () => {
        client1.disconnect();
        client2.disconnect();
      },
    };
  }

  describe('POST /video-token', () => {
    it('should reject invalid payload', async () => {
      const response = await fetch(`${baseUrl}/video-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invalid: 'payload' }),
      });

      expect(response.status).toBe(400);
      const data: VideoTokenResponse = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid request payload');
    });

    it('should reject unknown room', async () => {
      const response = await fetch(`${baseUrl}/video-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode: 'NOTFND',
          userId: 'user123',
        }),
      });

      expect(response.status).toBe(404);
      const data: VideoTokenResponse = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('Room not found');
    });

    it('should reject player not seated in room', async () => {
      const { roomCode, cleanup } = await createRoomWithPlayers();

      const response = await fetch(`${baseUrl}/video-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode,
          userId: 'unknown-user',
        }),
      });

      expect(response.status).toBe(403);
      const data: VideoTokenResponse = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('Player not seated in room');

      cleanup();
    });

    it('should reject when game has not started yet', async () => {
      const client = await import('socket.io-client').then(m => m.io(baseUrl));
      
      let playerId: string | undefined;
      
      const roomCode = await new Promise<string>((resolve) => {
        client.emit('room:create', {
          displayName: 'LobbyPlayer',
          houseRules: {
            maxConsecutiveSixes: 2,
            extraRollOnCapture: false,
            blockadeCanMoveTogether: false,
            exactFinishBonus: false,
            playForPlacements: true,
          },
        }, (response) => {
          if (response.success && response.roomCode && response.playerId) {
            playerId = response.playerId;
            resolve(response.roomCode);
          }
        });
      });

      await new Promise(resolve => setTimeout(resolve, 50));

      const response = await fetch(`${baseUrl}/video-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode,
          userId: playerId,
        }),
      });

      expect(response.status).toBe(403);
      const data: VideoTokenResponse = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('Game has not started yet');

      client.disconnect();
    });

    it('should successfully issue token for seated player after game starts', async () => {
      const { roomCode, player1Id, cleanup } = await createRoomWithPlayers();

      const response = await fetch(`${baseUrl}/video-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode,
          userId: player1Id,
        }),
      });

      expect(response.status).toBe(200);
      const data: VideoTokenResponse = await response.json();
      expect(data.success).toBe(true);
      expect(data.token).toBeDefined();
      expect(typeof data.token).toBe('string');
      expect(data.token!.length).toBeGreaterThan(0);

      cleanup();
    });

    it('should fail gracefully when LiveKit env vars are missing', async () => {
      delete process.env.LIVEKIT_API_KEY;

      const { roomCode, player1Id, cleanup } = await createRoomWithPlayers();

      const response = await fetch(`${baseUrl}/video-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode,
          userId: player1Id,
        }),
      });

      expect(response.status).toBe(500);
      const data: VideoTokenResponse = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('LiveKit configuration missing');

      cleanup();
    });

    it('should never log tokens or secrets', async () => {
      const consoleSpy = vi.spyOn(console, 'log');
      const consoleErrorSpy = vi.spyOn(console, 'error');
      const consoleWarnSpy = vi.spyOn(console, 'warn');

      const { roomCode, player1Id, cleanup } = await createRoomWithPlayers();

      await fetch(`${baseUrl}/video-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode,
          userId: player1Id,
        }),
      });

      const allLogs = [
        ...consoleSpy.mock.calls,
        ...consoleErrorSpy.mock.calls,
        ...consoleWarnSpy.mock.calls,
      ].flat().join(' ');

      expect(allLogs).not.toContain('test-api-key');
      expect(allLogs).not.toContain('test-api-secret');
      
      const tokenPattern = /eyJ[A-Za-z0-9_-]*\.eyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*/;
      expect(tokenPattern.test(allLogs)).toBe(false);

      consoleSpy.mockRestore();
      consoleErrorSpy.mockRestore();
      consoleWarnSpy.mockRestore();

      cleanup();
    });
  });
});
