# Ludi verification map

Maintained source for verifying Ludi server behavior agents can drive. Read this index, then the matching feature file.

## Surface

Primary: Ludi server over HTTP + Socket.IO (guest room, lobby, match, solo vs bots).

Not driven here: Expo mobile UI (no simulator in this environment). Dean still drives the app against the same server.

## Baseline preconditions

- Use a disposable run dir: `--run-dir /tmp/ludi-v-$RUN_ID` (or `LUDI_RUN_DIR`).
- Invoke the **`ludi`** binary only (`pnpm ludi -- …`). Never a second harness.
- Run `ludi doctor --run-dir … --output json` and require `worth_driving`.
- Never drive a server this run did not start unless `--url` is intentional.
- Mutating recipes: prefer `--dry-run` once before the live call.

## Driving conventions

- Start from baseline unless a feature file says otherwise.
- Treat every `ludi` argv as literal.
- Progressive disclosure: `ludi --help` → `ludi <module> --help` → leaf.
- Restore nothing that deletes `"$RUN_DIR/evidence/"`.

## Proof and skip reporting

- Capture the `ludi` command, JSON stdout, and exit code.
- Mutation proof includes the evidence JSON under the run dir (and a copy under `.cursor/skills/verify-ludi/artifacts/` when bootstrapping).
- Record the feature ID and entry point with every artifact.
- Report an unreachable path with the attempted `ludi` command and unmet precondition.

## Feature entry contract

Each feature file: H1, one paragraph, then exactly `Sub-features`, `How to get to it (user POV)`, `Driving it with ludi`, `Gotchas`.

## Features

- [Solo vs bots](./solo-vs-bots.md) covers alone-in-lobby start, bot seat fill, and a human turn.
- [Guest room create](./guest-room.md) covers host room creation and the join code.
- [Lobby ready (multiplayer)](./lobby-ready.md) covers two humans starting without bot fill.
- [HTTP health](./http-health.md) covers `/health` and server identity probes.
