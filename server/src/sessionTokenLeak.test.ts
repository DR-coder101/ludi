import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { io as ioClient, type Socket } from 'socket.io-client';
import type {
  ClientToServerEvents,
  HouseRules,
  RoomCreateResponse,
  RoomJoinResponse,
  ServerToClientEvents,
} from '@ludi/protocol';
import { createLudiServer } from './server.js';

type TestSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const HOUSE_RULES: HouseRules = {
  maxConsecutiveSixes: 2,
  extraRollOnCapture: false,
  blockadeCanMoveTogether: false,
  exactFinishBonus: false,
  playForPlacements: true,
};

function connectCapturing(url: string): { socket: TestSocket; events: Array<{ event: string; args: unknown[] }> } {
  const events: Array<{ event: string; args: unknown[] }> = [];
  const socket = ioClient(url, {
    transports: ['websocket'],
    reconnection: false,
    autoConnect: false,
  }) as TestSocket;
  socket.onAny((event, ...args) => {
    events.push({ event, args });
  });
  return { socket, events };
}

async function waitForConnect(socket: TestSocket): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    socket.once('connect', () => resolve());
    socket.once('connect_error', reject);
    setTimeout(() => reject(new Error('connect timeout')), 3000);
    socket.connect();
  });
}

function assertNoRegisteredTokenOnWire(
  events: Array<{ event: string; args: unknown[] }>,
  tokens: string[],
): void {
  const dump = JSON.stringify(events);
  for (const token of tokens) {
    expect(dump, `broadcast dump leaked sessionToken ${token}`).not.toContain(token);
  }
}

describe('sessionToken must not leave on shared room or game payloads', () => {
  let server: ReturnType<typeof createLudiServer>;
  let url: string;

  beforeAll(async () => {
    server = createLudiServer({ port: 0 });
    await server.start();
    const address = server.httpServer.address();
    if (typeof address !== 'object' || !address) {
      throw new Error('Failed to get server address');
    }
    url = `http://127.0.0.1:${address.port}`;
  });

  afterAll(async () => {
    await server.stop();
  });

  it('keeps each caller token private to create/join/reconnect acks and off every broadcast', async () => {
    const hostCap = connectCapturing(url);
    const guestCap = connectCapturing(url);
    await waitForConnect(hostCap.socket);
    await waitForConnect(guestCap.socket);

    const created = await new Promise<RoomCreateResponse>((resolve) => {
      hostCap.socket.emit(
        'room:create',
        { displayName: 'Host', houseRules: HOUSE_RULES },
        resolve,
      );
    });
    expect(created.success).toBe(true);
    expect(created.sessionToken).toMatch(/^[a-f0-9]{64}$/);
    const hostToken = created.sessionToken!;
    const roomCode = created.roomCode!;

    const joined = await new Promise<RoomJoinResponse>((resolve) => {
      guestCap.socket.emit(
        'room:join',
        { roomCode, displayName: 'Guest' },
        resolve,
      );
    });
    expect(joined.success).toBe(true);
    expect(joined.sessionToken).toMatch(/^[a-f0-9]{64}$/);
    expect(joined.sessionToken).not.toBe(hostToken);
    const guestToken = joined.sessionToken!;

    await new Promise<void>((resolve) => {
      hostCap.socket.emit('room:selectSeat', { color: 'blue' }, () => resolve());
    });
    guestCap.socket.emit('room:requestState');
    hostCap.socket.emit('room:ready');

    await new Promise((resolve) => setTimeout(resolve, 200));

    const tokens = [hostToken, guestToken];
    assertNoRegisteredTokenOnWire(hostCap.events, tokens);
    assertNoRegisteredTokenOnWire(guestCap.events, tokens);

    guestCap.socket.disconnect();
    await new Promise((resolve) => setTimeout(resolve, 100));
    assertNoRegisteredTokenOnWire(hostCap.events, tokens);

    const reconnectCap = connectCapturing(url);
    await waitForConnect(reconnectCap.socket);
    const reconnected = await new Promise<RoomJoinResponse>((resolve) => {
      reconnectCap.socket.emit(
        'room:join',
        { roomCode, displayName: 'Guest', sessionToken: guestToken },
        resolve,
      );
    });
    expect(reconnected.success).toBe(true);
    expect(reconnected.isReconnect).toBe(true);
    expect(reconnected.sessionToken).toBe(guestToken);
    expect(reconnected.playerId).toBe(joined.playerId);

    await new Promise((resolve) => setTimeout(resolve, 100));
    assertNoRegisteredTokenOnWire(hostCap.events, tokens);
    assertNoRegisteredTokenOnWire(reconnectCap.events, tokens);

    reconnectCap.socket.disconnect();
    hostCap.socket.disconnect();
  });
});
