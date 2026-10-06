# House-rules lobby toggles

The host sets house-rule toggles in the lobby before start. Those values are the match's `game.config.houseRules`. `blockadeCanMoveTogether` stays false and is not a toggle.

## Sub-features

- `rules-set` updates lobby toggles as host (`extraRollOnCapture`, `exactFinishBonus`, `playForPlacements`, `maxConsecutiveSixes`).
- `rules-blockade` keeps `blockadeCanMoveTogether` false even after an update.
- `rules-play` shows the same rules on `match state` after `room ready`.

## How to get to it (user POV)

- In the Expo app: create a room, use the lobby house-rules panel (max sixes, extra roll on capture, exact finish bonus, play for placements), then Start Game.
- Via `ludi`: `room create`, then `room house-rules`, then `room ready`.

## Driving it with ludi

Preconditions:

- `ludi server start --run-dir "$RUN_DIR"` succeeded.
- `ludi doctor --run-dir "$RUN_DIR"` reports `worth_driving`.
- `ludi session open --run-dir "$RUN_DIR"` succeeded.
- `ludi room create --name Dean --run-dir "$RUN_DIR"` succeeded.

- **Plan.** Run `pnpm -s ludi -- room house-rules --extra-roll-on-capture true --dry-run --run-dir "$RUN_DIR" --output json`. Exit `9`. `planned_actions[0].args.blockadeCanMoveTogether` is `false`.
- **Toggle.** Run `pnpm -s ludi -- room house-rules --extra-roll-on-capture true --max-consecutive-sixes 3 --run-dir "$RUN_DIR" --output json`. Exit `0`.
- **Lobby.** Run `pnpm -s ludi -- room state --run-dir "$RUN_DIR" --output json`. `data.room.houseRules.extraRollOnCapture` is `true`. `data.room.houseRules.maxConsecutiveSixes` is `3`. `data.room.houseRules.blockadeCanMoveTogether` is `false`.
- **Play.** Run `pnpm -s ludi -- room ready --run-dir "$RUN_DIR" --output json`, then `pnpm -s ludi -- match state --run-dir "$RUN_DIR" --output json`. `data.game.config.houseRules` matches those lobby values, including `blockadeCanMoveTogether: false`.
- **Cleanup.** `ludi session close` then `ludi server stop` for this run dir.

## Gotchas

- `--blockade-can-move-together` is not a flag. The parser returns `Unknown option`. The server also forces the field false.
- Only the host can change rules, and only while status is `lobby`.
- CLI create still sends defaults (`extraRollOnCapture: false`, `maxConsecutiveSixes: 2`, `playForPlacements: true`). The toggle is the `house-rules` command after create, not create flags.
