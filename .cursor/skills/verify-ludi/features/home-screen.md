# Home screen

The landing screen is Dean's approved Home lobby: profile chip, LUDI hero, play-with-friends, quick match, vs bots, pass-and-play, weekly/town leaderboards, and a tournaments teaser.

## Sub-features

- `home-guest` is `/dev/home` with empty real-data states: Play with friends, Quick match, VS Bots, Pass & Play, empty leaderboards, Coming soon tournaments.
- `home-a11y` exposes the header "Ludi. Jamaican Rules. Four corners, one board."

## How to get to it (user POV)

- In the Expo app: cold start on `/` (or `/dev/home` in `__DEV__` / `EXPO_PUBLIC_DEV_ROUTES=1`).
- Via `ludi`: `screens check --screen home` loads `/dev/home` on the Expo web export.

## Driving it with ludi

Preconditions:

- `pnpm install` at the monorepo root.
- `pnpm --dir tools/ludi exec playwright install chromium` once per machine.
- `pnpm -s ludi -- screens doctor --output json` reports `worth_driving`.

- **Baseline.** Run `pnpm -s ludi -- screens check --screen home --run-dir "$RUN_DIR" --output json`. Exit 0. `data.results[0].ok` is true. The capture waits for the Ludi header, then screenshots 390×844 @2x.
- **Record.** `"$RUN_DIR/evidence/screens/home.png"` and `"$RUN_DIR/evidence/screens.json"` survive teardown.
- **Drift.** Exit 5. Open `"$RUN_DIR/evidence/screens/home.diff.png"`. Update web baselines only when the visual change is intended: `ludi screens check --update-baselines`.
- **Cleanup.** None beyond the command itself. Do not delete `"$RUN_DIR/evidence/"`.

## Gotchas

- Compare `baselines/web/home.png`, not `baselines/emulator/home.png`. The emulator file is human context. Expo web and the simulator do not match pixel for pixel.
- `/dev/home` is gated. The export must set `EXPO_PUBLIC_DEV_ROUTES=1`. A production export redirects `/dev/home` to `/`.
- Reduced motion is on during capture. Do not expect press-scale animations in the baseline.
