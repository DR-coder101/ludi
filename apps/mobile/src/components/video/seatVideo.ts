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
    }
  | {
      kind: 'live';
      name: string;
      you: boolean;
      muted: boolean;
      speaking: boolean;
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
