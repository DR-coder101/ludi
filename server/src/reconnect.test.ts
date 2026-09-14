import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { io as ioClient, Socket as ClientSocket } from 'socket.io-client';
import { createLudiServer } from './server.js';
import type { 
  RoomState, 
  GameState, 
  PlayerStatusChangedPayload,
} from '@ludi/protocol';

interface TestSocket extends ClientSocket {
  sessionToken?: string;
}

const PORT = 3010;
const SERVER_URL = `http://localhost:${PORT}`;

describe('M3.5 Reconnect & Dropout', () => {
  let server: ReturnType<typeof createLudiServer>;

  beforeAll(async () => {
    server = createLudiServer(PORT);
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
        roomCode = response.roomCode!;
        client1.sessionToken = response.sessionToken;
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
        resolve();
      });
    });

    client1.disconnect();

    const reconnectClient = ioClient(SERVER_URL, { autoConnect: false }) as TestSocket;
    
    await new Promise<void>((resolve) => {
      reconnectClient.on('connect', resolve);
      reconnectClient.connect();
    });

    await new Promise<void>((resolve) => {
      reconnectClient.emit('room:join', {
        roomCode,
        displayName: 'Player 1 Reconnected',
        sessionToken,
      }, (response) => {
        expect(response.success).toBe(true);
        expect(response.isReconnect).toBe(true);
        expect(response.sessionToken).toBe(sessionToken);
        resolve();
      });
    });

    reconnectClient.disconnect();
  });

  it.skip('should handle disconnect with 60s grace period and AI substitution', async () => {
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
        expect(response.success).toBe(true);
        expect(response.roomCode).toBeTruthy();
        expect(response.sessionToken).toBeTruthy();
        roomCode = response.roomCode!;
        client1.sessionToken = response.sessionToken;
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
        client2.sessionToken = response.sessionToken;
        resolve();
      });
    });

    client1.emit('room:ready');

    await new Promise<void>((resolve) => {
      const checkState = () => {
        if (currentGameState && currentGameState.phase === 'awaiting_roll') {
          resolve();
        } else {
          setTimeout(checkState, 50);
        }
      };
      setTimeout(checkState, 10);
    });

    const turnClient = currentGameState!.turn === 'red' ? client1 : client2;
    const disconnectedId = turnClient.id!;

    await new Promise<void>((resolve) => {
      turnClient.emit('game:roll', {}, (response) => {
        expect(response.success).toBe(true);
        resolve();
      });
    });

    await new Promise<void>((resolve) => {
      const checkState = () => {
        if (currentGameState && currentGameState.phase === 'awaiting_move') {
          resolve();
        } else {
          setTimeout(checkState, 50);
        }
      };
      setTimeout(checkState, 10);
    });

    expect(currentGameState?.phase).toBe('awaiting_move');

    console.log(`Disconnecting client mid-game`);
    turnClient.disconnect();

    await new Promise(resolve => setTimeout(resolve, 500));

    expect(playerStatuses.get(disconnectedId)).toBe('reconnecting');

    console.log('Waiting for 60s grace period to expire (AI substitution)...');
    await new Promise(resolve => setTimeout(resolve, 61000));

    expect(playerStatuses.get(disconnectedId)).toBe('ai-substitute');

    let aiMoves = 0;
    const moveListener = () => { aiMoves++; };
    const activeClient = turnClient === client1 ? client2 : client1;
    activeClient.on('game:tokenMoved', moveListener);

    await new Promise(resolve => setTimeout(resolve, 3000));

    expect(aiMoves).toBeGreaterThan(0);

    activeClient.off('game:tokenMoved', moveListener);
    activeClient.disconnect();

    if (turnClient.connected) {
      turnClient.disconnect();
    }
  }, 80000);

  it.skip('should handle reconnect within grace period', async () => {
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
        expect(response.success).toBe(true);
        roomCode = response.roomCode!;
        client1.sessionToken = response.sessionToken;
        resolve();
      });
    });

    await new Promise<void>((resolve) => {
      client2.emit('room:join', {
        roomCode,
        displayName: 'Player 2',
      }, (response) => {
        expect(response.success).toBe(true);
        client2.sessionToken = response.sessionToken;
        resolve();
      });
    });

    client1.emit('room:ready');

    await new Promise<void>((resolve) => {
      const checkState = () => {
        if (currentGameState && currentGameState.phase === 'awaiting_roll') {
          resolve();
        } else {
          setTimeout(checkState, 50);
        }
      };
      setTimeout(checkState, 10);
    });

    const turnClient = currentGameState!.turn === 'red' ? client1 : client2;
    const savedSessionToken = turnClient.sessionToken;
    const disconnectedId = turnClient.id!;

    await new Promise<void>((resolve) => {
      turnClient.emit('game:roll', {}, (response) => {
        expect(response.success).toBe(true);
        resolve();
      });
    });

    await new Promise<void>((resolve) => {
      const checkState = () => {
        if (currentGameState && currentGameState.phase === 'awaiting_move') {
          resolve();
        } else {
          setTimeout(checkState, 50);
        }
      };
      setTimeout(checkState, 10);
    });

    expect(currentGameState?.phase).toBe('awaiting_move');

    console.log('Disconnecting client mid-game');
    turnClient.disconnect();

    await new Promise(resolve => setTimeout(resolve, 500));

    expect(playerStatuses.get(disconnectedId)).toBe('reconnecting');

    console.log('Reconnecting within grace period...');
    const reconnectClient = ioClient(SERVER_URL, { autoConnect: false }) as TestSocket;
    
    await new Promise<void>((resolve) => {
      reconnectClient.on('connect', resolve);
      reconnectClient.connect();
    });

    reconnectClient.on('game:state', (state: GameState) => {
      currentGameState = state;
    });

    reconnectClient.on('player:statusChanged', (payload: PlayerStatusChangedPayload) => {
      playerStatuses.set(payload.playerId, payload.status);
    });

    await new Promise<void>((resolve) => {
      reconnectClient.emit('room:join', {
        roomCode,
        displayName: 'Player 1',
        sessionToken: savedSessionToken,
      }, (response) => {
        expect(response.success).toBe(true);
        expect(response.isReconnect).toBe(true);
        resolve();
      });
    });

    await new Promise(resolve => setTimeout(resolve, 500));

    expect(playerStatuses.get(reconnectClient.id!)).toBe('connected');
    expect(currentGameState).toBeTruthy();
    expect(currentGameState?.phase).toBe('awaiting_move');

    reconnectClient.disconnect();
    if (client1.connected) client1.disconnect();
    if (client2.connected) client2.disconnect();
  }, 30000);
});
