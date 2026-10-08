# Match history

A finished match is listed at `GET /matches/:userId`. The Expo history screen reads that list. `userId` is the Supabase user id carried by the socket handshake access token. `ludi auth guest` returns that id as `data.user_id` and stores it as `auth_user_id` in `session.json`.

## Sub-features

- `history-get` calls `ludi http matches --user-id`.
- `history-unavailable` treats HTTP 503 `Match history service not available` as the missing-Supabase prerequisite.
- `history-finished` expects a finished match for that user id in `body.matches` when the service is up.

## How to get to it (user POV)

- In the Expo app, sign in or start as a guest, play a match to completion, and open History.
- From `ludi`, run `auth guest`, then `session open`, finish a match, and call `http matches --user-id` with `data.user_id` from `auth guest`.

## Driving it with ludi

Preconditions:

- A server URL (`--run-dir` after `server start`, or `--url`).
- The guest user id from `ludi auth guest`. Pass `data.user_id`. `room create` writes a different id, `player_id`, for the in-room seat.

Run `auth guest` before `session open`. The bridge sends handshake auth only when the socket connects. If a bridge is already open, run `session close`, then `session open`.

```bash
pnpm -s ludi -- auth guest --name Verifier --url "$URL" --run-dir "$RUN" --output json
pnpm -s ludi -- session close --run-dir "$RUN" 2>/dev/null || true
pnpm -s ludi -- session open --url "$URL" --run-dir "$RUN" --output json
```

Set `USER_ID` from `data.user_id` in the `auth guest` JSON. Then create a room and play until the match is finished.

- **Probe.** Run `pnpm -s ludi -- http matches --user-id "$USER_ID" --run-dir "$RUN_DIR" --output json`. Exit `0` when the HTTP call returns JSON (including 503/500). Read `data.status` and `data.body`.
- **No service.** If `data.status` is `503` and `data.body.error` is `Match history service not available`, the feature is `verified-unreachable`. Prerequisite: `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` on the server. Local `ludi server start` usually has neither.
- **Service up, finished match.** After the match reaches `phase: "finished"`, probe again with the same guest user id. Expected when persist succeeded: `data.body.success` is `true` and `data.body.matches` contains an entry whose players include that user id.
- **Production, read-mostly.** `pnpm -s ludi -- http matches --user-id test-user --url https://server-production-3749.up.railway.app --output json` is a safe GET. Do not start or finish matches on production. A 500 `Failed to fetch match history` means the service is wired but the query failed.
- **Cleanup.** None for the GET. Stop only a server this run started.

## Gotchas

- `http matches` does not fail the CLI on 503/500. The recipe asserts `data.status` / `data.body.error`. That is deliberate so an agent can record unreachable vs listed.
- `auth guest` stores `access_token` in `session.json` and prints it as `data.access_token`. Treat that value as a secret.
- An open bridge keeps the handshake it connected with. Close it and open it again after `auth guest`.
