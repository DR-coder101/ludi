# Screen baselines

Two PNG sets. They are not interchangeable.

## `emulator/`

Owner-approved iOS simulator shots of the four rebuilt screens. Human context only. Do not compare these in CI. Chromium/Expo web will not match them pixel for pixel.

## `web/`

Machine baselines. `ludi screens check` captures Expo web at 390×844 CSS pixels with device scale 2 (780×1688) and `prefers-reduced-motion: reduce`, then pixelmatches against these files.

Regenerate from current `main` (or the branch under test):

```bash
pnpm -s ludi -- screens check --update-baselines --run-dir /tmp/ludi-screens --output json
```

A failing check writes `<id>.diff.png` next to the actual under `"$RUN_DIR/evidence/screens/"`.
