import type { MatchHistory } from '@ludi/protocol';

export function createMatchLedger() {
  const matches: MatchHistory[] = [];

  function add(match: MatchHistory): void {
    matches.push(match);
  }

  function list(): MatchHistory[] {
    return matches.slice();
  }

  return { add, list };
}

export type MatchLedger = ReturnType<typeof createMatchLedger>;
