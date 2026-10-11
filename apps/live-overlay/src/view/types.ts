import type { Color, TokenPos } from '@ludi/rules';
import type { Occupant, Seat, TownId } from '@ludi/live-game';

export type OverlayKind = 'intro' | 'waiting' | 'countdown' | 'game' | 'winner';

export type SeatView = {
  town: TownId;
  color: Color;
  hex: string;
  borderHex: string | null;
  occupant: Occupant | null;
  filled: boolean;
  handle: string | null;
  outCount: number;
  homeCount: number;
};

export type PieceView = {
  key: string;
  color: Color;
  town: TownId;
  tokenIndex: number;
  pos: TokenPos;
};

export type TurnView = {
  town: TownId;
  color: Color;
  hex: string;
  handle: string;
  possessive: string;
  endsAt: number | null;
  remainingMs: number;
  timerLabel: string;
  fillRatio: number;
};

export type ResultRow = {
  rank: '2nd' | '3rd' | '4th';
  town: TownId;
  handle: string;
  title: string;
  homeCount: number;
};

export type OverlayIntent = {
  lastWinnerName?: string | null;
  gameNumber?: number;
  showTurnCard?: boolean;
  captureText?: string | null;
  giftText?: string | null;
  now?: number;
  toast?: string | null;
};

export type OverlayView =
  | { kind: 'intro' }
  | {
      kind: 'waiting';
      seats: SeatView[];
      joined: number;
      lastWinnerName: string | null;
      toast: string | null;
      full: boolean;
    }
  | {
      kind: 'countdown';
      beat: 3 | 2 | 1;
      seats: SeatView[];
      joined: number;
    }
  | {
      kind: 'game';
      seats: SeatView[];
      pieces: PieceView[];
      turn: TurnView;
      showTurnCard: boolean;
      captureText: string | null;
      giftText: string | null;
      nextUp: string | null;
      dice: [number, number] | null;
      gameNumber: number;
    }
  | {
      kind: 'winner';
      winnerTown: TownId;
      winnerHandle: string;
      winnerHex: string;
      staySeconds: number;
      stayUrgent: boolean;
      seatsOpen: number;
      results: ResultRow[];
      nextUp: string | null;
      gameNumber: number;
    };

export type { Occupant, Seat, TownId };
