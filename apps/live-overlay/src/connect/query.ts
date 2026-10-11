import type { DemoId } from './fixtures.js';

export type OverlayQuery = {
  demo: DemoId | null;
  safe: boolean;
  settle: boolean;
  bg: string | null;
  ws: string | null;
};

const DEMOS: readonly DemoId[] = ['intro', 'waiting', 'game', 'turn', 'winner'];

export function parseQuery(search: string): OverlayQuery {
  const q = new URLSearchParams(search);
  const raw = q.get('demo');
  const demo = DEMOS.includes(raw as DemoId) ? (raw as DemoId) : null;
  return {
    demo,
    safe: q.get('safe') === '1',
    settle: q.get('settle') === '1',
    bg: q.get('bg'),
    ws: q.get('ws') ?? q.get('server'),
  };
}
