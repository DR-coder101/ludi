import { describe, expect, it } from 'vitest';
import { lagMs, percentile, verdict } from './lag.js';

describe('lagMs', () => {
  it('subtracts the platform timestamp from receivedAt', () => {
    expect(lagMs(1_700_000_450, 1_700_000_000)).toBe(450);
  });

  it('returns null when the platform timestamp is missing', () => {
    expect(lagMs(1_700_000_450)).toBeNull();
  });
});

describe('percentile', () => {
  it('returns null for an empty series', () => {
    expect(percentile([], 95)).toBeNull();
  });

  it('returns the only sample for any percentile', () => {
    expect(percentile([120], 50)).toBe(120);
    expect(percentile([120], 95)).toBe(120);
  });

  it('interpolates p50 and p95 on a known series', () => {
    const lags = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];
    expect(percentile(lags, 50)).toBe(550);
    expect(percentile(lags, 95)).toBe(955);
  });
});

describe('verdict', () => {
  it('prints PASS when p95 is under 2000ms', () => {
    const result = verdict([100, 200, 300, 400, 500]);
    expect(result.pass).toBe(true);
    expect(result.p95Ms).toBe(480);
    expect(result.line).toBe('PASS p95=480ms threshold=2000ms samples=5');
  });

  it('prints FAIL when p95 is 2000ms or higher', () => {
    const result = verdict([100, 200, 2100, 2500, 4000]);
    expect(result.pass).toBe(false);
    expect(result.line).toBe('FAIL p95=3700ms threshold=2000ms samples=5');
  });

  it('prints FAIL when there are no lag samples', () => {
    const result = verdict([]);
    expect(result.pass).toBe(false);
    expect(result.line).toBe('FAIL p95=n/a threshold=2000ms samples=0');
  });
});
