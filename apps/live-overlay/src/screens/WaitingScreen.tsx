import { motion, useReducedMotion } from 'motion/react';
import { BADGE_WINNER_CAN_STAY, TOWN } from '../theme.js';
import type { OverlayView, SeatView } from '../view/types.js';
import { CheckIcon, CrownIcon, DieFiveAltIcon, DieFiveIcon, UsersIcon } from '../icons.js';

type Waiting = Extract<OverlayView, { kind: 'waiting' }>;

type Props = {
  view: Waiting;
  settle: boolean;
};

function SeatCard({ seat, settle }: { seat: SeatView; settle: boolean }) {
  const t = TOWN[seat.town];
  if (seat.filled) {
    return (
      <motion.div
        className={`seat-card filled town-${seat.town}`}
        data-safe={`seat-${seat.town}`}
        initial={settle ? false : { scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', bounce: 0.45 }}
      >
        <div className="seat-town">{t.label}</div>
        <div className="seat-disc" />
        <div className="seat-name">{seat.handle}</div>
        <div className="seat-joined">
          <CheckIcon size={16} color="#fff" />
          JOINED
        </div>
      </motion.div>
    );
  }
  return (
    <div className={`seat-card empty town-${seat.town}`} data-safe={`seat-${seat.town}`}>
      <div className="seat-town">{t.label}</div>
      <div className="seat-empty-slot">?</div>
      <div className="seat-open">Open seat</div>
      <div className="seat-hint">!join</div>
    </div>
  );
}

export function WaitingScreen({ view, settle }: Props) {
  const reduce = Boolean(useReducedMotion());
  const pulse = !settle && !reduce;
  return (
    <div className={`screen waiting${view.full ? ' full' : ''}`} data-screen="waiting">
      <div className="wait-top">
        {view.lastWinnerName ? (
          <div className="last-winner" data-safe="last-winner">
            <CrownIcon size={26} color="#fed100" />
            <span className="lbl">Last winner:</span>
            <span className="nm">{view.lastWinnerName}</span>
          </div>
        ) : (
          <div />
        )}
        <div className="stay-badge" data-safe="winner-can-stay">
          <CrownIcon size={24} color="#111111" />
          {BADGE_WINNER_CAN_STAY}
        </div>
      </div>
      <div className="wait-title" data-safe="title-card">
        <div className="wait-title-row">
          <CrownIcon size={96} color="#fed100" className="tilt" />
          <h1>LUDI LIVE</h1>
        </div>
        <div className="flag-stripe three">
          <span className="g" />
          <span className="y" />
          <span className="k" />
        </div>
        <div className="wait-byline">
          <span>by StreamArchitect</span>
          <span className="dot">·</span>
          <span className="rules">Jamaican rules</span>
        </div>
      </div>
      <div className="sky-window">
        <div className="dice-peek">
          <DieFiveIcon size={78} />
          <DieFiveAltIcon size={62} />
        </div>
      </div>
      <div className={`join-pill${pulse ? ' pulse' : ''}`} data-safe="join-pill">
        <span>TYPE</span>
        <span className="cmd">!join</span>
        <span>TO PLAY</span>
      </div>
      <div className="seat-panel" data-safe="seat-panel">
        <div className="seat-head">
          <div className="players-title">
            <UsersIcon size={32} color="#fff" />
            PLAYERS
          </div>
          <motion.div
            className="joined-chip"
            key={view.joined}
            animate={settle ? { scale: 1 } : { scale: [1, 1.18, 1] }}
            transition={{ duration: 0.35 }}
          >
            {view.joined}/4 JOINED
          </motion.div>
        </div>
        <div className="seat-grid">
          {view.seats.map((seat) => (
            <SeatCard key={seat.town} seat={seat} settle={settle} />
          ))}
        </div>
        <p className="start-note">Game starts when 4 players join · next in line plays the winner</p>
      </div>
      {view.toast ? (
        <div className="join-toast" data-safe="toast">
          {view.toast}
        </div>
      ) : null}
    </div>
  );
}
