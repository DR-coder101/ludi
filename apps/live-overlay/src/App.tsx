import { useEffect, useMemo, useState } from 'react';
import type { LiveEvent, LiveGameState } from '@ludi/live-game';
import defaultBackdrop from './assets/backdrop.jpg';
import { CANVAS } from './theme.js';
import { project } from './view/project.js';
import { parseQuery } from './connect/query.js';
import { demoFrame } from './connect/fixtures.js';
import { connectLive, type PauseInfo } from './connect/socket.js';
import { Backdrop } from './screens/Backdrop.js';
import { IntroScreen } from './screens/IntroScreen.js';
import { WaitingScreen } from './screens/WaitingScreen.js';
import { CountdownScreen } from './screens/CountdownScreen.js';
import { GameScreen } from './screens/GameScreen.js';
import { WinnerScreen } from './screens/WinnerScreen.js';
import { SafeZone } from './screens/SafeZone.js';

function useScale(): number {
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const fit = () => {
      const sx = window.innerWidth / CANVAS.width;
      const sy = window.innerHeight / CANVAS.height;
      setScale(Math.min(sx, sy));
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);
  return scale;
}

export function App() {
  const query = useMemo(() => parseQuery(window.location.search), []);
  const scale = useScale();
  const [snapshot, setSnapshot] = useState<LiveGameState | null>(null);
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [pause, setPause] = useState<PauseInfo>({ paused: false, reason: null, turnLeftMs: null });
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (query.demo) {
      const frame = demoFrame(query.demo);
      setSnapshot(frame.snapshot);
      setEvents(frame.events);
      return;
    }
    const url = query.ws ?? window.location.origin;
    return connectLive(url, (next, ev, p) => {
      setSnapshot(next);
      setEvents(ev);
      setPause(p);
    });
  }, [query.demo, query.ws]);

  useEffect(() => {
    if (query.demo) return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [query.demo]);

  const frozenNow =
    pause.paused && snapshot?.turnEndsAt != null
      ? snapshot.turnEndsAt - (pause.turnLeftMs ?? 0)
      : now;
  const intent = query.demo ? demoFrame(query.demo).intent : { now: frozenNow };
  const view = snapshot ? project(snapshot, events, intent) : null;
  const bg = query.bg ?? defaultBackdrop;
  const tint =
    view?.kind === 'intro'
      ? 'intro'
      : view?.kind === 'winner'
        ? 'winner'
        : view?.kind === 'game'
          ? 'game'
          : 'waiting';

  return (
    <div className="stage">
      <div
        className="canvas"
        data-overlay-root="1"
        style={{ transform: `translate(-50%, -50%) scale(${scale})` }}
      >
        <Backdrop src={bg} tint={tint} />
        {view?.kind === 'intro' ? <IntroScreen settle={query.settle} /> : null}
        {view?.kind === 'waiting' ? <WaitingScreen view={view} settle={query.settle} /> : null}
        {view?.kind === 'countdown' ? <CountdownScreen view={view} settle={query.settle} /> : null}
        {view?.kind === 'game' ? <GameScreen view={view} events={events} settle={query.settle} /> : null}
        {pause.paused && !query.demo ? (
          <div className="paused-banner" data-safe="paused-banner" data-reason={pause.reason ?? 'manual'}>
            <span className="paused-word">PAUSED</span>
            <span className="paused-why">
              {pause.reason === 'tiktok' ? 'Reconnecting to TikTok LIVE\u2026' : 'The streamer paused the game'}
            </span>
          </div>
        ) : null}
        {view?.kind === 'winner' ? <WinnerScreen view={view} settle={query.settle} /> : null}
        {query.safe ? <SafeZone /> : null}
      </div>
    </div>
  );
}
