# HTTP health

Read-only probes that the Ludi server process is up and identifies as Ludi.

## Sub-features

- `http-health` hits `GET /health`.
- `http-info` hits `GET /` for service identity.
- `doctor` aggregates health, identity, session_bridge, and run-dir process checks (`worth_driving` needs health + identity).

## How to get to it (user POV)

- Open `http://127.0.0.1:<port>/health` (or `/`) in a browser. The Expo app's socket connection status is a different signal — it does not call these HTTP probes.
- Via `ludi`: `ludi http health`, `ludi http info`, `ludi doctor`.

## Driving it with ludi

Preconditions:

- A server is listening (managed via `ludi server start` or intentional `--url`).

- **Health.** Run `pnpm -s ludi -- http health --run-dir "$RUN_DIR" --output json`. Exit `0`. `data.body.status` is `ok`.
- **Info.** Run `pnpm -s ludi -- http info --run-dir "$RUN_DIR" --output json`. `data.body.service` is `Ludi Server`.
- **Doctor.** Run `pnpm -s ludi -- doctor --run-dir "$RUN_DIR" --output json`. `data.worth_driving` is `true` when `health` and `identity` pass (doctor also reports `session_bridge` and run-dir process checks).

## Gotchas

- Doctor without a server returns a JSON error whose `hint` starts with `ludi server start`.
- Auth HTTP routes (`/auth/guest`, …) need Supabase. They are out of scope for this map until configured.
