import { WarnIcon } from '../icons.js';
import type { AdminError } from '../view/types.js';

type Props = { error: AdminError };

export function ErrorScreen({ error }: Props) {
  const copy = copyOf(error);
  return (
    <section className="error-wrap">
      <article className="error-card">
        <div className="warn-ring">
          <WarnIcon size={40} color="#FF4D6A" />
        </div>
        <div className="err-badge">{copy.badge}</div>
        <h1>{copy.title}</h1>
        <p className="err-sub">{copy.sub}</p>
        <div className="do-this">
          <span>DO THIS</span>
          <p>{copy.doThis}</p>
        </div>
        <div className="modal-actions">
          <button className="btn ghost" type="button">{copy.secondary}</button>
          <button className="btn gold" type="button">{copy.primary} →</button>
        </div>
      </article>
      <p className="err-foot">{copy.foot}</p>
    </section>
  );
}

function copyOf(error: AdminError): {
  badge: string;
  title: string;
  sub: string;
  doThis: string;
  secondary: string;
  primary: string;
  foot: string;
} {
  switch (error.kind) {
    case 'tikfinity-closed':
      return {
        badge: 'TIKFINITY CLOSED',
        title: 'TikFinity stopped running',
        sub: "Chat commands can't reach the game, so it's paused and saved.",
        doThis: "Open TikFinity again. We reconnect by ourselves once it's running.",
        secondary: 'Back to dashboard',
        primary: 'Check again',
        foot: 'Still stuck? Close and reopen the Ludi Live app. Your settings and game are kept.',
      };
    case 'username-not-found':
      return {
        badge: 'USERNAME NOT FOUND',
        title: "We can't find that TikTok username",
        sub: `No TikTok account matches @${error.username}.`,
        doThis: "Check the spelling. It's the name after the @ on your TikTok profile.",
        secondary: 'Back to setup',
        primary: 'Edit username',
        foot: 'Tip: copy it straight from your TikTok profile to avoid typos.',
      };
    case 'live-ended':
      return {
        badge: 'LIVE ENDED',
        title: 'Your LIVE has ended',
        sub: `TikTok says @${error.username} isn't live any more. Game #${error.gameNumber} is paused and saved.`,
        doThis: 'Go LIVE again on TikTok, then press Resume game. Seats and pieces stay where they were.',
        secondary: 'End this game',
        primary: 'Resume game',
        foot: 'Not coming back? End this game and the next LIVE starts fresh.',
      };
    case 'overlay-not-loaded':
      return {
        badge: 'OVERLAY NOT SHOWING',
        title: "Viewers can't see the game yet",
        sub: "TikTok LIVE Studio or OBS hasn't opened the overlay link.",
        doThis: 'Copy the overlay URL and paste it into a Link source (LIVE Studio) or a Browser source (OBS).',
        secondary: 'Show me the steps',
        primary: 'Copy overlay URL',
        foot: 'Set the source size to 1080 × 1920 so the board fills your screen.',
      };
    case 'port-in-use':
      return {
        badge: `PORT ${error.wanted} IN USE`,
        title: "Another app is using Ludi Live's spot",
        sub: `Something else on this computer took port ${error.wanted}, so the overlay can't start.`,
        doThis: `Press Use port ${error.fallback}, then copy the new overlay URL into LIVE Studio or OBS.`,
        secondary: `Try ${error.wanted} again`,
        primary: `Use port ${error.fallback}`,
        foot: `Closing other streaming tools often frees ${error.wanted} too.`,
      };
    default: {
      const _n: never = error;
      return _n;
    }
  }
}
