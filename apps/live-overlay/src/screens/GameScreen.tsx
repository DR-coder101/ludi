import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import type { LiveEvent } from '@ludi/live-game';
import { BADGE_WINNER_CAN_STAY, TOWN } from '../theme.js';
import type { OverlayView, PieceView } from '../view/types.js';
import { applyMovedToPieces, lastMoved } from '../view/movePath.js';
import { BoardSvg } from '../board/BoardSvg.js';
import { BoltIcon, ClockIcon, CrownIcon, DieFiveAltIcon, GiftIcon, UserPlusIcon } from '../icons.js';

type Props = {
  view: Extract<OverlayView, { kind: 'game' }>;
  events: readonly LiveEvent[];
  settle: boolean;
};

const DIE_SLOTS: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

function DieFace({ value }: { value: number }) {
  const n = Math.min(6, Math.max(1, value));
  const on = new Set(DIE_SLOTS[n] ?? DIE_SLOTS[5]);
  return (
    <div className="die-face" data-pips={n} aria-label={`die ${n}`}>
      {Array.from({ length: 9 }, (_, i) => (
        <span key={i} className={`pip${on.has(i) ? (i === 4 && n === 5 ? ' hot' : '') : ' off'}`} />
      ))}
    </div>
  );
}

function useSteppedPieces(
  pieces: readonly PieceView[],
  events: readonly LiveEvent[],
  settle: boolean,
): PieceView[] {
  const moved = lastMoved(events);
  const [frame, setFrame] = useState(() => (moved ? moved.path.length - 1 : 0));
  useEffect(() => {
    if (settle || !moved || moved.path.length === 0) {
      setFrame(moved ? moved.path.length - 1 : 0);
      return;
    }
    setFrame(0);
    if (moved.path.length === 1) return;
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setFrame(i);
      if (i >= moved.path.length - 1) window.clearInterval(id);
    }, 90);
    return () => window.clearInterval(id);
  }, [moved, settle]);
  return applyMovedToPieces(pieces, moved, settle ? (moved?.path.length ?? 1) - 1 : frame);
}

export function GameScreen({ view, events, settle }: Props) {
  const reduce = useReducedMotion();
  const instant = settle || Boolean(reduce);
  const turnTown = TOWN[view.turn.town];
  const pieces = useSteppedPieces(view.pieces, events, instant);
  return (
    <div className={`screen game town-${view.turn.town}`} data-screen="game">
      <div className="game-top">
        <div className="game-title" data-safe="game-title">
          <CrownIcon size={52} color="#fed100" className="game-crown" />
          <div>
            <h1>LUDI LIVE</h1>
            <div className="game-by">
              <span className="mini-flag">
                <i className="g" />
                <i className="y" />
                <i className="k" />
              </span>
              by StreamArchitect · Game #{view.gameNumber}
            </div>
          </div>
        </div>
        <div className="game-badges">
          {view.nextUp ? (
            <div className="queue-badge" data-safe="next-up">
              <UserPlusIcon size={20} color="#fff" />
              {view.nextUp}
            </div>
          ) : (
            <div className="queue-badge" data-safe="next-up">
              <UserPlusIcon size={20} color="#fff" />
              NEXT: !join
            </div>
          )}
          <div className="stay-badge small" data-safe="winner-can-stay">
            <CrownIcon size={21} color="#111111" />
            {BADGE_WINNER_CAN_STAY}
          </div>
        </div>
      </div>
      <div className="turn-bar" data-safe="turn-bar" style={{ background: view.turn.hex }}>
        <div className="turn-info">
          <div className="turn-name-row">
            <span className="turn-lbl">TURN</span>
            <span className="turn-player">{view.turn.handle}</span>
            <span className="turn-timer">
              <ClockIcon size={26} color="#fff" />
              {view.turn.timerLabel}
            </span>
          </div>
          <div className="turn-track">
            <div className="turn-fill" style={{ width: `${Math.round(view.turn.fillRatio * 100)}%` }} />
          </div>
          <div className="turn-cmds">
            Type <span className="chip gold">!roll</span> then <span className="chip white">!move 1-4</span>
          </div>
        </div>
        <DieFace value={view.dice?.[0] ?? 5} />
      </div>
      <div className="player-tags" data-safe="player-tags">
        {view.seats.map((s) => (
          <div key={s.town} className={`ptag town-${s.town}`}>
            <span className="dot" />
            <span className="nm">{s.handle ?? TOWN[s.town].title}</span>
            <span className="out">{s.outCount} out</span>
          </div>
        ))}
      </div>
      <div className="board-wrap" data-safe="board-wrap">
        <div className="board-holder">
          <BoardSvg active={view.turn.color} pieces={pieces} />
        </div>
        {view.showTurnCard ? <div className="board-scrim" /> : null}
        {view.showTurnCard ? (
          <motion.div
            className="turn-card-pop"
            initial={instant ? false : { scale: 0.6 }}
            animate={instant ? { scale: 1 } : { scale: [0.6, 1.05, 1] }}
            transition={{ duration: instant ? 0 : 1.2, times: [0, 0.7, 1] }}
          >
            <div className="turn-card" data-safe="turn-card" style={{ background: view.turn.hex }}>
              <div className="turn-card-top">
                <span className="turn-card-dot" style={{ background: turnTown.pieceLo }} />
                <span className="turn-card-name">{view.turn.possessive}</span>
                <DieFiveAltIcon size={56} color="#fff" className="turn-card-die" />
              </div>
              <h1 className="turn-card-word">TURN!</h1>
              <div className="turn-card-hint">type !roll</div>
            </div>
          </motion.div>
        ) : null}
      </div>
      <div className="event-row">
        {view.captureText ? (
          <div className="capture-line" data-safe="capture">
            <BoltIcon size={26} color="#fed100" />
            {view.captureText}
          </div>
        ) : (
          <div />
        )}
        {view.giftText ? (
          <div className="gift-line" data-safe="gift">
            <GiftIcon size={27} color="#fff" />
            {view.giftText}
          </div>
        ) : null}
      </div>
    </div>
  );
}
