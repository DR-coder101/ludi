import { describe, expect, it } from 'vitest';
import { dieStatusLabel } from './dieStatus';

describe('dieStatusLabel', () => {
  it('tags the active unused die ACTIVE and a spent die PLAYED', () => {
    expect(dieStatusLabel(false, true)).toBe('ACTIVE');
    expect(dieStatusLabel(true, false)).toBe('PLAYED');
    expect(dieStatusLabel(true, true)).toBe('PLAYED');
    expect(dieStatusLabel(false, false)).toBeNull();
  });
});
