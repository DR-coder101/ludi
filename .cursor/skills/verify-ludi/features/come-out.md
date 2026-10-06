# Single-6 come-out

With two dice, any die showing 6 brings one yard piece onto its start cell. 6-6 brings out two. This is GAME_RULES.md §3 (issue #56), not a house-rule toggle.

## Sub-features

- `comeout-one` spends one 6 to leave the yard (the other die is a normal move).
- `comeout-two` on 6-6 leaves two yard pieces.
- `comeout-observe` counts the seat's tokens with `pos.zone === "yard"` after the throw is played.

## How to get to it (user POV)

- In the Expo app: start a match with tokens in the yard, throw, play a 6 on a yard piece.
- Via `ludi`: `room ready` as sole human, then `match.roll` / `match.play-turn` until a 6 appears.

## Driving it with ludi

Preconditions:

- Managed server + session + `room create` as the only human. Default red seat, all four tokens in the yard.
- `room ready` filled bots. `match state` `data.my_color` is `red` and four of `data.game.tokens` for red have `pos.zone` `yard`.

- **Wait for a 6.** Loop, at most 24 times: if it is not your turn, `pnpm -s ludi -- match play-turn --wait-ms 20000 --run-dir "$RUN_DIR" --output json`. If it is your turn in `awaiting_roll`, `match roll` and read `data.game.dice`. A die with `value` 6 counts. Dice are unseeded, so this loop is the check, not a forced roll.
- **One 6.** When the throw is 6-x (exactly one die is 6) and four of your tokens were in the yard, play the legal 6 (`match play-turn` if you have not already, or `match move` on a yard token and the 6's `dieIndex`). Expected: three of your tokens remain `yard`. The fourth is `track` at your start cell (red start is `0`).
- **6-6.** When both dice are 6 and four were in the yard, play both. Expected: two tokens remain `yard`, two are on the start cell.
- **Record.** Save the command JSON that contains the 6 and the following `match state` under `"$RUN_DIR/evidence/come-out.json"`.
- **Cleanup.** `session close` then `server stop`. Keep evidence.

## Gotchas

- There is no dice seed. A throw with no 6 and all tokens in the yard has no legal moves; the server passes the turn. Keep looping.
- `match play-turn` auto-picks `legalMoves[0]`, which is a come-out when a 6 is legal from the yard. That is enough to observe the yard count drop.
- After the first come-out, later 6s may move the token already on the track instead of a yard piece. Assert against a throw that started with four in the yard.
- Do not change `blockadeCanMoveTogether` for this check. Come-out is fixed rules, not a lobby toggle.
