# ludi CLI

Agent-friendly control surface for the **Ludi server** (HTTP + Socket.IO).

## Surface

| Driven | Not driven |
|--------|------------|
| Server HTTP (`/`, `/health`, `/matches/:userId` when history is configured) | Expo mobile UI |
| Socket.IO lobby (`room:*`) and match (`game:*`) | Device simulators |
| Solo host → vs bots (`room:ready` alone fills AI seats) | LiveKit video |

Dean drives the Expo app against this server. Agents prove the same server behaviors through this CLI.

## Progressive discovery

```bash
ludi --help                 # modules only
ludi play --help            # deep flows
ludi play solo-vs-bots --help
ludi introspect             # full JSON command tree
```

## Contracts

- **JSON by default** (`--output json`): `{ ok, command, data|error, meta }`
- **`--dry-run`** on every mutating command → exit `9`, `planned_actions` only
- **Exit codes**: 0 success, 2 args, 3 not found, 5 conflict, 6 timeout, 7 upstream, 8 precondition, 9 dry-run
- **Errors include a hint** telling the agent what to run next

## Preferred deep flow

```bash
ludi play solo-vs-bots --run-dir /tmp/ludi-v1 --turns 1 --output json
```

Evidence lands in `/tmp/ludi-v1/evidence/solo-vs-bots.json` and survives server/session teardown.

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

Use a unique `--run-dir` per concurrent agent. Do not drive a server you did not start unless `--url` is intentional.
