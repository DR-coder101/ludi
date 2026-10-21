import { describe, expect, it } from 'vitest';
import { visibleOnlineCount } from '@ludi/protocol';
import { presencePayload } from './presence.js';

describe('online count hiding', () => {
  it('hides 0, 19, and any non-finite count', () => {
    expect(visibleOnlineCount(0)).toBe(null);
    expect(visibleOnlineCount(19)).toBe(null);
    expect(visibleOnlineCount(Number.NaN)).toBe(null);
    expect(presencePayload(19)).toEqual({ success: true, count: 19, visible: null });
  });

  it('shows the floor of a count at or above 20', () => {
    expect(visibleOnlineCount(20)).toBe(20);
    expect(visibleOnlineCount(1420)).toBe(1420);
    expect(visibleOnlineCount(20.9)).toBe(20);
    expect(presencePayload(20)).toEqual({ success: true, count: 20, visible: 20 });
  });
});
