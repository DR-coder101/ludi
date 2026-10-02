import type { RoomState } from '@ludi/protocol';
import { startCta, type LobbySeat, type RoomNote, type StartCta } from '../components/lobby/lobbyModel';

/** lobby.png as drawn: seats TL, TR, BL, BR with the mockup's names and statuses. */
export const MOCKUP_LOBBY: { code: string; seats: LobbySeat[]; note: RoomNote; start: StartCta } = {
  code: '7X8K9',
  seats: [
    { color: 'yellow', name: null, status: 'Invite a friend', ready: false, you: false },
    { color: 'green', name: 'Shanice', status: 'Ready', ready: true, you: false },
    { color: 'blue', name: 'Andre', status: 'Joined', ready: false, you: false },
    { color: 'red', name: 'Dean (You)', status: 'Host · Ready', ready: true, you: true },
  ],
  note: { text: 'Expires in 14:52', tone: 'muted' },
  start: startCta(3, true),
};

/** A server-shaped room (6-character code, host on red as RoomRegistry assigns) for the live mapping. */
export const ROOM_FIXTURE: RoomState = {
  roomCode: 'K7Q2MX',
  hostId: 'dean',
  status: 'lobby',
  houseRules: {
    maxConsecutiveSixes: 2,
    extraRollOnCapture: false,
    blockadeCanMoveTogether: false,
    exactFinishBonus: false,
    playForPlacements: false,
  },
  players: [
    { id: 'dean', displayName: 'Dean', color: 'red', connected: true, isHost: true, status: 'connected' },
    { id: 'shanice', displayName: 'Shanice', color: 'green', connected: true, isHost: false, status: 'connected' },
    { id: 'marcus', displayName: 'Marcus', color: 'yellow', connected: false, isHost: false, status: 'reconnecting' },
  ],
};
