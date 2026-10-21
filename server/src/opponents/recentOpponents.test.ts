import { describe, expect, it } from 'vitest';
import { createRecentOpponentsStore } from './recentOpponents.js';

describe('recent opponents', () => {
  it('returns the last 20 and supports block and remove', () => {
    const store = createRecentOpponentsStore();
    for (let i = 1; i <= 22; i++) {
      store.recordMatch([
        { id: 'p0', displayName: 'Me' },
        { id: `p${i}`, displayName: `Player ${i}` },
      ]);
    }
    const listed = store.list('p0');
    expect(listed).toHaveLength(20);
    expect(listed[0]?.id).toBe('p22');
    expect(listed.map((row) => row.id)).not.toContain('p1');
    expect(listed.map((row) => row.id)).not.toContain('p2');
    expect(store.block('p0', 'p22')).toBe(true);
    expect(store.list('p0')[0]).toEqual({
      id: 'p22',
      displayName: 'Player 22',
      blocked: true,
    });
    expect(store.remove('p0', 'p22')).toBe(true);
    expect(store.list('p0').some((row) => row.id === 'p22')).toBe(false);
    expect(store.list('p0')).toHaveLength(20);
    expect(store.list('p0')[0]?.id).toBe('p21');
  });
});
