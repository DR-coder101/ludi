# Single-6 come-out

With two dice, any die showing 6 brings one yard piece onto its start cell. 6-6 brings out two. This is GAME_RULES.md §3, not a house-rule toggle.

## Sub-features

- `comeout-one` spends one 6 to leave the yard (the other die is a normal move).
- `comeout-two` on 6-6 leaves two yard pieces.
- `comeout-observe` counts the seat's tokens with `pos.zone === "yard"` after those 6s are played.

## How to get to it (user POV)

- In the Expo app: start a match with tokens in the yard, throw, play a 6 on a yard piece.
- Via `ludi`: `room ready` as the only human. Default red seat acts first. `match roll`, then `match move` on yard tokens.

## Driving it with ludi

Preconditions:

- Managed server + session + `room create` as the only human. Default red seat, all four tokens in the yard.
- `room ready` filled bots. `match state` `data.my_color` is `red`, `data.game.phase` is `awaiting_roll`, and four red tokens have `pos.zone` `yard`.

- **Baseline.** Run `pnpm -s ludi -- match state --run-dir "$RUN_DIR" --output json`. Four red tokens are in the yard.
- **One 6.** Run `pnpm -s ludi -- match roll --run-dir "$RUN_DIR" --output json`. If exactly one die has `value` 6, run `pnpm -s ludi -- match move --token 0 --die <that dieIndex> --run-dir "$RUN_DIR" --output json`. Expected: three red tokens remain `yard`. Token 0 is `{ zone: "track", cell: 0 }`.
- **6-6.** If both dice are 6 on a throw that started with four in the yard, run `match move --token 0 --die 0` then `match move --token 1 --die 1`. Expected: two red tokens remain `yard`. Tokens 0 and 1 are on start cell `0`. If the first throw is not 6-6, `room leave`, create a new room, and roll again (about 1 in 36 opening throws). Do not use `match play-turn` for 6-6. It picks `legalMoves[0]`, which after the first come-out is the token already on the track.
- **Record.** Save the roll JSON and the following `match state` under `"$RUN_DIR/evidence/come-out.json"`.
- **Cleanup.** `session close` then `server stop`. Keep evidence.

## Gotchas

- There is no dice seed. A throw with no 6 and all tokens in the yard has no legal moves; the server passes the turn.
- After the first come-out, a later 6 may move the token on the track instead of a yard piece. Assert 6-6 only on a throw that started with four in the yard, and name the yard tokens in `match move`.
- Do not change `blockadeCanMoveTogether` for this check. Come-out is fixed rules, not a lobby toggle.
