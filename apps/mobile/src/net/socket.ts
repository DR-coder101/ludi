/**
 * Socket.IO singleton for Ludi client
 * Manages connection to the authoritative game server
 */

import { io, Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '@ludi/protocol';
import * as SecureStore from 'expo-secure-store';

export type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const SESSION_TOKEN_KEY = 'ludi_session_token';
const SERVER_URL = process.env.EXPO_PUBLIC_SOCKET_URL || 'http://localhost:3000';

class SocketManager {
  private socket: TypedSocket | null = null;
  private sessionToken: string | null = null;
  private reconnectListeners: Array<() => void> = [];
  private disconnectListeners: Array<() => void> = [];
  private connectListeners: Array<() => void> = [];

  async initialize(): Promise<void> {
    // Load persisted session token
    try {
      this.sessionToken = await SecureStore.getItemAsync(SESSION_TOKEN_KEY);
    } catch (error) {
      console.warn('Failed to load session token:', error);
    }
  }

  connect(): TypedSocket {
    if (this.socket?.connected) {
      return this.socket;
    }

    console.log(`[Socket] Connecting to ${SERVER_URL}`);
    
    this.socket = io(SERVER_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
      auth: this.sessionToken ? { token: this.sessionToken } : undefined,
    }) as TypedSocket;

    this.socket.on('connect', () => {
      console.log('[Socket] Connected:', this.socket?.id);
      this.connectListeners.forEach(listener => listener());
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
      this.disconnectListeners.forEach(listener => listener());
    });

    this.socket.io.on('reconnect', (attempt) => {
      console.log('[Socket] Reconnected after', attempt, 'attempts');
      this.reconnectListeners.forEach(listener => listener());
    });

    this.socket.io.on('reconnect_attempt', (attempt) => {
      console.log('[Socket] Reconnect attempt', attempt);
    });

    this.socket.io.on('reconnect_error', (error) => {
      console.error('[Socket] Reconnect error:', error.message);
    });

    this.socket.io.on('reconnect_failed', () => {
      console.error('[Socket] Reconnect failed');
    });

    return this.socket;
  }

  getSocket(): TypedSocket | null {
    return this.socket;
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  disconnect(): void {
    if (this.socket) {
      console.log('[Socket] Disconnecting');
      this.socket.disconnect();
      this.socket = null;
    }
  }

  onConnect(listener: () => void): () => void {
    this.connectListeners.push(listener);
    return () => {
      this.connectListeners = this.connectListeners.filter(l => l !== listener);
    };
  }

  onDisconnect(listener: () => void): () => void {
    this.disconnectListeners.push(listener);
    return () => {
      this.disconnectListeners = this.disconnectListeners.filter(l => l !== listener);
    };
  }

  onReconnect(listener: () => void): () => void {
    this.reconnectListeners.push(listener);
    return () => {
      this.reconnectListeners = this.reconnectListeners.filter(l => l !== listener);
    };
  }

  async saveSessionToken(token: string): Promise<void> {
    this.sessionToken = token;
    try {
      await SecureStore.setItemAsync(SESSION_TOKEN_KEY, token);
      console.log('[Socket] Session token saved:', token);
    } catch (error) {
      console.error('[Socket] Failed to save session token:', error);
    }
  }

  getSessionToken(): string | null {
    return this.sessionToken;
  }

  async clearSession(): Promise<void> {
    this.sessionToken = null;
    try {
      await SecureStore.deleteItemAsync(SESSION_TOKEN_KEY);
      console.log('[Socket] Session token cleared');
    } catch (error) {
      console.error('[Socket] Failed to clear session token:', error);
    }
  }
}

export const socketManager = new SocketManager();
