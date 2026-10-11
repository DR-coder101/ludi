# Overlay screens

The OBS / TikTok LIVE browser-source overlay at `apps/live-overlay` paints Intro, Waiting, Game, Turn, and Winner from `@ludi/live-game` snapshots. Dean's Wonder artboards in `docs/live/wonder/` are the visual spec.

## Sub-features

- `overlay-demo` loads `/?demo=intro|waiting|game|turn|winner&settle=1` with no live server.
- `overlay-safe-zone` asserts every `[data-safe]` box sits inside x 100-980 and y 40-1380.
- `overlay-wonder-diff` reports pixel drift against `docs/live/wonder/<artboard>/screenshot.png` and does not fail the check.

## How to get to it (user POV)

- In OBS or TikTok LIVE Studio: add a Browser Source pointing at the overlay URL, 1080×1920.
- Via `ludi`: `screens check --target overlay` builds the Vite app and captures the five demo fixtures.

## Driving it with ludi

Preconditions:

- `pnpm install` at the monorepo root.
- `pnpm --dir tools/ludi exec playwright install chromium` once per machine.
- `pnpm -s ludi -- screens doctor --output json` reports `worth_driving`.

- **Baseline.** Run `pnpm -s ludi -- screens check --target overlay --run-dir "$RUN_DIR" --output json`. Exit 0. Each `data.results[*].ok` is true. Safe-zone misses fail the check. Wonder diffs land in `data.wonder_diff` with a percent.
- **Record.** `"$RUN_DIR/evidence/overlay/<id>.png"` and `"$RUN_DIR/evidence/overlay.json"` survive teardown.
- **Drift.** Exit 5. Open `"$RUN_DIR/evidence/overlay/<id>.diff.png"`. Update overlay baselines only when the visual change is intended: `ludi screens check --target overlay --update-baselines`.
- **Cleanup.** None beyond the command itself. Do not delete `"$RUN_DIR/evidence/"`.

## Gotchas

- `--screen all` stays on the Expo phone fixtures. Overlay needs `--target overlay` or an `overlay-*` screen id.
- Capture uses `prefers-reduced-motion: reduce` and `settle=1`. Do not expect intro drop-ins or the turn-card slam in the baseline.
- The Waiting and Game badges read `WINNER CAN STAY`. Wonder's Waiting and Game artboards still say `WINNER STAYS`. That wording gap is intended.
- The live board is SVG. Wonder's v4 board is one flat PNG. Wonder-diff will stay well above 0% on game and turn.
