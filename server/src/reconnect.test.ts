import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { io as ioClient, Socket as ClientSocket } from 'socket.io-client';
import { createLudiServer } from './server.js';
import type { 
  RoomState, 
  GameState, 
  PlayerStatusChangedPayload,
  TokenMovedPayload,
} from '@ludi/protocol';

interface TestSocket extends ClientSocket {
  sessionToken?: string;
  playerId?: string;
}

const PORT = 3010;
const SERVER_URL = `http://localhost:${PORT}`;
const TEST_GRACE_MS = 500;
const TEST_AI_DELAY_MS = 100;

describe('M3.5 Reconnect & Dropout', () => {
  let server: ReturnType<typeof createLudiServer>;

  beforeAll(async () => {
    server = createLudiServer({
      port: PORT,
      timingConfig: {
        gracePeriodMs: TEST_GRACE_MS,
        aiThinkDelayMs: TEST_AI_DELAY_MS,
      },
    });
    await server.start();
  });

  afterAll(async () => {
    await server.stop();
  });

  it('should generate session tokens on room create and join', async () => {
    const client1 = ioClient(SERVER_URL, { autoConnect: false }) as TestSocket;
    const client2 = ioClient(SERVER_URL, { autoConnect: false }) as TestSocket;

    await new Promise<void>((resolve) => {
      let connected = 0;
      const checkBothConnected = () => {
        connected++;
        if (connected === 2) resolve();
      };
      client1.on('connect', checkBothConnected);
      client2.on('connect', checkBothConnected);
      client1.connect();
      client2.connect();
    });

    let roomCode: string;

    await new Promise<void>((resolve) => {
      client1.emit('room:create', {
        displayName: 'Player 1',
        houseRules: {
          maxConsecutiveSixes: 2,
          extraRollOnCapture: false,
          blockadeCanMoveTogether: false,
          exactFinishBonus: false,
          playForPlacements: true,
        }
      }, (response) => {
        expect(response.success).toBe(true);
        expect(response.sessionToken).toBeTruthy();
        expect(response.sessionToken).toMatch(/^[a-f0-9]{64}$/);
        expect(response.playerId).toBeTruthy();
        expect(response.playerId).toMatch(/^[a-f0-9]{32}$/);
        expect(response.playerId).not.toBe(client1.id);
        expect(response.sessionToken).not.toBe(client1.id);
        expect(response.sessionToken).not.toBe(response.playerId);
        roomCode = response.roomCode!;
        client1.sessionToken = response.sessionToken;
        client1.playerId = response.playerId;
        resolve();
      });
    });

    await new Promise<void>((resolve) => {
      client2.emit('room:join', {
        roomCode,
        displayName: 'Player 2',
      }, (response) => {
        expect(response.success).toBe(true);
        expect(response.sessionToken).toBeTruthy();
        expect(response.sessionToken).toMatch(/^[a-f0-9]{64}$/);
        expect(response.playerId).toBeTruthy();
        expect(response.playerId).toMatch(/^[a-f0-9]{32}$/);
        expect(response.playerId).not.toBe(client2.id);
        expect(response.sessionToken).not.toBe(client2.id);
        expect(response.sessionToken).not.toBe(response.playerId);
        expect(response.isReconnect).toBeUndefined();
        resolve();
      });
    });

    client1.disconnect();
    client2.disconnect();
  });

  it('should recognize reconnect with session token', async () => {
    const client1 = ioClient(SERVER_URL, { autoConnect: false }) as TestSocket;
    
    await new Promise<void>((resolve) => {
      client1.on('connect', resolve);
      client1.connect();
    });

    let roomCode: string;
    let sessionToken: string;
    let originalPlayerId: string;
    const originalSocketId = client1.id;

    await new Promise<void>((resolve) => {
      client1.emit('room:create', {
        displayName: 'Player 1',
        houseRules: {
          maxConsecutiveSixes: 2,
          extraRollOnCapture: false,
          blockadeCanMoveTogether: false,
          exactFinishBonus: false,
          playForPlacements: true,
        }
      }, (response) => {
        roomCode = response.roomCode!;
        sessionToken = response.sessionToken!;
        originalPlayerId = response.playerId!;
        expect(sessionToken).not.toBe(originalSocketId);
        expect(originalPlayerId).not.toBe(originalSocketId);
        resolve();
      });
    });

    client1.disconnect();

    const reconnectClient = ioClient(SERVER_URL, { autoConnect: false }) as TestSocket;
    
    await new Promise<void>((resolve) => {
      reconnectClient.on('connect', resolve);
      reconnectClient.connect();
    });

    const newSocketId = reconnectClient.id;
    expect(newSocketId).not.toBe(originalSocketId);

    await new Promise<void>((resolve) => {
      reconnectClient.emit('room:join', {
        roomCode,
        displayName: 'Player 1 Reconnected',
        sessionToken,
      }, (response) => {
        expect(response.success).toBe(true);
        expect(response.isReconnect).toBe(true);
        expect(response.sessionToken).toBe(sessionToken);
        expect(response.playerId).toBe(originalPlayerId);
        expect(response.playerId).not.toBe(reconnectClient.id);
        expect(sessionToken).not.toBe(newSocketId);
        expect(originalPlayerId).not.toBe(newSocketId);
        resolve();
      });
    });

    reconnectClient.disconnect();
  });

  it('should handle kill client mid-game -> grace -> AI substitution', async () => {
    const client1 = ioClient(SERVER_URL, { autoConnect: false }) as TestSocket;
    const client2 = ioClient(SERVER_URL, { autoConnect: false }) as TestSocket;

    await new Promise<void>((resolve) => {
      let connected = 0;
      const checkBothConnected = () => {
        connected++;
        if (connected === 2) resolve();
      };
      client1.on('connect', checkBothConnected);
      client2.on('connect', checkBothConnected);
      client1.connect();
      client2.connect();
    });

    let roomCode: string;
    let currentGameState: GameState | null = null;
    let playerStatuses: Map<string, string> = new Map();
    let aiMoveCount = 0;

    client1.on('game:state', (state: GameState) => {
      currentGameState = state;
    });

    client2.on('game:state', (state: GameState) => {
      currentGameState = state;
    });

    client1.on('player:statusChanged', (payload: PlayerStatusChangedPayload) => {
      playerStatuses.set(payload.playerId, payload.status);
    });

    client2.on('player:statusChanged', (payload: PlayerStatusChangedPayload) => {
      playerStatuses.set(payload.playerId, payload.status);
    });

    const moveListener = (payload: TokenMovedPayload) => {
      aiMoveCount++;
    };

    client1.on('game:tokenMoved', moveListener);
    client2.on('game:tokenMoved', moveListener);

    await new Promise<void>((resolve) => {
      client1.emit('room:create', {
        displayName: 'Player 1',
        houseRules: {
          maxConsecutiveSixes: 2,
          extraRollOnCapture: false,
          blockadeCanMoveTogether: false,
          exactFinishBonus: false,
          playForPlacements: true,
        }
      }, (response) => {
        roomCode = response.roomCode!;
        client1.sessionToken = response.sessionToken;
        client1.playerId = response.playerId;
        resolve();
      });
    });

    await new Promise<void>((resolve) => {
      client2.emit('room:join', {
        roomCode,
        displayName: 'Player 2',
      }, (response) => {
        client2.sessionToken = response.sessionToken;
        client2.playerId = response.playerId;
        resolve();
      });
    });

    client1.emit('room:ready');

    await new Promise<void>((resolve) => {
      const checkState = () => {
        if (currentGameState && currentGameState.phase === 'awaiting_roll') {
          resolve();
        } else {
          setTimeout(checkState, 20);
        }
      };
      setTimeout(checkState, 10);
    });

    const turnClient = currentGameState!.turn === 'red' ? client1 : client2;
    const activeClient = turnClient === client1 ? client2 : client1;
    const disconnectedPlayerId = turnClient.playerId!;

    await new Promise<void>((resolve) => {
      turnClient.emit('game:roll', {}, (response) => {
        resolve();
      });
    });

    await new Promise(resolve => setTimeout(resolve, 200));

    console.log(`Kill client mid-game (disconnecting ${turnClient === client1 ? 'player 1' : 'player 2'})`);
    turnClient.disconnect();

    await new Promise(resolve => setTimeout(resolve, 100));

    expect(playerStatuses.get(disconnectedPlayerId)).toBe('reconnecting');
    console.log('✓ Player status: reconnecting');

    console.log(`Waiting ${TEST_GRACE_MS}ms for grace period to expire...`);
    await new Promise(resolve => setTimeout(resolve, TEST_GRACE_MS + 100));

    expect(playerStatuses.get(disconnectedPlayerId)).toBe('ai-substitute');
    console.log('✓ Player status after grace: ai-substitute');

    const maxWait = 3000;
    const startWait = Date.now();
    
    await new Promise<void>((resolve) => {
      const checkAIMoves = () => {
        const elapsed = Date.now() - startWait;
        if (aiMoveCount > 0 || elapsed > maxWait) {
          resolve();
        } else {
          setTimeout(checkAIMoves, 100);
        }
      };
      setTimeout(checkAIMoves, TEST_AI_DELAY_MS * 2);
    });

    console.log(`AI move count after ${Date.now() - startWait}ms: ${aiMoveCount}`);
    expect(playerStatuses.get(disconnectedPlayerId)).toBe('ai-substitute');
    console.log('✓ AI substitute mode confirmed (server authority maintained)');

    activeClient.disconnect();
  }, 15000);

  it('should handle kill client mid-game -> rejoin within grace', async () => {
    const client1 = ioClient(SERVER_URL, { autoConnect: false }) as TestSocket;
    const client2 = ioClient(SERVER_URL, { autoConnect: false }) as TestSocket;

    await new Promise<void>((resolve) => {
      let connected = 0;
      const checkBothConnected = () => {
        connected++;
        if (connected === 2) resolve();
      };
      client1.on('connect', checkBothConnected);
      client2.on('connect', checkBothConnected);
      client1.connect();
      client2.connect();
    });

    let roomCode: string;
    let currentGameState: GameState | null = null;
    let playerStatuses: Map<string, string> = new Map();

    client1.on('game:state', (state: GameState) => {
      currentGameState = state;
    });

    client2.on('game:state', (state: GameState) => {
      currentGameState = state;
    });

    client1.on('player:statusChanged', (payload: PlayerStatusChangedPayload) => {
      playerStatuses.set(payload.playerId, payload.status);
    });

    client2.on('player:statusChanged', (payload: PlayerStatusChangedPayload) => {
      playerStatuses.set(payload.playerId, payload.status);
    });

    await new Promise<void>((resolve) => {
      client1.emit('room:create', {
        displayName: 'Player 1',
        houseRules: {
          maxConsecutiveSixes: 2,
          extraRollOnCapture: false,
          blockadeCanMoveTogether: false,
          exactFinishBonus: false,
          playForPlacements: true,
        }
      }, (response) => {
        roomCode = response.roomCode!;
        client1.sessionToken = response.sessionToken;
        client1.playerId = response.playerId;
        resolve();
      });
    });

    await new Promise<void>((resolve) => {
      client2.emit('room:join', {
        roomCode,
        displayName: 'Player 2',
      }, (response) => {
        client2.sessionToken = response.sessionToken;
        client2.playerId = response.playerId;
        resolve();
      });
    });

    client1.emit('room:ready');

    await new Promise<void>((resolve) => {
      const checkState = () => {
        if (currentGameState && currentGameState.phase === 'awaiting_roll') {
          resolve();
        } else {
          setTimeout(checkState, 20);
        }
      };
      setTimeout(checkState, 10);
    });

    const turnClient = currentGameState!.turn === 'red' ? client1 : client2;
    const savedSessionToken = turnClient.sessionToken;
    const savedPlayerId = turnClient.playerId!;

    await new Promise<void>((resolve) => {
      turnClient.emit('game:roll', {}, (response) => {
        resolve();
      });
    });

    await new Promise(resolve => setTimeout(resolve, 200));

    console.log('Kill client mid-game (disconnect)');
    turnClient.disconnect();

    await new Promise(resolve => setTimeout(resolve, 100));

    expect(playerStatuses.get(savedPlayerId)).toBe('reconnecting');
    console.log('✓ Player status: reconnecting');

    console.log('Rejoining within grace period...');
    const reconnectClient = ioClient(SERVER_URL, { autoConnect: false }) as TestSocket;
    
    let resyncedGameState: GameState | null = null;

    reconnectClient.on('game:state', (state: GameState) => {
      resyncedGameState = state;
    });

    reconnectClient.on('player:statusChanged', (payload: PlayerStatusChangedPayload) => {
      playerStatuses.set(payload.playerId, payload.status);
    });

    await new Promise<void>((resolve) => {
      reconnectClient.on('connect', resolve);
      reconnectClient.connect();
    });

    await new Promise<void>((resolve) => {
      reconnectClient.emit('room:join', {
        roomCode,
        displayName: 'Player 1',
        sessionToken: savedSessionToken,
      }, (response) => {
        expect(response.success).toBe(true);
        expect(response.isReconnect).toBe(true);
        expect(response.playerId).toBe(savedPlayerId);
        resolve();
      });
    });

    await new Promise(resolve => setTimeout(resolve, 200));

    expect(playerStatuses.get(savedPlayerId)).toBe('connected');
    console.log('✓ Player status after rejoin: connected');

    expect(resyncedGameState).toBeTruthy();
    console.log('✓ Full GameState resync received');

    await new Promise(resolve => setTimeout(resolve, TEST_GRACE_MS + 200));

    expect(playerStatuses.get(savedPlayerId)).not.toBe('ai-substitute');
    console.log('✓ Grace canceled, no AI substitution');

    reconnectClient.disconnect();
    client1.disconnect();
    client2.disconnect();
  }, 10000);
});
