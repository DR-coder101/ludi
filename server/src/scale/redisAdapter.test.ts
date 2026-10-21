import { describe, expect, it } from 'vitest';
import { redisAdapterEnabled } from './redisAdapter.js';

describe('redis adapter flag', () => {
  it('is off by default', () => {
    expect(redisAdapterEnabled({})).toBe(false);
    expect(redisAdapterEnabled({ LUDI_REDIS_ADAPTER: '0' })).toBe(false);
    expect(redisAdapterEnabled({ LUDI_REDIS_ADAPTER: '1' })).toBe(true);
  });
});
