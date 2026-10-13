# Admin screens

The streamer admin panel at `apps/live-admin` paints Setup, Settings, Live Dashboard, Kick confirm, and the five Error screens from an `AdminView`. Dean's approved mockups in `docs/live/admin/` are the visual spec. Command words include `!stay`.

## Sub-features

- `admin-demo` loads `/?demo=<id>&settle=1` with no live host.
- `admin-mockup-diff` reports pixel drift against `docs/live/admin/<file>.png` and does not fail the check.
- Overlay URL on Setup is `http://localhost:4747/overlay`. Port-in-use offers `4748`.

## How to get to it (user POV)

- Run the unsigned Windows download (`pnpm --filter live-admin pack:win`) or `pnpm --filter live-admin start` after a UI build.
- Via `ludi`: `screens check --target admin` builds the Vite app and captures the 13 demo fixtures.

## Driving it with ludi

Preconditions:

- `pnpm install` at the monorepo root.
- `pnpm --dir tools/ludi exec playwright install chromium` once per machine.
- `pnpm -s ludi -- screens doctor --output json` reports `worth_driving`.

- **Baseline.** Run `pnpm -s ludi -- screens check --target admin --run-dir "$RUN_DIR" --output json`. Exit 0. Each `data.results[*].ok` is true. Mockup diffs land in `data.mockup_diff` with a percent.
- **Record.** `"$RUN_DIR/evidence/admin/<id>.png"` and `"$RUN_DIR/evidence/admin.json"` survive teardown.
- **Drift.** Exit 5. Open `"$RUN_DIR/evidence/admin/<id>.diff.png"`. Update admin baselines only when the visual change is intended: `ludi screens check --target admin --update-baselines`.
- **Cleanup.** None beyond the command itself. Do not delete `"$RUN_DIR/evidence/"`.

## Gotchas

- `--screen all` stays on the Expo phone fixtures. Admin needs `--target admin` or an admin screen id.
- Capture uses `prefers-reduced-motion: reduce` and `settle=1`.
- Settings lists `!stay` between `!move` and `!leave`. The approved mockup did not. That wording gap is intended.
- `dashboard.png` diffs against mockup `live-dashboard.png`. `kick-confirm.png` diffs against `kick-player-confirm.png`.
