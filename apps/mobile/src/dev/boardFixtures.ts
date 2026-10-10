import { createGame, type Color, type GameState, type TokenPos } from '@ludi/rules';
import type { SeatVideo } from '../components/video/seatVideo';
import type { CallBarProps } from '../components/video/CallBar';

export type FixtureName = 'start' | 'mid' | 'video';

/** Players from the approved mockups, by engine colour. */
export const MOCKUP_NAMES: Record<Color, string> = {
  red: 'Dean',
  green: 'Shanice',
  yellow: 'Marcus',
  blue: 'Andre',
};

const yard: TokenPos = { zone: 'yard' };
const track = (cell: number): TokenPos => ({ zone: 'track', cell });
const column = (step: number): TokenPos => ({ zone: 'homeColumn', step });

/**
 * Engine positions behind board-midgame.png (grid cells from lib.js `pieces`):
 * red (16,10)=track 1, (13,9)=home step 5; green (8,14)=20, (15,8)=62;
 * gold (4,8)=37, (10,4)=54; black ×2 on (8,5)=43, (3,10)=28.
 */
const MID_POSITIONS: Record<Color, TokenPos[]> = {
  red: [track(1), column(5), yard, yard],
  green: [track(20), track(62), yard, yard],
  yellow: [track(37), track(54), yard, yard],
  blue: [track(43), track(43), track(28), yard],
};

/** The mid fixture's throw: a 6 (bonus roll earned) and a 3, both still to play. */
export const MID_ROLL: [number, number] = [6, 3];

/** Approved 2026-10-09 video mockup: a 6 and a 2, pieces still in the yards. */
export const VIDEO_ROLL: [number, number] = [6, 2];

/** Four tile states from the 2026-10-09 board video mockup. */
export const VIDEO_FIXTURE_SEATS: Record<Color, SeatVideo> = {
  yellow: { kind: 'live', name: 'Marcus', you: false, muted: false, speaking: true },
  green: { kind: 'live', name: 'Shanice', you: false, muted: false, speaking: false },
  blue: { kind: 'camOff', name: 'Andre', you: false, muted: true, speaking: false, initial: 'A' },
  red: { kind: 'live', name: 'Dean', you: true, muted: false, speaking: false },
};

export const VIDEO_FIXTURE_CALL: CallBarProps = {
  liveCount: 4,
  micOn: true,
  cameraOn: true,
  onMic: () => {},
  onCamera: () => {},
  onFlip: () => {},
  onLeave: () => {},
};

export function boardFixture(name: FixtureName): GameState {
  const base = createGame({
    playerColors: ['red', 'green', 'yellow', 'blue'],
    houseRules: {
      maxConsecutiveSixes: 2,
      extraRollOnCapture: false,
      blockadeCanMoveTogether: false,
      exactFinishBonus: false,
      playForPlacements: false,
    },
  });
  if (name === 'start') return base;
  if (name === 'video') {
    return {
      ...base,
      phase: 'awaiting_move',
      dice: [
        { value: VIDEO_ROLL[0], used: false },
        { value: VIDEO_ROLL[1], used: false },
      ],
    };
  }
  return {
    ...base,
    tokens: base.tokens.map((t) => ({ ...t, pos: MID_POSITIONS[t.color][t.index] })),
    phase: 'awaiting_move',
    dice: [
      { value: MID_ROLL[0], used: false },
      { value: MID_ROLL[1], used: false },
    ],
    consecutiveSixes: 1,
    extraRollEarned: true,
  };
}
