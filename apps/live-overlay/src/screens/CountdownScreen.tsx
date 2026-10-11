import { motion, useReducedMotion } from 'motion/react';
import type { OverlayView } from '../view/types.js';
import { WaitingScreen } from './WaitingScreen.js';

type Props = {
  view: Extract<OverlayView, { kind: 'countdown' }>;
  settle: boolean;
};

export function CountdownScreen({ view, settle }: Props) {
  const reduce = Boolean(useReducedMotion());
  const waiting = {
    kind: 'waiting' as const,
    seats: view.seats,
    joined: view.joined,
    lastWinnerName: null,
    toast: null,
    full: true,
  };
  return (
    <div className="screen countdown" data-screen="countdown">
      <WaitingScreen view={waiting} settle />
      <div className="countdown-veil">
        <motion.div
          key={view.beat}
          className="countdown-beat"
          data-safe="countdown"
          initial={settle || reduce ? false : { scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          {view.beat}
        </motion.div>
      </div>
    </div>
  );
}
