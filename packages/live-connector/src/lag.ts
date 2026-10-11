import { P95_PASS_MS } from './types.js';

export function lagMs(receivedAt: number, platformTimestamp?: number): number | null {
  if (platformTimestamp === undefined) return null;
  if (!Number.isFinite(receivedAt) || !Number.isFinite(platformTimestamp)) return null;
  return receivedAt - platformTimestamp;
}

export function percentile(values: readonly number[], p: number): number | null {
  if (values.length === 0) return null;
  if (p < 0 || p > 100) return null;
  const sorted = [...values].sort((a, b) => a - b);
  if (sorted.length === 1) return sorted[0]!;
  const index = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(index);
  const hi = Math.ceil(index);
  if (lo === hi) return sorted[lo]!;
  const weight = index - lo;
  return Math.round(sorted[lo]! * (1 - weight) + sorted[hi]! * weight);
}

export const LAG_KINDS = ['platform', 'local_receive'] as const;
export type LagKind = (typeof LAG_KINDS)[number];

export type LagVerdict = {
  p50Ms: number | null;
  p95Ms: number | null;
  sampleCount: number;
  thresholdMs: number;
  pass: boolean;
  lagKind: LagKind;
  line: string;
};

export function receiveSpreadMs(receivedAt: readonly number[]): number[] {
  if (receivedAt.length === 0) return [];
  const origin = Math.min(...receivedAt);
  return receivedAt.map((value) => value - origin);
}

export function verdict(
  lags: readonly number[],
  thresholdMs = P95_PASS_MS,
  lagKind: LagKind = 'platform',
): LagVerdict {
  const sampleCount = lags.length;
  const p50Ms = percentile(lags, 50);
  const p95Ms = percentile(lags, 95);
  const pass = p95Ms !== null && p95Ms < thresholdMs;
  const p95Text = p95Ms === null ? 'n/a' : `${Math.round(p95Ms)}ms`;
  const suffix = lagKind === 'local_receive' ? ' (local receive lag)' : '';
  const line =
    sampleCount === 0
      ? `FAIL p95=n/a threshold=${thresholdMs}ms samples=0`
      : `${pass ? 'PASS' : 'FAIL'} p95=${p95Text} threshold=${thresholdMs}ms samples=${sampleCount}${suffix}`;
  return { p50Ms, p95Ms, sampleCount, thresholdMs, pass, lagKind, line };
}
