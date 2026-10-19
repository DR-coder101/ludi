import { describe, expect, it, vi } from 'vitest';
import { bindLobbySocket, leaveOnlineSession } from './onlineSession';

function fakeSocket() {
  const counts = new Map<string, number>();
  const bump = (key: string, delta: number) => {
    counts.set(key, (counts.get(key) ?? 0) + delta);
  };
  const api = {
    on(event: string) {
      bump(event, 1);
    },
    off(event: string) {
      bump(event, -1);
    },
    io: {
      on(event: string) {
        bump(`io:${event}`, 1);
      },
      off(event: string) {
        bump(`io:${event}`, -1);
      },
    },
    count: (event: string) => counts.get(event) ?? 0,
  };
  return api;
}

const handlers = {
  onRoomState: () => {},
  onGameState: () => {},
  onConnect: () => {},
  onDisconnect: () => {},
  onReconnectAttempt: () => {},
  onReconnect: () => {},
  onPlayerConnection: () => {},
  onError: () => {},
};

describe('bindLobbySocket', () => {
  it('registers connect and reconnect once and removes them on cleanup', () => {
    const socket = fakeSocket();
    const stop = bindLobbySocket(socket, handlers);
    expect(socket.count('connect')).toBe(1);
    expect(socket.count('io:reconnect')).toBe(1);
    stop();
    expect(socket.count('connect')).toBe(0);
    expect(socket.count('io:reconnect')).toBe(0);
    bindLobbySocket(socket, handlers);
    expect(socket.count('connect')).toBe(1);
  });
});

describe('leaveOnlineSession', () => {
  it('leaves the room, drops the socket, and clears session stores', async () => {
    const emit = vi.fn();
    const ports = {
      socket: {
        getSocket: () => ({ emit }),
        disconnect: vi.fn(),
        clearSession: vi.fn().mockResolvedValue(undefined),
      },
      room: { clear: vi.fn() },
      game: { clear: vi.fn() },
      video: { reset: vi.fn() },
      chat: { clear: vi.fn() },
      connection: {
        setConnected: vi.fn(),
        setReconnecting: vi.fn(),
      },
    };
    await leaveOnlineSession(ports);
    expect(emit).toHaveBeenCalledWith('room:leave');
    expect(ports.socket.disconnect).toHaveBeenCalledOnce();
    expect(ports.socket.clearSession).toHaveBeenCalledOnce();
    expect(ports.room.clear).toHaveBeenCalledOnce();
    expect(ports.video.reset).toHaveBeenCalledOnce();
    expect(ports.connection.setConnected).toHaveBeenCalledWith(false);
  });
});
