# Win screen

The results poster shows who ran the board: town name, headline, captures/sixes/time, placements, REMATCH and LOBBY. The rebuilt fixture is Dean (Kingston) winning room `7X8K9` in 18:42.

## Sub-features

- `win-poster` is `/dev/win`: header `DEAN RUN DI BOARD!`, kicker `GAME OVER · ROOM 7X8K9`.
- `win-stats` lists CAPTURES 6, SIXES 9, TIME 18:42 on the fixture.
- `win-actions` exposes Rematch and Lobby.

## How to get to it (user POV)

- In the Expo app: first player to get all four tokens home (GAME_RULES.md §9). The live game screen overlays `WinScreen`.
- Visual QA: `/dev/win`, or `?winner=green|yellow|blue`, `?players=2|3`, `?room=none`.
- Via `ludi` screens: `screens check --screen win`.

## Driving it with ludi

Preconditions:

- Screens doctor is green.

- **Baseline.** `pnpm -s ludi -- screens check --screen win --run-dir "$RUN_DIR" --output json`. Exit 0. Waits for the header `DEAN RUN DI BOARD!`.
- **Record.** `"$RUN_DIR/evidence/screens/win.png"`.
- **Reduced motion.** Capture sets `prefers-reduced-motion: reduce`, so the sunburst is still and confetti is already landed. That is required for a stable baseline.
- **Cleanup.** Keep evidence.

## Gotchas

- Diff against `baselines/web/win.png`, not the emulator PNG.
- `?room=none` changes the kicker to PASS & PLAY. CI captures the default room fixture only.
- Winning is first to four tokens home. Server proof of a finished match is [match-history](./match-history.md) when Supabase is configured. This file proves the rebuilt poster pixels.
