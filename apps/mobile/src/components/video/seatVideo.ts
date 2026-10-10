import type { Color, Player } from '@ludi/protocol';

export type SeatVideoFacts = {
  seated: boolean;
  substitute: boolean;
  participant: boolean;
  cameraOn: boolean;
  micOn: boolean;
  speaking: boolean;
  local: boolean;
  displayName: string;
};

export type SeatVideo =
  | { kind: 'none' }
  | {
      kind: 'camOff';
      name: string;
      you: boolean;
      muted: boolean;
      speaking: boolean;
      initial: string;
      identity?: string;
    }
  | {
      kind: 'live';
      name: string;
      you: boolean;
      muted: boolean;
      speaking: boolean;
      identity?: string;
    };

function initialOf(name: string): string {
  const letter = name.trim().charAt(0);
  return letter ? letter.toUpperCase() : '?';
}

export function seatVideoAppearance(facts: SeatVideoFacts): SeatVideo {
  if (!facts.seated || facts.substitute || !facts.participant) {
    return { kind: 'none' };
  }
  const shared = {
    name: facts.displayName,
    you: facts.local,
    muted: !facts.micOn,
    speaking: facts.speaking,
  };
  if (!facts.cameraOn) {
    return { kind: 'camOff', ...shared, initial: initialOf(facts.displayName) };
  }
  return { kind: 'live', ...shared };
}

export function tileLabel(seat: SeatVideo): string {
  if (seat.kind === 'none') return '';
  return seat.you ? `${seat.name} · You` : seat.name;
}

export type CallParticipant = {
  cameraOn: boolean;
  micOn: boolean;
  speaking: boolean;
};

export function seatsFromCall(input: {
  players: Pick<Player, 'id' | 'color' | 'displayName' | 'status'>[];
  myPlayerId: string;
  inCall: boolean;
  participants: Partial<Record<string, CallParticipant>>;
  local: CallParticipant;
}): Partial<Record<Color, SeatVideo>> {
  if (!input.inCall) return {};
  const out: Partial<Record<Color, SeatVideo>> = {};
  for (const player of input.players) {
    const local = player.id === input.myPlayerId;
    const live = input.participants[player.id] ?? (local ? input.local : undefined);
    const appearance = seatVideoAppearance({
      seated: true,
      substitute: player.status === 'ai-substitute',
      participant: !!live,
      cameraOn: live?.cameraOn ?? false,
      micOn: live?.micOn ?? false,
      speaking: live?.speaking ?? false,
      local,
      displayName: player.displayName,
    });
    out[player.color] =
      appearance.kind === 'none' ? appearance : { ...appearance, identity: player.id };
  }
  return out;
}
