/**
 * @ludi/protocol - Shared types and event definitions
 * 
 * Protocol types shared between client and server.
 * Defines Socket.IO event payloads and game state structures.
 */

import { z } from 'zod';

export type PlayerId = string;
export type RoomCode = string;

export const ColorSchema = z.enum(['red', 'green', 'yellow', 'blue']);
export type Color = z.infer<typeof ColorSchema>;

export const HouseRulesSchema = z.object({
  maxConsecutiveSixes: z.union([z.literal(2), z.literal(3), z.literal('unlimited')]),
  extraRollOnCapture: z.boolean(),
  blockadeCanMoveTogether: z.boolean(),
  exactFinishBonus: z.boolean(),
  playForPlacements: z.boolean(),
});
export type HouseRules = z.infer<typeof HouseRulesSchema>;

export const PlayerSchema = z.object({
  id: z.string(),
  displayName: z.string().min(1).max(50),
  color: ColorSchema,
  connected: z.boolean(),
  isHost: z.boolean(),
});
export type Player = z.infer<typeof PlayerSchema>;

export const RoomCreatePayloadSchema = z.object({
  displayName: z.string().min(1).max(50),
  houseRules: HouseRulesSchema,
});
export type RoomCreatePayload = z.infer<typeof RoomCreatePayloadSchema>;

export const RoomJoinPayloadSchema = z.object({
  roomCode: z.string().length(6),
  displayName: z.string().min(1).max(50),
});
export type RoomJoinPayload = z.infer<typeof RoomJoinPayloadSchema>;

export const RoomStateSchema = z.object({
  roomCode: z.string(),
  players: z.array(PlayerSchema),
  houseRules: HouseRulesSchema,
  status: z.enum(['lobby', 'ready_check', 'countdown', 'in_progress', 'finished', 'closed']),
  hostId: z.string(),
});
export type RoomState = z.infer<typeof RoomStateSchema>;

export interface RoomCreateResponse {
  success: boolean;
  roomCode?: string;
  error?: string;
}

export interface RoomJoinResponse {
  success: boolean;
  error?: string;
}

export interface ClientToServerEvents {
  'room:create': (payload: RoomCreatePayload, callback: (response: RoomCreateResponse) => void) => void;
  'room:join': (payload: RoomJoinPayload, callback: (response: RoomJoinResponse) => void) => void;
  'room:ready': () => void;
  'room:leave': () => void;
  'game:roll': () => void;
  'game:move': (tokenIndex: number) => void;
  'chat:send': (message: string) => void;
}

export interface ServerToClientEvents {
  'room:state': (state: RoomState) => void;
  'game:state': (state: unknown) => void;
  'game:diceRolled': (value: number, playerId: PlayerId) => void;
  'game:tokenMoved': (data: unknown) => void;
  'game:turnChanged': (playerId: PlayerId) => void;
  'game:over': (winnerId: PlayerId) => void;
  'chat:message': (message: string, playerId: PlayerId) => void;
  'player:connectionChanged': (playerId: PlayerId, connected: boolean) => void;
  'error': (message: string) => void;
  pong: (message: string) => void;
}
