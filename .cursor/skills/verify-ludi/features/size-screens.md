# Size screens

Rules-modal layout at a small Android phone (360×640 @2x) and the tablet portrait/landscape sizes. The close button must stay fully on screen and at least 44 dp.

## Sub-features

- `size-small-android` is `/dev/board?state=start&rules=1` at 360×640 with 24/48 Android nav insets.
- `size-tablet` is the same fixture at 800×1280 and 1280×800.
- `size-clip` fails CI when `Got it! Let's Play` is missing, smaller than 44 dp, or outside the 24/48 Android nav insets.

## How to get to it (user POV)

- On a small Android phone, start a game. The first-run rules card sits above the system nav bar. The gold close button stays on screen. The copy scrolls if it is taller than the card.
- Via `ludi`: `screens check --target size` exports Expo web and captures the three shots.

## Driving it with ludi

Preconditions:

- `pnpm install` at the monorepo root.
- `pnpm --dir tools/ludi exec playwright install chromium` once per machine.
- `pnpm -s ludi -- screens doctor --output json` reports `worth_driving`.

- **Baseline.** Run `pnpm -s ludi -- screens check --target size --run-dir "$RUN_DIR" --output json`. Exit 0. Each `data.results[*].ok` is true. Every `data.layout[*].ci_fail` array is empty.
- **Record.** `"$RUN_DIR/evidence/size/rules-<viewport>.png"` and `"$RUN_DIR/evidence/size.json"` survive teardown.
- **Drift.** Exit 5. Open `"$RUN_DIR/evidence/size/rules-<viewport>.diff.png"` or `size.json`. Update size baselines only when the pixels are intended: `ludi screens check --target size --update-baselines`.
- **Cleanup.** None beyond the command itself. Do not delete `"$RUN_DIR/evidence/"`.

## Gotchas

- `--screen all` stays on the Expo phone fixtures. Size needs `--target size`.
- The `/dev` board still applies iPhone 14 `PHONE_INSETS` to the board chrome. The rules card on this fixture uses `ANDROID_NAV_INSETS` `{ top: 24, bottom: 48 }` so the gold button is measured above a 3-button nav bar.
- Capture uses `prefers-reduced-motion: reduce`.
