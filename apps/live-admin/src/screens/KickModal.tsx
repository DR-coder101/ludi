import { KickIcon } from '../icons.js';
import type { KickTarget } from '../view/types.js';

type Props = { kick: KickTarget };

export function KickModal({ kick }: Props) {
  return (
    <div className="modal-back" role="presentation">
      <div className="modal" role="dialog" aria-labelledby="kick-title">
        <div className="kick-mark">
          <KickIcon size={28} color="#FF3B5C" />
        </div>
        <h1 id="kick-title">Kick {kick.displayName} from the game?</h1>
        <div className="seat-chip">
          <span className="disc-sm" style={{ background: kick.townHex }} />
          {kick.townLabel}
        </div>
        <p>
          Their pieces go back to start and {kick.nextName}, first in the join queue, takes the seat.
          {' '}{kick.displayName} can join the queue again later.
        </p>
        <div className="modal-actions">
          <button className="btn ghost" type="button">Keep {kick.displayName} in</button>
          <button className="btn danger" type="button">Kick {kick.displayName}</button>
        </div>
      </div>
    </div>
  );
}
