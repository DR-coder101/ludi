# Tablet screens

Android 10" tablet dp captures of the same Expo web `/dev` fixtures used for phone CI. Portrait is 800×1280. Landscape is 1280×800. Device scale is 1, so one CSS pixel is one dp. Layout assertions run on every shot. Pixel drift cannot be waived.

## Sub-features

- `tablet-home` is `/dev/home` at both viewports.
- `tablet-lobby` is `/dev/lobby` at both viewports. There is no `/dev/capture` fixture.
- `tablet-board` is `/dev/board?state=start` and `/dev/board?state=video`. The board must stay square and inside the viewport.
- `tablet-win` is `/dev/win` at both viewports.
- `tablet-known` is `TABLET_KNOWN_FAILURES`. A listed failure that starts passing fails CI until the row is removed.

## How to get to it (user POV)

- On an Android 10" tablet, open the Expo app. Android locks `expo.orientation` to portrait, so landscape is a CI viewport, not a native rotation.
- Via `ludi`: `screens check --target tablet` exports Expo web and captures the ten shots.

## Driving it with ludi

Preconditions:

- `pnpm install` at the monorepo root.
- `pnpm --dir tools/ludi exec playwright install chromium` once per machine.
- `pnpm -s ludi -- screens doctor --output json` reports `worth_driving`.

- **Baseline.** Run `pnpm -s ludi -- screens check --target tablet --run-dir "$RUN_DIR" --output json`. Exit 0. Each `data.results[*].ok` is true. Layout rows in `data.layout` may fail when they are listed in `TABLET_KNOWN_FAILURES`. A listed row that now passes fails the check.
- **Record.** `"$RUN_DIR/evidence/tablet/<id>-<viewport>.png"` and `"$RUN_DIR/evidence/tablet.json"` survive teardown. `data.orientation.android_locked` is true for current `apps/mobile/app.json`.
- **Drift.** Exit 5. Open `"$RUN_DIR/evidence/tablet/<id>-<viewport>.diff.png"` or `tablet.json`. Update tablet baselines only when the pixels are intended: `ludi screens check --target tablet --update-baselines`.
- **Cleanup.** None beyond the command itself. Do not delete `"$RUN_DIR/evidence/"`.

## Gotchas

- `--screen all` stays on the Expo phone fixtures. Tablet needs `--target tablet`.
- `/dev` fixtures still apply iPhone 14 `PHONE_INSETS` on web. Do not change that for tablet CI.
- `/dev/lobby` omits `onSelectSeat`, so the Montego Bay open seat is a labeled view. The check reads that label.
- Capture uses `prefers-reduced-motion: reduce`. Do not expect press-scale or dice tumble in the baseline.
- Current known failures are Create room and Join code at 42px tall, Roll the dice at 42px tall, and landscape START GAME below the 800px fold. Proof shots live in `artifacts/tablet-known-failures/`.
- UI or layout fixes need a mockup Dean approved. This check records the phone layout at tablet size. It does not restyle the app.
