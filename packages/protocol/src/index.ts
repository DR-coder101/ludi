/**
 * @ludi/protocol - Shared types and event definitions
 * 
 * Protocol types shared between client and server.
 * Defines Socket.IO event payloads and game state structures.
 */

// Placeholder types - will be expanded in Phase 3

export type PlayerId = string;

export type RoomId = string;

export interface Player {
  id: PlayerId;
  name: string;
  color: 'red' | 'green' | 'yellow' | 'blue';
  connected: boolean;
}

// Client → Server events (placeholder)
export interface ClientToServerEvents {
  'room:create': () => void;
  'room:join': (roomId: RoomId) => void;
  'room:ready': () => void;
  'room:leave': () => void;
  'game:roll': () => void;
  'game:move': (tokenIndex: number) => void;
  'chat:send': (message: string) => void;
}

// Server → Client events (placeholder)
export interface ServerToClientEvents {
  'room:state': (state: unknown) => void;
  'game:state': (state: unknown) => void;
  'game:diceRolled': (value: number, playerId: PlayerId) => void;
  'game:tokenMoved': (data: unknown) => void;
  'game:turnChanged': (playerId: PlayerId) => void;
  'game:over': (winnerId: PlayerId) => void;
  'chat:message': (message: string, playerId: PlayerId) => void;
  'player:connectionChanged': (playerId: PlayerId, connected: boolean) => void;
  pong: (message: string) => void;
}
