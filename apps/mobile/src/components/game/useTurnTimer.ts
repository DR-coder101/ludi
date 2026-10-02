import { useEffect, useState } from 'react';
import type { TurnTimer } from './PlayerStrip';

const URGENT_MS = 5000;

/** Countdown for the active player's ring; null when there is no deadline. */
export function useTurnTimer(deadline: number | null, turnMs: number): TurnTimer | null {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (deadline == null) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [deadline]);

  if (deadline == null) return null;
  const left = Math.max(0, deadline - now);
  return { fraction: left / turnMs, urgent: left <= URGENT_MS };
}
