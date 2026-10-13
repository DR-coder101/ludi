import type { ReactNode } from 'react';
import { CrownIcon } from '../icons.js';
import type { AdminDemoId, AdminView, NavId } from '../view/types.js';

type Props = {
  view: AdminView;
  screen: AdminDemoId | 'live';
  children: ReactNode;
};

export function Shell({ view, screen, children }: Props) {
  return (
    <div
      className="stage"
      data-admin-root="1"
      data-screen={screen}
      style={{ width: view.canvas.width, height: view.canvas.height }}
    >
      <header className="topbar">
        <div className="brand">
          <CrownIcon size={28} color="#FED100" />
          <div>
            <div className="brand-title">LUDI LIVE</div>
            <div className="brand-flag" aria-hidden>
              <span className="flag-g" />
              <span className="flag-y" />
              <span className="flag-k" />
            </div>
            <div className="brand-sub">Streamer controls</div>
          </div>
        </div>
        <nav className="nav" aria-label="Admin">
          <NavBtn id="dashboard" current={view.nav} label="Dashboard" />
          <NavBtn id="setup" current={view.nav} label="Setup" />
          <NavBtn id="settings" current={view.nav} label="Settings" />
        </nav>
        <div className={`pill pill-${view.pill.tone}`}>
          <span className="pill-dot" />
          <span>
            <strong>{view.pill.title}</strong>
            <em>{view.pill.subtitle}</em>
          </span>
        </div>
      </header>
      <div className="page">{children}</div>
    </div>
  );
}

function NavBtn({ id, current, label }: { id: NavId; current: NavId; label: string }) {
  const active = id === current;
  return (
    <span className={active ? 'nav-btn on' : 'nav-btn'} data-nav={id}>
      {label}
    </span>
  );
}
