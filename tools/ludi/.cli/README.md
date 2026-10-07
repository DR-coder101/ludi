# ludi CLI

Agent-friendly control surface for the **Ludi server** (HTTP + Socket.IO) and **Expo web screens**.

## Surface

| Driven | Not driven |
|--------|------------|
| Server HTTP (`/`, `/health`, `/matches/:userId` when history is configured) | Device simulators |
| Socket.IO lobby (`room:*`) and match (`game:*`) | LiveKit video |
| Solo host → vs bots (`room:ready` alone fills AI seats) | Native iOS/Android pixels |
| Expo web `/dev/home`, `/dev/lobby`, `/dev/board?state=start`, `/dev/win` at 390×844 | `baselines/emulator/` (human context only) |

Dean drives the Expo app against this server. Agents prove server behavior with `ludi play` / `ludi room`. Agents prove the four rebuilt screens with `ludi screens check` against `baselines/web/`.

## Progressive discovery

```bash
ludi --help                 # modules only
ludi play --help            # deep flows
ludi screens --help         # Expo web screenshots
ludi play solo-vs-bots --help
ludi introspect             # full JSON command tree
```

## Contracts

- **JSON by default** (`--output json`): `{ ok, command, data|error, meta }`
- **`--dry-run`** on every mutating command → exit `9`, `planned_actions` only
- **Exit codes**: 0 success, 2 args, 3 not found, 5 conflict (including screen drift), 6 timeout, 7 upstream, 8 precondition, 9 dry-run
- **Errors include a hint** telling the agent what to run next

## Preferred deep flow

```bash
ludi play solo-vs-bots --run-dir /tmp/ludi-v1 --turns 1 --output json
```

Evidence lands in `/tmp/ludi-v1/evidence/solo-vs-bots.json` and survives server/session teardown.

## Screen check

```bash
pnpm --dir tools/ludi exec playwright install chromium
ludi screens doctor --output json
ludi screens check --run-dir /tmp/ludi-v1 --output json
```

Exports `apps/mobile` for web with `EXPO_PUBLIC_DEV_ROUTES=1`, screenshots the four `/dev` fixtures, and pixelmatches `/.cursor/skills/verify-ludi/baselines/web`. Drift writes `<id>.diff.png` under the run dir evidence folder and exits 5.

`--update-baselines` overwrites the web baselines from the current capture. Do not copy emulator PNGs into `baselines/web`.

## Compose (shallow)

```bash
ludi server start --run-dir /tmp/ludi-v1 --port 3100
ludi doctor --run-dir /tmp/ludi-v1
ludi session open --run-dir /tmp/ludi-v1
ludi room create --name Dean
ludi room ready
ludi match play-turn
ludi session close
ludi server stop --run-dir /tmp/ludi-v1
```

## Isolation

Use a unique `--run-dir` per concurrent agent. Do not drive a server you did not start unless `--url` is intentional. For `screens check`, `--url` is an already-served Expo web export.
