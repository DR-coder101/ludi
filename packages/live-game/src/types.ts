import type { Color, GameState, TokenPos } from '@ludi/rules';

export type LivePhase = 'INTRO' | 'WAITING' | 'COUNTDOWN' | 'PLAYING' | 'WINNER';

export type TownId = 'kingston' | 'ochoRios' | 'montegoBay' | 'negril';

export type Occupant = {
  platform: string;
  userId: string;
  displayName: string;
};

export type Seat = {
  town: TownId;
  color: Color;
  hex: string;
  borderHex: string | null;
  occupant: Occupant | null;
};

export type ChatInbound = {
  platform: string;
  userId: string;
  displayName: string;
  text: string;
  receivedAt: number;
};

export type AdminAction =
  | { type: 'pause' }
  | { type: 'resume' }
  | { type: 'skipTurn' }
  | { type: 'newGame' }
  | { type: 'kick'; userId: string };

export type GiftInbound = {
  platform: string;
  userId: string;
  displayName: string;
  giftId: string;
  count: number;
};

export type LiveEvent =
  | { type: 'joined'; userId: string; displayName: string; town: TownId }
  | { type: 'turnStarted'; userId: string | null; color: Color; town: TownId; endsAt: number }
  | { type: 'rolled'; userId: string | null; values: [number, number] }
  | { type: 'moved'; userId: string | null; tokenIndex: number; path: TokenPos[] }
  | { type: 'captured'; userId: string | null; text: string }
  | { type: 'timeout'; userId: string | null }
  | { type: 'winner'; userId: string | null; town: TownId; displayName: string | null }
  | { type: 'stay'; userId: string }
  | { type: 'leave'; userId: string }
  | { type: 'gift'; userId: string; displayName: string; giftId: string; count: number; text: string }
  | { type: 'countdown'; beat: 3 | 2 | 1 }
  | { type: 'paused' }
  | { type: 'resumed' }
  | { type: 'kicked'; userId: string }
  | { type: 'phase'; phase: LivePhase };

export type LiveGameState = {
  phase: LivePhase;
  seats: [Seat, Seat, Seat, Seat];
  queue: Occupant[];
  sitOut: string[];
  paused: boolean;
  phaseEndsAt: number | null;
  turnEndsAt: number | null;
  winnerUserId: string | null;
  winnerStay: null | boolean;
  game: GameState | null;
  countdownBeat: 3 | 2 | 1 | null;
};

export type Clock = {
  now: () => number;
};

export type Rng = () => number;

export type CommandWords = {
  join: string;
  roll: string;
  move: string;
  stay: string;
  leave: string;
};

export type LiveConfig = {
  clock?: Clock;
  rng?: Rng;
  introMs?: number;
  countdownMs?: number;
  turnMs?: number;
  winnerMs?: number;
  commandPrefix?: string;
  commands?: Partial<CommandWords>;
};

export type LiveGame = {
  handleChat: (inbound: ChatInbound) => LiveEvent[];
  handleAdmin: (action: AdminAction) => LiveEvent[];
  handleGift: (gift: GiftInbound) => LiveEvent[];
  tick: (nowMs?: number) => LiveEvent[];
  snapshot: () => LiveGameState;
};

export type ParsedChat =
  | { kind: 'join' }
  | { kind: 'roll' }
  | { kind: 'move'; piece: 1 | 2 | 3 | 4 }
  | { kind: 'stay' }
  | { kind: 'leave' }
  | { kind: 'none' };
