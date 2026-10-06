# Reconnect rejoin

A dropped seat reattaches to its in-progress match. `room join` without a session token on a started match returns "Room is not in lobby state". Rejoin is bridge `room.join` with the saved session.

## Sub-features

- `rejoin-drop` disconnects the bridge without `room leave`, leaving `session.json` in place.
- `rejoin-token` opens a new session and calls `room join` with that token (hydrated from `session.json` or `--session-token`).
- `rejoin-lobby-reject` proves a tokenless join to the same started room fails with "Room is not in lobby state".

## How to get to it (user POV)

- In the Expo app: background or lose the socket mid-match; the client reconnects with the seat session token and keeps the same colour.
- Via `ludi`: `session close` (no leave), `session open`, `room join --code …` in the same run dir.

## Driving it with ludi

Preconditions:

- Start the server with a long disconnect grace so the seat is not swapped to AI before rejoin: `pnpm -s ludi -- server start --run-dir "$HOST_DIR" --port 3120 --grace-ms 60000 --output json`.
- Doctor is green. `session open` and `room create --name Dean` succeeded. Capture `data.room_code` and `session.json`'s `player_id` / `session_token`.
- `room ready` started the match (solo vs bots is fine). `match state` shows a live `game`.

- **Drop.** Run `pnpm -s ludi -- session close --run-dir "$HOST_DIR" --output json`. Do not run `room leave`. `session.json` still has `session_token`.
- **Reopen.** Run `pnpm -s ludi -- session open --run-dir "$HOST_DIR" --output json`. The new bridge hydrates the saved token.
- **Rejoin.** Run `pnpm -s ludi -- room join --code "$CODE" --name Dean --run-dir "$HOST_DIR" --output json`. Exit `0`. `data.is_reconnect` is `true`. `data.player_id` equals the saved `player_id`.
- **Still in play.** Run `pnpm -s ludi -- match state --run-dir "$HOST_DIR" --output json`. `data.game` is present and `data.my_player_id` is the same seat.
- **Tokenless reject.** In a fresh `$GUEST_DIR`, `session open --url` to the host server, then `room join --code "$CODE" --name Intruder` with no `session.json` token. Exit non-zero. `error.message` contains `Room is not in lobby state`.
- **Cleanup.** Close guest and host sessions, then `server stop` on `$HOST_DIR`.

## Gotchas

- Default `--grace-ms` is `500`. Rejoin after that window marks the seat `ai-substitute`. Use `--grace-ms 60000` for this recipe.
- `session close` drops the socket. That is the disconnect. `room leave` deletes the seat and is the wrong drop.
- A new `session open` used to start with an empty token. The bridge now reads `session.json`. You can still pass `--session-token` explicitly.
- Handshake `auth.token` auto-reattach is what the mobile app uses. This skill proves the `room.join` path named in the map.
