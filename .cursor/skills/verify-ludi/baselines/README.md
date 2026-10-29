# Screen baselines

These PNG sets are not interchangeable. Phone web, tablet, overlay, and admin each have their own directory.

## `emulator/`

Owner-approved iOS simulator shots of the four rebuilt screens. Human context only. Do not compare these in CI. Chromium/Expo web will not match them pixel for pixel.

## `web/`

Machine baselines. `ludi screens check` captures Expo web at 390×844 CSS pixels with device scale 2 (780×1688) and `prefers-reduced-motion: reduce`, then pixelmatches against these files.

Regenerate from current `main` (or the branch under test):

```bash
pnpm -s ludi -- screens check --update-baselines --run-dir /tmp/ludi-screens --output json
```

A failing check writes `<id>.diff.png` next to the actual under `"$RUN_DIR/evidence/screens/"`.

## `tablet/`

Machine baselines for Android 10" tablet dp. `ludi screens check --target tablet` captures the same `/dev` fixtures at 800×1280 portrait and 1280×800 landscape with device scale 1 and `prefers-reduced-motion: reduce`, then pixelmatches these files. Layout assertions (no horizontal overflow, board square and on-screen, controls tappable at 44 dp, no clip) run on every capture. Rows in `TABLET_KNOWN_FAILURES` keep today's phone layout from failing CI. Pixel drift cannot be waived that way.

Regenerate:

```bash
pnpm -s ludi -- screens check --target tablet --update-baselines --run-dir /tmp/ludi-tablet --output json
```

A failing check writes `<id>.diff.png` under `"$RUN_DIR/evidence/tablet/"` and `tablet.json` with each layout row. There is no capture fixture on main.

## `overlay/`

Machine baselines for the 1080×1920 OBS overlay. `ludi screens check --target overlay` captures demo fixtures with `settle=1` and `prefers-reduced-motion: reduce`, then pixelmatches these files. Wonder-diff is informational and does not fail the check.

Regenerate:

```bash
pnpm -s ludi -- screens check --target overlay --update-baselines --run-dir /tmp/ludi-overlay --output json
```

A failing check writes `<id>.diff.png` under `"$RUN_DIR/evidence/overlay/"`.

## `admin/`

Machine baselines for the streamer admin panel. `ludi screens check --target admin` captures demo fixtures at the mockup viewport (1024 wide) with `settle=1` and `prefers-reduced-motion: reduce`, then pixelmatches these files. Mockup-diff against `docs/live/admin/` is informational and does not fail the check.

Regenerate:

```bash
pnpm -s ludi -- screens check --target admin --update-baselines --run-dir /tmp/ludi-admin --output json
```

A failing check writes `<id>.diff.png` under `"$RUN_DIR/evidence/admin/"`.
