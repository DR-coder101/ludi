# Board screen

The rebuilt match screen is the 19×19 Jamaican plywood board plus two dice. Geometry follows `docs/GAME_RULES.md` §1–§3: 68-cell track, 7-cell home columns, four corner yards, two dice, and any single 6 bringing one yard piece out.

## Sub-features

- `board-start` is `/dev/board?state=start`: four seated yards, Kingston to move, TAP TO ROLL on two idle dice.
- `board-video` is `/dev/board?state=video`: start yards, a 6 and a 2 to play, the approved yard video tiles (speaking, live, CAM OFF, You), and the call bar. Fixture-driven. No LiveKit connection.
- `board-track` is the 68-cell circuit (17 per arm) from `boardLayout.ts` / `TRACK_SIZE`.
- `board-home-columns` are the four 7-cell centre lanes (`HOME_COLUMN_LENGTH`).
- `board-yards` are four 8×8 corners. A colour missing from `playerColors` stays seated=false: faded yard, no video tile, empty slots (no pieces, no stars). That is 2-player with the unused yards empty.
- `board-dice` always shows two dice. Come-out: a die showing 6 spends itself to move one yard token onto that colour's start cell (GAME_RULES.md §3). 6-6 brings out two. Prove the move on the server with [come-out](./come-out.md); the start screenshot proves the two-dice UI.

## How to get to it (user POV)

- In the Expo app: start a match (online Start Game, or Local pass-and-play). The live route is `/game` or `/game/[code]`.
- Visual QA: `/dev/board?state=start`, `?state=mid`, or `?state=video` when `EXPO_PUBLIC_DEV_ROUTES=1`.
- Via `ludi` screens: `screens check --screen board-start` or `--screen board-video`.
- Via `ludi` server: `play solo-vs-bots` or `room ready` then `match state` (see [solo-vs-bots](./solo-vs-bots.md) and [come-out](./come-out.md)).

## Driving it with ludi

Preconditions:

- Screens doctor is green.
- For come-out *moves*, a managed server as in [come-out](./come-out.md). Do not mix those commands into the screenshot process.

- **Screenshot.** `pnpm -s ludi -- screens check --screen board-start --run-dir "$RUN_DIR" --output json`. Exit 0. Waits for the button named `Roll the dice`. Capture is 390×844 @2x with reduced motion (no dice tumble).
- **Video screenshot.** `pnpm -s ludi -- screens check --screen board-video --run-dir "$RUN_DIR" --output json`. Exit 0. Waits for the button named `Leave video call`. Fixture tiles and call bar. No LiveKit.
- **Geometry to assert while reading the PNG (and `boardLayout.ts`).** 68 track cells. Each arm's middle lane is a 7-cell home column. Four yards. Start fixture seats red, green, yellow, and blue, so every yard holds four pieces.
- **Two-player unused yards.** Not this PNG (the start fixture is four players). Drive a 2-player match with `ludi` (`lobby-ready` then `match state`) or pass `playerColors` of length 2 into `createGame`. `buildBoardModel` sets `yards[color].seated` false for colours off the list. `BoardArt` then draws that yard at 0.5 opacity with empty slots.
- **Single 6 come-out.** `ludi match roll` / `match move` per [come-out](./come-out.md). One 6 → one token `{ zone: "track", cell: start }`. The start screenshot must still show two dice and TAP TO ROLL.
- **Record.** `"$RUN_DIR/evidence/screens/board-start.png"`. On drift, `board-start.diff.png`.
- **Cleanup.** Keep evidence.

## Gotchas

- Machine baseline is `baselines/web/board-start.png`. The emulator shot under `baselines/emulator/` includes the iOS status bar. Chromium does not.
- `/dev/board?state=mid` is a second fixture (pieces on track, 6 and 3 to play). It is not in CI. Add it only with a committed web baseline.
- `/dev/board?state=video` is in CI. Machine baseline is `baselines/web/board-video.png`. Approved mockup is `docs/mockups/board-video-grid.png`.
- Do not change `packages/rules` to "fix" a screenshot. If geometry is wrong, that is a product bug. Report it. Leave the map describing GAME_RULES.md.
