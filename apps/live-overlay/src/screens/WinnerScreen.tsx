import { useEffect } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import confetti from 'canvas-confetti';
import { BADGE_WINNER_CAN_STAY, FLAG, TOWN } from '../theme.js';
import type { OverlayView } from '../view/types.js';
import { CrownIcon, LeaveIcon, ListOlIcon, TrophyIcon, UserClockIcon } from '../icons.js';
import { ConfettiScatter } from './ConfettiScatter.js';

type Props = {
  view: Extract<OverlayView, { kind: 'winner' }>;
  settle: boolean;
};

export function WinnerScreen({ view, settle }: Props) {
  const reduce = Boolean(useReducedMotion());
  const town = TOWN[view.winnerTown];
  useEffect(() => {
    if (settle || reduce) return;
    const burst = () =>
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.22 },
        colors: [FLAG.gold, FLAG.green, FLAG.black, town.hex],
      });
    burst();
    const t = window.setTimeout(burst, 400);
    return () => window.clearTimeout(t);
  }, [reduce, settle, town.hex]);

  return (
    <div className={`screen winner town-${view.winnerTown}`} data-screen="winner">
      <div className="winner-glow" style={{ background: `radial-gradient(circle, ${town.hex}59 0%, transparent 70%)` }} />
      {settle ? <ConfettiScatter /> : null}
      <div className="winner-header" data-safe="winner-header">
        <motion.div
          initial={settle || reduce ? false : { y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', bounce: 0.5 }}
        >
          <CrownIcon size={120} color="#fed100" className="winner-crown" />
        </motion.div>
        <h1>WINNER!</h1>
      </div>
      <div className="winner-block">
      <motion.div
        className="winner-card"
        data-safe="winner-card"
        style={{ background: view.winnerHex }}
        initial={settle || reduce ? false : { scale: 0.4, y: 40 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', bounce: 0.35, duration: 0.55 }}
      >
        <div className="stay-badge float" data-safe="winner-can-stay">
          <CrownIcon size={30} color="#111111" />
          {BADGE_WINNER_CAN_STAY}
        </div>
        <div className="winner-name-row">
          <div className={`winner-disc town-${view.winnerTown}`} />
          <div className="winner-name">{view.winnerHandle.toUpperCase()}</div>
        </div>
        <div className="winner-town-line">
          <TrophyIcon size={44} color="#fed100" />
          {town.title} takes it!
        </div>
        <div className="winner-home-note">All 4 pieces home</div>
      </motion.div>
      <div className={`stay-choice${view.stayUrgent ? ' urgent' : ''}`} data-safe="stay-choice">
        <div className="stay-ring">
          <span>{view.staySeconds}s</span>
        </div>
        <div className="stay-copy">
          <div className="stay-prompt">
            {view.winnerHandle.toUpperCase()}: type !stay to keep your seat
          </div>
          <div className="stay-note">No reply in 15s = seat opens</div>
        </div>
        <div className="stay-pill">
          STAY
          <CrownIcon size={26} color="#111111" />
        </div>
        <div className="leave-pill">
          LEAVE
          <LeaveIcon size={28} color="#fed100" />
        </div>
      </div>
      </div>
      <div className="results" data-safe="results">
        <div className="results-head">
          <ListOlIcon size={28} color="#fed100" />
          <span>RESULTS</span>
          <span className="pieces-lbl">pieces home</span>
        </div>
        {view.results.map((row) => (
          <div key={row.town} className={`result-row town-${row.town}`}>
            <span className="rank">{row.rank}</span>
            <span className="rdisc" />
            <span className="rnames">
              <span className="rhandle">{row.handle}</span>
              <span className="rtown">{row.title} · sitting out next game</span>
            </span>
            <span className="rhome">{row.homeCount} home</span>
          </div>
        ))}
      </div>
      <div className="next-game" data-safe="next-game">
        <div className="next-pill">
          <div className="next-pill-row">
            NEXT GAME: {view.seatsOpen} SEATS OPEN · TYPE <span className="cmd">!join</span>
          </div>
          <p className="leave-note">
            4 seats open if {view.winnerHandle} leaves or doesn’t reply
          </p>
        </div>
        <div className="winner-foot">
          {view.nextUp ? (
            <div className="next-up">
              <UserClockIcon size={24} color="#19c45a" />
              {view.nextUp}
            </div>
          ) : (
            <div />
          )}
          <div className="credit">Game #{view.gameNumber} · by StreamArchitect</div>
        </div>
      </div>
    </div>
  );
}
