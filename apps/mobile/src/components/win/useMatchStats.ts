import { useCallback, useEffect, useRef, useState } from 'react';
import type { Color } from '@ludi/rules';
import { EMPTY_STATS, recordCapture, recordRoll, type MatchStats } from './winModel';

/**
 * Sixes and captures per colour plus the time from this screen opening to the finish.
 * A client that reconnects mid-game only counts what it saw.
 */
export function useMatchStats(finished: boolean) {
  const [tally, setTally] = useState<MatchStats>(EMPTY_STATS);
  const startedAt = useRef(Date.now());
  const [endedAt, setEndedAt] = useState<number | null>(null);

  useEffect(() => {
    if (finished) setEndedAt((t) => t ?? Date.now());
  }, [finished]);

  const roll = useCallback(
    (color: Color, values: readonly number[]) =>
      setTally((s) => values.reduce((acc, value) => recordRoll(acc, color, value), s)),
    [],
  );
  const capture = useCallback((color: Color) => setTally((s) => recordCapture(s, color)), []);
  const reset = useCallback(() => {
    startedAt.current = Date.now();
    setEndedAt(null);
    setTally(EMPTY_STATS);
  }, []);

  const stats: MatchStats = { ...tally, elapsedMs: (endedAt ?? Date.now()) - startedAt.current };
  return { stats, roll, capture, reset };
}
