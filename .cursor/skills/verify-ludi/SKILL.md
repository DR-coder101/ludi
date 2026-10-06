---
name: verify-ludi
description: "Drive and prove Ludi through the `ludi` CLI: server flows (guest room, lobby, match, solo vs bots) and Expo web screenshots of home, lobby, board, and win. Use when verifying Ludi features, after server or apps/mobile UI changes, or when an agent needs scripted proof without an emulator."
---

# Verify Ludi

Drive Ludi the way Dean's app does. The agent-reachable surface is the **`ludi`** binary.

Two modules:

- Server: HTTP + Socket.IO (`ludi server`, `ludi session`, `ludi room`, `ludi match`, `ludi play`).
- Screens: Expo web export of `apps/mobile` plus headless Chromium (`ludi screens`). Fixed phone size 390×844 @2x. Compares to committed **web** baselines.

Never invent `ludi-verify` or `verify` as a command name. Subcommands hang under `ludi`.

The four PNGs under `baselines/emulator/` are owner-approved simulator shots for human context. They are not the comparison target. `ludi screens check` captures Chromium/Expo web and diffs against `baselines/web/`. Those web shots are not pixel-identical to the emulator set.

## Launch

From the monorepo root (after `pnpm install`):

Server:

```bash
RUN_DIR=/tmp/ludi-v-$RANDOM
pnpm -s ludi -- server start --run-dir "$RUN_DIR" --port 3100 --output json
```

Ready when `pnpm -s ludi -- doctor --run-dir "$RUN_DIR" --output json` reports `worth_driving: true`.

Screens (Linux VM, no Android emulator):

```bash
pnpm --dir tools/ludi exec playwright install chromium
pnpm -s ludi -- screens doctor --output json
```

`screens doctor` is ready when `data.worth_driving` is true. Chromium missing: `pnpm --dir tools/ludi exec playwright install chromium`.

`ludi screens check` exports Expo web with `EXPO_PUBLIC_DEV_ROUTES=1`, serves the export, screenshots `/dev/home`, `/dev/lobby`, `/dev/board?state=start`, `/dev/win`, then pixelmatches `baselines/web/`. Pass `--url http://127.0.0.1:4173` to reuse an export already being served.

Deep server flows can start their own server:

```bash
pnpm -s ludi -- play solo-vs-bots --run-dir "$RUN_DIR" --turns 1 --port 3100 --output json
```

Teardown (only what this run started):

```bash
pnpm -s ludi -- session close --run-dir "$RUN_DIR" --output json
pnpm -s ludi -- server stop --run-dir "$RUN_DIR" --output json
```

`screens check` serves in-process and closes the static server on exit. Evidence under `"$RUN_DIR/evidence/"` survives teardown.

## Doctor

Server:

```bash
pnpm -s ludi -- doctor --run-dir "$RUN_DIR" --output json
```

Require `data.worth_driving === true`. If false, `error.hint` names the next `ludi` command.

Screens:

```bash
pnpm -s ludi -- screens doctor --output json
```

Require `data.worth_driving === true` before `screens check`. Run the matching doctor first whenever anything looks off.

## Drive

Discover gradually, then drive. Only call **`ludi`**.

```bash
pnpm -s ludi -- --help
pnpm -s ludi -- play --help
pnpm -s ludi -- screens --help
pnpm -s ludi -- introspect
```

Prefer deep flows from the feature map:

```bash
pnpm -s ludi -- play solo-vs-bots --run-dir "$RUN_DIR" --turns 1 --output json
pnpm -s ludi -- screens check --run-dir "$RUN_DIR" --output json
pnpm -s ludi -- screens check --screen board-start --run-dir "$RUN_DIR" --output json
```

Compose server recipes when a feature file says so: `ludi server` → `ludi session open` → `ludi room …` → `ludi match …`.

Every mutating command accepts `--dry-run` (exit 9, `planned_actions`, no side effects).

JSON envelope on stdout: `{ ok, command, data|error|planned_actions, meta }`. On failure, `error.hint` is the next `ludi …` command to run. Use `pnpm -s` so stdout is JSON-only.

Screen drift exits with code 5 (`CONFLICT`). The hint names the diff PNG under `"$RUN_DIR/evidence/screens/"`. Intended visual change: `ludi screens check --update-baselines`.

## Evidence

- Exercise the real user path. Server: room create → ready → match, not internal setters. Screens: the `/dev/*` fixture routes that mount the same `HomeLanding`, `LobbyRoom`, `BoardScreen`, and `WinScreen` components as production.
- Capture action and resulting state: command stdout JSON plus `"$RUN_DIR/evidence/<feature>.json"`. Screens also write `"$RUN_DIR/evidence/screens/<id>.png"` and, on drift, `"$RUN_DIR/evidence/screens/<id>.diff.png"`.
- Proof standards: bots filled / game phase / turn results in the evidence file; doctor `worth_driving` before drive; exit code 0 on success; screen pixels within `MAX_DIFF_RATIO` (0.5%) of `baselines/web`.
- Named proof location for this skill's bootstrap run: `.cursor/skills/verify-ludi/artifacts/`.

## Cleanup

```bash
pnpm -s ludi -- session close --run-dir "$RUN_DIR" --output json
pnpm -s ludi -- server stop --run-dir "$RUN_DIR" --output json
```

Kill only PIDs recorded in the run dir. Never kill by process name. Do not delete `"$RUN_DIR/evidence/"`. `screens check` does not leave a PID; it closes Chromium and the static server before exit.

## Helpers

| Invoke | Role |
|--------|------|
| `pnpm -s ludi -- …` | Root script; JSON-only stdout (preferred) |
| `./tools/ludi/bin/ludi …` | Direct bin, same argv |
| `pnpm --dir tools/ludi exec tsx src/cli.ts …` | Package-local |
| `pnpm --dir tools/ludi exec playwright install chromium` | One-time Chromium download for `screens` |

Package docs: `tools/ludi/.cli/README.md`. Feature recipes: `features/`. Baseline policy: `baselines/README.md`.
