import {
  ClockIcon,
  GiftIcon,
  KickIcon,
  PauseIcon,
  PlayIcon,
  PlugIcon,
  RefreshIcon,
  RestartIcon,
  SkipIcon,
  UsersIcon,
} from '../icons.js';
import type { AdminView, SeatCard } from '../view/types.js';

type Props = { view: AdminView };

const PHASES = ['INTRO', 'WAITING', 'COUNTDOWN', 'PLAYING', 'WINNER'] as const;
const PHASE_LABEL: Record<(typeof PHASES)[number], string> = {
  INTRO: 'Intro',
  WAITING: 'Waiting',
  COUNTDOWN: 'Countdown',
  PLAYING: 'Playing',
  WINNER: 'Winner',
};

export function DashboardScreen({ view }: Props) {
  const d = view.dashboard;
  return (
    <section className="dash">
      {view.banner ? (
        <div className={`banner banner-${view.banner.tone}`}>
          <span className="banner-mark">
            {view.banner.tone === 'gold' ? (
              <RefreshIcon size={18} color="#FED100" />
            ) : (
              <PlugIcon size={18} color="#FF4D6A" />
            )}
          </span>
          <div>
            <strong>{view.banner.title}</strong>
            <p>{view.banner.body}</p>
          </div>
          <button className="btn gold" type="button">{view.banner.action}</button>
        </div>
      ) : null}
      <div className="dash-grid">
        <div className="col">
          <article className="card gold-card">
            <header className="phase-h">
              <h2>GAME #{d.gameNumber} · WHAT VIEWERS SEE NOW</h2>
              <span className="game-clock">Game running {d.gameClock}</span>
            </header>
            <div className="phases">
              {PHASES.map((p) => {
                const done = PHASES.indexOf(p) < PHASES.indexOf(d.phase);
                const on = p === d.phase;
                const future = PHASES.indexOf(p) > PHASES.indexOf(d.phase);
                return (
                  <span key={p} className={on ? 'phase on' : future ? 'phase future' : 'phase done'}>
                    {done ? <span className="tick">✓</span> : null}
                    {on ? <span className="live-dot" /> : null}
                    {PHASE_LABEL[p]}
                  </span>
                );
              })}
            </div>
          </article>
          <article className="card gold-card">
            <header className="players-h">
              <h2>PLAYERS</h2>
              <span className="playing-pill">{d.playingLabel}</span>
            </header>
            <div className="seats">
              {d.seats.map((seat) => (
                <Seat key={seat.town} seat={seat} />
              ))}
            </div>
            <div className="turn-timer">
              <span className="turn-tag">TURN TIMER</span>
              <strong>{d.timerLabel}</strong>
              <span className="turn-clock">
                <ClockIcon size={14} color="#fff" /> {d.timerRemain} <em>of {d.timerTotal}</em>
              </span>
              <div className="bar"><i style={{ width: `${Math.round(d.timerRatio * 100)}%` }} /></div>
            </div>
          </article>
          <article className="card gold-card">
            <h2>CONTROLS</h2>
            <div className="controls">
              {d.paused ? (
                <button className={view.banner?.tone === 'red' ? 'btn ghost' : 'btn gold'} type="button">
                  <PlayIcon size={13} color={view.banner?.tone === 'red' ? '#fff' : '#111'} /> Resume game
                </button>
              ) : (
                <button className="btn gold" type="button">
                  <PauseIcon size={13} color="#111" /> Pause game
                </button>
              )}
              <button className="btn ghost" type="button">
                <SkipIcon size={13} color="#fff" /> Skip turn
              </button>
              <button className="btn ghost" type="button">
                <RestartIcon size={13} color="#fff" /> New game
              </button>
              <button className="btn kick" type="button">
                <KickIcon size={14} color="#FF5A8A" /> Kick player
              </button>
            </div>
            <p className="hint">Pause stops the timer and ignores chat moves until you press Resume. Skip turn passes play to the next seat.</p>
          </article>
        </div>
        <div className="col">
          <article className="card gold-card">
            <header className="queue-h">
              <h2><UsersIcon size={15} color="#FED100" /> JOIN QUEUE</h2>
              <span className="waiting-pill">{d.queue.length} WAITING</span>
            </header>
            <ol className="queue">
              {d.queue.map((row) => (
                <li key={row.name}>
                  <span className="place">{row.place}</span>
                  <strong>{row.name}</strong>
                  <em>{row.note}</em>
                </li>
              ))}
            </ol>
            <div className="sitout">
              <header>
                <span><ClockIcon size={12} color="#c5cec2" /> SITTING OUT THIS GAME</span>
                <em>Lost last game</em>
              </header>
              {d.sitOut.map((row) => (
                <div className="sit-chip" key={row.name}>
                  <strong>{row.name}</strong>
                  <span>{row.badge}</span>
                </div>
              ))}
            </div>
          </article>
          <article className="card gold-card chat-card">
            <header className="chat-h">
              <h2>LIVE CHAT COMMANDS</h2>
              {d.chatLive ? <span className="live-pill"><i /> LIVE</span> : null}
            </header>
            <ul className="chat">
              {d.chat.map((row, i) =>
                row.kind === 'gift' ? (
                  <li key={i} className="gift-line">
                    <GiftIcon size={14} color="#fff" /> {row.text}
                  </li>
                ) : (
                  <li key={i}>
                    <span className="t">{row.time}</span>
                    <strong>{row.name}</strong>
                    <code>{row.command}</code>
                    <em>{row.result}</em>
                  </li>
                ),
              )}
            </ul>
          </article>
        </div>
      </div>
    </section>
  );
}

function Seat({ seat }: { seat: SeatCard }) {
  return (
    <div className={`seat town-${seat.town}${seat.isTurn ? ' turn' : ''}`}>
      <div className="seat-town">{seat.label}</div>
      <div className="disc" />
      <div className="seat-name">{seat.occupant}</div>
      {seat.isTurn ? <div className="their-turn">THEIR TURN</div> : <div className="seat-detail">{seat.detail}</div>}
    </div>
  );
}
