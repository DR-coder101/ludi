import { describe, it, expect } from 'vitest';
import { createTtlCache } from './ttlCache.js';

describe('TtlCache', () => {
  it('returns cached value within TTL', () => {
    let now = 1_000;
    const cache = createTtlCache<string>({ ttlMs: 30_000, now: () => now });

    cache.set('a', 'alpha');
    expect(cache.get('a')).toBe('alpha');

    now += 29_999;
    expect(cache.get('a')).toBe('alpha');
  });

  it('expires values after TTL', () => {
    let now = 1_000;
    const cache = createTtlCache<string>({ ttlMs: 30_000, now: () => now });

    cache.set('a', 'alpha');
    now += 30_001;
    expect(cache.get('a')).toBeUndefined();
  });

  it('delete removes a key immediately', () => {
    const cache = createTtlCache<string>({ ttlMs: 30_000 });
    cache.set('a', 'alpha');
    cache.delete('a');
    expect(cache.get('a')).toBeUndefined();
  });

  it('deleteWhere removes matching keys only', () => {
    const cache = createTtlCache<string>({ ttlMs: 30_000 });
    cache.set('match-history:user-1:50', 'a');
    cache.set('match-history:user-1:10', 'b');
    cache.set('match-history:user-2:50', 'c');

    cache.deleteWhere((key) => key.startsWith('match-history:user-1:'));

    expect(cache.get('match-history:user-1:50')).toBeUndefined();
    expect(cache.get('match-history:user-1:10')).toBeUndefined();
    expect(cache.get('match-history:user-2:50')).toBe('c');
  });
});
