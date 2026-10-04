# Solo vs bots

A solo host starts a match; empty lobby seats become AI substitutes and the match runs.

## Sub-features

- `solo-create` creates a private room as the only human.
- `solo-ready` starts the match and fills three bot seats.
- `solo-turn` plays one human turn after bots act when needed.
- `solo-evidence` writes proof under the run-dir evidence folder.

## How to get to it (user POV)

- In the Expo app: Online → create room alone → Start Game (detail · vs bots).
- Via `ludi`: `ludi play solo-vs-bots` (preferred deep flow).

## Driving it with ludi

Preconditions:

- `pnpm install` completed at the monorepo root.
- A fresh `--run-dir` path.
- `ludi play solo-vs-bots --dry-run` reviewed once (exit 9).

- **Dry-run.** Plan only. Run `pnpm -s ludi -- play solo-vs-bots --run-dir "$RUN_DIR" --dry-run --output json`. Exit `9`. No `server.json`, no evidence file.
- **Live drive.** Run `pnpm -s ludi -- play solo-vs-bots --run-dir "$RUN_DIR" --turns 1 --port 3100 --output json`. Exit `0`. `data.bots` has length `3`. `data.evidence` points at `"$RUN_DIR/evidence/solo-vs-bots.json"`.
- **Confirm evidence.** Read that evidence file. It names `feature: "solo-vs-bots"`, `result.room_code`, and a `turns` array.
- **Cleanup.** Run `pnpm -s ludi -- server stop --run-dir "$RUN_DIR" --output json` if a managed server was left running. Evidence remains.

## Gotchas

- Solo fill happens only when exactly one human is in the room at `room:ready`. Two humans skip bot fill.
- Default seat is red and turn order starts at red, so the human acts first unless they reseat (e.g. green); then a bot may act before the first `play-turn`.
- `--url` reuses an external server and skips managed start/stop. Prefer a managed server for isolation.
- Do not change `blockadeCanMoveTogether` or vs-bots fill rules from this skill.
