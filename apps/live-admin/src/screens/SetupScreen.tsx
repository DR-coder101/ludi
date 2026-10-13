import { CheckIcon, CopyIcon, RefreshIcon } from '../icons.js';
import type { AdminView, TikFinityStep } from '../view/types.js';

type Props = { view: AdminView };

export function SetupScreen({ view }: Props) {
  const s = view.setup;
  const usernameDone = s.usernameFound;
  const tikfinityDone = s.tikfinity === 'connected';
  const overlayDone = s.overlayLoaded;
  return (
    <section className="setup">
      <div className="setup-head">
        <div>
          <h1>Get Ludi Live on your stream</h1>
          <p className="lede">Three quick steps, about 5 minutes. Keep TikFinity open on this computer.</p>
        </div>
        <StepsBadge done={s.stepsDone} />
      </div>
      <div className="setup-grid">
        <div className="col">
          <article className="card gold-card">
            <header className="card-h">
              <span className="step-check">{usernameDone ? <CheckIcon size={14} color="#111" /> : '1'}</span>
              <h2>Your TikTok username</h2>
              {usernameDone ? <span className="done-pill">DONE</span> : null}
            </header>
            <div className="username-row">
              <div className="username-box">
                <span className="at">@</span>
                <span className="uname">{s.username}</span>
                {usernameDone ? <span className="found">Found on TikTok</span> : null}
              </div>
              <button className="btn ghost" type="button">Change</button>
            </div>
            <p className="hint">The name after the @ on your TikTok profile. No password needed.</p>
          </article>

          <TikFinityCard step={s.tikfinity} />
        </div>

          <article className={`card gold-card overlay-card${overlayDone || !tikfinityDone ? '' : ' current'}`}>
          <header className="card-h">
            {overlayDone ? (
              <span className="step-check"><CheckIcon size={14} color="#111" /></span>
            ) : (
              <span className="step-num">3</span>
            )}
            <h2>Add the game to your stream</h2>
          </header>
          <div className="overlay-url">
            <code>{s.overlayUrl}</code>
            <button className="btn gold" type="button">
              <CopyIcon size={14} color="#111" /> Copy overlay URL
            </button>
          </div>
          <p className="then">Then, in TikTok LIVE Studio or OBS:</p>
          <ol className="obs-steps">
            <li><span>1</span> Open TikTok LIVE Studio or OBS on this computer.</li>
            <li><span>2</span> Add a source. Pick “Link” in LIVE Studio, or “Browser” in OBS.</li>
            <li><span>3</span> Paste the overlay URL and set the size to 1080 × 1920.</li>
            <li><span>4</span> Click Done. The Ludi board shows up on your stream.</li>
          </ol>
          {overlayDone ? (
            <div className="overlay-ok">Overlay is showing in TikTok LIVE Studio</div>
          ) : (
            <div className="overlay-wait">Overlay not opened yet. This ticks green once it loads.</div>
          )}
        </article>
      </div>
      <footer className="setup-foot">
        <p>{view.footerHint}</p>
        <button className={view.goDashboardEnabled ? 'btn gold dash-go' : 'btn dash-go muted'} type="button">
          Go to dashboard →
        </button>
      </footer>
    </section>
  );
}

function StepsBadge({ done }: { done: 1 | 2 | 3 }) {
  if (done === 3) {
    return (
      <div className="steps-badge">
        <span className="mini-check" />
        <span className="mini-check" />
        <span className="mini-check" />
        <strong>All 3 done</strong>
      </div>
    );
  }
  return (
    <div className="steps-badge">
      <span className="mini-check" />
      <span className={done >= 2 ? 'mini-check' : 'mini-now'}>2</span>
      <span className="mini-todo">3</span>
      <strong>1 of 3 done</strong>
    </div>
  );
}

function TikFinityCard({ step }: { step: TikFinityStep }) {
  if (step === 'not-running') {
    return (
      <article className="card gold-card current">
        <header className="card-h">
          <span className="step-num">2</span>
          <h2>Check TikFinity</h2>
        </header>
        <div className="status-banner bad">
          <span className="dot red" />
          <div>
            <strong>TikFinity not running</strong>
            <p>Open the TikFinity app on this computer, then click Check again.</p>
          </div>
          <button className="btn outline-gold sm" type="button">
            <RefreshIcon size={14} color="#FED100" /> Check again
          </button>
        </div>
        <div className="seg">
          <span className="seg-on red">Not running</span>
          <span>Running, no LIVE</span>
          <span>Connected</span>
        </div>
        <p className="hint">No TikFinity yet? It’s the free app that passes your LIVE chat to Ludi Live. Install it, sign in with TikTok, then come back.</p>
      </article>
    );
  }
  if (step === 'connected') {
    return (
      <article className="card gold-card">
        <header className="card-h">
          <span className="step-check"><CheckIcon size={14} color="#111" /></span>
          <h2>Check TikFinity</h2>
        </header>
        <div className="status-banner good">
          <span className="dot green" />
          <div>
            <strong>Connected</strong>
            <p>TikFinity is linked to your LIVE. Chat commands are coming in.</p>
          </div>
          <button className="btn outline-gold sm" type="button">
            <RefreshIcon size={14} color="#FED100" /> Check again
          </button>
        </div>
        <div className="seg">
          <span>Not running</span>
          <span>Running, no LIVE</span>
          <span className="seg-on green">Connected</span>
        </div>
        <p className="hint">TikFinity is the free app that passes your LIVE chat to Ludi Live.</p>
      </article>
    );
  }
  return (
    <article className="card gold-card current">
      <header className="card-h">
        <span className="step-num">2</span>
        <h2>Check TikFinity</h2>
      </header>
      <div className="status-banner warn">
        <span className="dot gold" />
        <div>
          <strong>Running, not connected to a LIVE</strong>
          <p>TikFinity is open. Go LIVE on TikTok and it links up by itself.</p>
        </div>
          <button className="btn outline-gold sm" type="button">
            <RefreshIcon size={14} color="#FED100" /> Check again
          </button>
        </div>
        <div className="seg">
          <span>Not running</span>
          <span className="seg-on gold">Running, no LIVE</span>
        <span>Connected</span>
      </div>
      <p className="hint">TikFinity is the free app that passes your LIVE chat to Ludi Live.</p>
    </article>
  );
}
