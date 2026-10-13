import beach from '../assets/beach-sunset.jpg';
import { ClockIcon, GiftIcon, LockIcon, PencilIcon, UploadIcon } from '../icons.js';
import type { AdminView } from '../view/types.js';

type Props = { view: AdminView };

export function SettingsScreen({ view }: Props) {
  const s = view.settings;
  return (
    <section className="settings">
      <div className="settings-head">
        <div>
          <h1>Settings</h1>
          <p className="lede">Make it yours. Changes start from the next game.</p>
        </div>
        <div className="settings-actions">
          <button className="btn ghost" type="button">Reset to defaults</button>
          <button className="btn gold" type="button">Save changes</button>
        </div>
      </div>
      <div className="settings-grid">
        <div className="col">
          <article className="card gold-card">
            <h2 className="block-title">CHAT COMMAND WORDS</h2>
            <p className="block-sub">What viewers type in chat. Short words work best.</p>
            <CommandRow label="Join a seat" value={s.commands.join} />
            <CommandRow label="Roll the dice" value={s.commands.roll} />
            <CommandRow label="Move a piece" value={s.commands.move} extra="+ piece number 1–4" />
            <CommandRow label="Stay for next game" value={s.commands.stay} />
            <CommandRow label="Leave the game" value={s.commands.leave} />
            <button className="dashed-add" type="button">+ Add another word (e.g. !play for join)</button>
          </article>
          <article className="card gold-card timer-card">
            <header className="timer-h">
              <h2 className="block-title"><ClockIcon size={16} color="#FED100" /> TURN TIMER</h2>
              <span className="default-note">Default 20s</span>
            </header>
            <div className="timer-pills">
              {[10, 15, 20, 30, 45].map((n) => (
                <span key={n} className={s.turnMs === n * 1000 ? 't-pill on' : 't-pill'}>
                  {n}s
                </span>
              ))}
            </div>
            <p className="hint">How long each player has to roll and move. If time runs out, the game makes a move for them.</p>
          </article>
        </div>
        <div className="col">
          <article className="card gold-card">
            <h2 className="block-title">THEME & COLOURS</h2>
            <div className="themes">
              <div className="theme on">
                <span className="swatch dancehall" />
                <em>Dancehall Night</em>
              </div>
              <div className="theme">
                <span className="swatch beach" />
                <em>Beach Day</em>
              </div>
              <div className="theme">
                <span className="swatch flag" />
                <em>Flag Classic</em>
              </div>
            </div>
            <div className="accents">
              <span>Accent colour</span>
              <i className="acc gold on" />
              <i className="acc green" />
              <i className="acc pink" />
              <i className="acc cream" />
            </div>
            <p className="hint">Town colours never change, so players always know their seat.</p>
          </article>
          <article className="card gold-card bg-card">
            <img className="bg-thumb" src={beach} alt="" />
            <div>
              <h2 className="block-title">BACKGROUND PHOTO</h2>
              <p className="hint tight">Now showing: {s.backgroundName}. A tall photo (1080 × 1920) looks best.</p>
              <div className="bg-actions">
                <button className="btn gold sm" type="button">
                  <UploadIcon size={13} color="#111" /> Upload photo
                </button>
                <button className="text-btn" type="button">Use default</button>
              </div>
            </div>
          </article>
          <article className="card gold-card">
            <header className="gift-h">
              <h2 className="block-title"><GiftIcon size={16} color="#FF5A8A" /> GIFT EFFECTS</h2>
              <span className="block-sub right">What viewers see when a gift lands</span>
            </header>
            <div className="gift-warn">
              Effects only. Gifts never change dice, turns or who wins.
            </div>
            <ul className="gift-list">
              {s.giftEffects.map((row) => (
                <li key={row.giftId}>
                  <strong>{row.giftName}</strong>
                  <span className="arrow">→</span>
                  <em>{row.effect}</em>
                  <button className="btn gold sm" type="button">
                    <PencilIcon size={12} color="#111" /> Change
                  </button>
                </li>
              ))}
            </ul>
            <button className="dashed-add gold-text" type="button">+ Add gift</button>
          </article>
          <div className="rules-lock">
            <LockIcon size={18} color="#19C45A" />
            <div>
              <strong>Game rules can’t be changed</strong>
              <p>Every game plays the same Jamaican Ludi rules, so it’s fair for everyone. Gifts only add effects. They never help anyone win.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CommandRow({ label, value, extra }: { label: string; value: string; extra?: string }) {
  return (
    <div className="cmd-row">
      <span className="cmd-label">{label}</span>
      <div className="cmd-box">
        <code>{value}</code>
        {extra ? <small>{extra}</small> : null}
        <PencilIcon size={13} color="#9aa" />
      </div>
    </div>
  );
}
