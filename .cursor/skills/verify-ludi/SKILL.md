---
name: verify-ludi
description: "Drive and prove Ludi server behavior (guest room, lobby, match, solo vs bots) through the `ludi` CLI. Use when verifying Ludi features, after server/lobby/match changes, or when an agent needs scripted proof without the Expo mobile UI."
---

# Verify Ludi

Drive the Ludi server the way Dean's app does: guest room, lobby, match, including solo vs bots. The agent-reachable surface is HTTP + Socket.IO via the **`ludi`** binary. Not Expo, not a browser, not a second harness.

Binary and top-level command: `ludi`. Subcommands hang under it (`ludi doctor`, `ludi play solo-vs-bots`). Never invent `ludi-verify` or `verify` as a command name.

## Launch

From the monorepo root (after `pnpm install`):

```bash
RUN_DIR=/tmp/ludi-v-$RANDOM
pnpm -s ludi -- server start --run-dir "$RUN_DIR" --port 3100 --output json
```

Ready when `pnpm -s ludi -- doctor --run-dir "$RUN_DIR" --output json` reports `worth_driving: true`.

Deep flows can start their own server:

```bash
pnpm -s ludi -- play solo-vs-bots --run-dir "$RUN_DIR" --turns 1 --port 3100 --output json
```

Teardown (only what this run started):

```bash
pnpm -s ludi -- session close --run-dir "$RUN_DIR" --output json
pnpm -s ludi -- server stop --run-dir "$RUN_DIR" --output json
```

Evidence under `"$RUN_DIR/evidence/"` survives teardown.

## Doctor

```bash
pnpm -s ludi -- doctor --run-dir "$RUN_DIR" --output json
```

Require `data.worth_driving === true`. If false, `error.hint` names the next `ludi` command. Run doctor first whenever anything looks off.

## Drive

Discover gradually, then drive. Only call **`ludi`**.

```bash
pnpm -s ludi -- --help
pnpm -s ludi -- play --help
pnpm -s ludi -- introspect
```

Prefer deep flows from the feature map:

```bash
pnpm -s ludi -- play solo-vs-bots --run-dir "$RUN_DIR" --turns 1 --output json
```

Compose when a recipe says so: `ludi server` → `ludi session open` → `ludi room …` → `ludi match …`.

Every mutating command accepts `--dry-run` (exit 9, `planned_actions`, no side effects).

JSON envelope on stdout: `{ ok, command, data|error|planned_actions, meta }`. On failure, `error.hint` is the next `ludi …` command to run. Use `pnpm -s` so stdout is JSON-only.

## Evidence

- Exercise the real user path (room create → ready → match), not internal setters.
- Capture action and resulting state: command stdout JSON plus `"$RUN_DIR/evidence/<feature>.json"`.
- Proof standards: bots filled / game phase / turn results in the evidence file; doctor worth_driving before drive; exit code 0 on success.
- Named proof location for this skill's bootstrap run: `.cursor/skills/verify-ludi/artifacts/`.

## Cleanup

```bash
pnpm -s ludi -- session close --run-dir "$RUN_DIR" --output json
pnpm -s ludi -- server stop --run-dir "$RUN_DIR" --output json
```

Kill only PIDs recorded in the run dir. Never kill by process name. Do not delete `"$RUN_DIR/evidence/"`.

## Helpers

| Invoke | Role |
|--------|------|
| `pnpm -s ludi -- …` | Root script; JSON-only stdout (preferred) |
| `./tools/ludi/bin/ludi …` | Direct bin, same argv |
| `pnpm --dir tools/ludi exec tsx src/cli.ts …` | Package-local |

Package docs: `tools/ludi/.cli/README.md`. Feature recipes: `features/`.
