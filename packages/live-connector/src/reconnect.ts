import type { Clock } from './types.js';

export type BackoffOptions = {
  initialMs: number;
  maxMs: number;
  jitter: number;
};

export const DEFAULT_BACKOFF: BackoffOptions = {
  initialMs: 500,
  maxMs: 15_000,
  jitter: 0.2,
};

export type BackoffState = {
  attempt: number;
  delayMs: number;
};

export function nextBackoff(
  attempt: number,
  clock: Pick<Clock, 'random'>,
  options: BackoffOptions = DEFAULT_BACKOFF,
): BackoffState {
  const nextAttempt = attempt + 1;
  const exp = Math.min(options.maxMs, options.initialMs * 2 ** attempt);
  const jitterSpan = options.jitter * 2;
  const factor = 1 - options.jitter + clock.random() * jitterSpan;
  const delayMs = Math.max(0, Math.round(exp * factor));
  return { attempt: nextAttempt, delayMs };
}

export async function waitBackoff(
  state: BackoffState,
  clock: Clock,
  signal?: AbortSignal,
): Promise<void> {
  if (state.delayMs <= 0) return;
  await clock.sleep(state.delayMs, signal);
}
