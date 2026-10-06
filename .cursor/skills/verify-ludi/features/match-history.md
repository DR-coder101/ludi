# Match history

A finished match is listed for the player at `GET /matches/:userId`. The Expo history screen reads that list.

## Sub-features

- `history-get` calls `ludi http matches --user-id`.
- `history-unavailable` treats HTTP 503 `Match history service not available` as the missing-Supabase prerequisite.
- `history-finished` expects a finished match for that user id in `body.matches` when the service is up.

## How to get to it (user POV)

- In the Expo app: sign in, play a match to completion, open History.
- Via `ludi`: finish (or already have) a match, then `http matches --user-id` with that player's id.

## Driving it with ludi

Preconditions:

- A server URL (`--run-dir` after `server start`, or `--url`).
- A `user-id`. After `room create`, `session.json` / `data.player_id` is the in-room player id. Auth users use their account id. Guests are not Supabase users.

- **Probe.** Run `pnpm -s ludi -- http matches --user-id "$USER_ID" --run-dir "$RUN_DIR" --output json`. Exit `0` when the HTTP call returns JSON (including 503/500). Read `data.status` and `data.body`.
- **No service.** If `data.status` is `503` and `data.body.error` is `Match history service not available`, the feature is `verified-unreachable`. Prerequisite: `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` on the server. Local `ludi server start` usually has neither.
- **Service up, finished match.** After the match reaches `phase: "finished"`, probe again with the same user id. Expected when persist succeeded: `data.body.success` is `true` and `data.body.matches` contains an entry whose players include that user id.
- **Production, read-mostly.** `pnpm -s ludi -- http matches --user-id test-user --url https://server-production-3749.up.railway.app --output json` is a safe GET. Do not start or finish matches on production. A 500 `Failed to fetch match history` means the service is wired but the query failed (often a dummy or guest id).
- **Cleanup.** None for the GET. Stop only a server this run started.

## Gotchas

- `http matches` does not fail the CLI on 503/500. The recipe asserts `data.status` / `data.body.error`. That is deliberate so an agent can record unreachable vs listed.
- `saveMatch` uses in-room `playerId` as `userId`. Guest ids are not rows in `users`, so a finished local guest match may never appear even when Supabase is configured. That is a product gap, not a skill-map lie.
- Auth HTTP (`/auth/guest`, …) is still out of scope until configured, same as `features/http-health.md`.
