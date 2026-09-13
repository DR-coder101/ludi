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

export const TokenPosSchema = z.union([
  z.object({ zone: z.literal('yard') }),
  z.object({ zone: z.literal('track'), cell: z.number() }),
  z.object({ zone: z.literal('homeColumn'), step: z.number() }),
  z.object({ zone: z.literal('home') }),
]);
export type TokenPos = z.infer<typeof TokenPosSchema>;

export const TokenStateSchema = z.object({
  color: ColorSchema,
  index: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
  pos: TokenPosSchema,
});
export type TokenState = z.infer<typeof TokenStateSchema>;

export const GameConfigSchema = z.object({
  playerColors: z.array(ColorSchema),
  houseRules: HouseRulesSchema,
});
export type GameConfig = z.infer<typeof GameConfigSchema>;

export const GameStateSchema = z.object({
  config: GameConfigSchema,
  tokens: z.array(TokenStateSchema),
  turn: ColorSchema,
  phase: z.enum(['awaiting_roll', 'awaiting_move', 'finished']),
  dice: z.number().nullable(),
  consecutiveSixes: z.number(),
  winner: ColorSchema.nullable(),
  placements: z.array(ColorSchema),
});
export type GameState = z.infer<typeof GameStateSchema>;

export const GameRollPayloadSchema = z.object({});
export type GameRollPayload = z.infer<typeof GameRollPayloadSchema>;

export const GameMovePayloadSchema = z.object({
  tokenIndex: z.number().int().min(0),
});
export type GameMovePayload = z.infer<typeof GameMovePayloadSchema>;

export const LegalMoveSchema = z.object({
  tokenIndex: z.number(),
  resulting: TokenPosSchema,
  captures: z.object({
    color: ColorSchema,
    index: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
  }).optional(),
});
export type LegalMove = z.infer<typeof LegalMoveSchema>;

export interface GameRollResponse {
  success: boolean;
  error?: string;
}

export interface GameMoveResponse {
  success: boolean;
  error?: string;
  hint?: string;
}

export interface TokenMovedPayload {
  playerId: PlayerId;
  tokenIndex: number;
  from: TokenPos;
  to: TokenPos;
  captured?: {
    color: Color;
    index: 0 | 1 | 2 | 3;
  };
}

export interface GameOverPayload {
  winnerId: PlayerId;
  placements: { playerId: PlayerId; color: Color; placement: number }[];
}

export interface DiceRolledPayload {
  playerId: PlayerId;
  value: number;
  legalMoves: LegalMove[];
}

export interface TurnChangedPayload {
  playerId: PlayerId;
  deadlineTs: number;
}

export interface ClientToServerEvents {
  'room:create': (payload: RoomCreatePayload, callback: (response: RoomCreateResponse) => void) => void;
  'room:join': (payload: RoomJoinPayload, callback: (response: RoomJoinResponse) => void) => void;
  'room:ready': () => void;
  'room:leave': () => void;
  'game:roll': (payload: GameRollPayload, callback: (response: GameRollResponse) => void) => void;
  'game:move': (payload: GameMovePayload, callback: (response: GameMoveResponse) => void) => void;
  'chat:send': (message: string) => void;
}

export interface ServerToClientEvents {
  'room:state': (state: RoomState) => void;
  'game:state': (state: GameState) => void;
  'game:diceRolled': (payload: DiceRolledPayload) => void;
  'game:tokenMoved': (payload: TokenMovedPayload) => void;
  'game:turnChanged': (payload: TurnChangedPayload) => void;
  'game:over': (payload: GameOverPayload) => void;
  'chat:message': (message: string, playerId: PlayerId) => void;
  'player:connectionChanged': (playerId: PlayerId, connected: boolean) => void;
  'error': (message: string) => void;
  pong: (message: string) => void;
}
