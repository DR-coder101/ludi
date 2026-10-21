import { describe, expect, it, vi } from 'vitest';
import { createRematchRegistry } from './rematchRegistry.js';

describe('rematch registry', () => {
  it('accepts when every required player accepts', () => {
    const rematches = createRematchRegistry(() => 1_000);
    const offered = rematches.offer('ROOM1', ['a', 'b'], 30_000, () => {});
    expect(offered.success).toBe(true);
    expect(rematches.respond('ROOM1', 'a', true).session?.status).toBe('pending');
    const second = rematches.respond('ROOM1', 'b', true);
    expect(second.session?.status).toBe('accepted');
    rematches.close();
  });

  it('expires after the timeout', () => {
    vi.useFakeTimers();
    const expired: string[] = [];
    const rematches = createRematchRegistry(() => Date.now());
    rematches.offer('ROOM1', ['a', 'b'], 30_000, (payload) => {
      expired.push(payload.status);
    });
    rematches.respond('ROOM1', 'a', true);
    vi.advanceTimersByTime(29_999);
    expect(rematches.get('ROOM1')?.status).toBe('pending');
    vi.advanceTimersByTime(1);
    expect(rematches.get('ROOM1')?.status).toBe('expired');
    expect(expired).toEqual(['expired']);
    rematches.close();
    vi.useRealTimers();
  });
});
