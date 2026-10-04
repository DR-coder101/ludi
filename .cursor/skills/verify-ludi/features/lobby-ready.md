# Lobby ready (multiplayer)

Two humans share a lobby; the host starts a match without filling bot seats.

## Sub-features

- `lobby-join` adds a second human by room code.
- `lobby-ready-mp` starts with two humans and no AI fill.
- `lobby-game` observes `game` with two player colors.

## How to get to it (user POV)

- In the Expo app: host creates a room; guest joins with the code; host taps Start Game.
- Via `ludi`: one managed server, two run dirs (one bridge each). Host uses the managed run dir; guest opens a session with `--url` to that server.

## Driving it with ludi

Preconditions:

- `pnpm install` completed at the monorepo root.
- Fresh `--run-dir` paths for host and guest.
- Doctor is green on the managed host server before the first drive.

- **Host server + session.** `pnpm -s ludi -- server start --run-dir "$HOST_DIR" --port 3100 --output json`, then `doctor`, then `session open --run-dir "$HOST_DIR"`.
- **Host create.** `pnpm -s ludi -- room create --name Host --run-dir "$HOST_DIR" --output json`. Capture `data.room_code`.
- **Guest session.** Resolve the host server URL from `"$HOST_DIR/server.json"`. Run `pnpm -s ludi -- session open --run-dir "$GUEST_DIR" --url "$URL" --output json`.
- **Guest join.** `pnpm -s ludi -- room join --code "$CODE" --name Guest --run-dir "$GUEST_DIR" --url "$URL" --output json`. Lobby has two humans.
- **Ready.** Host runs `pnpm -s ludi -- room ready --run-dir "$HOST_DIR" --output json`. Exit `0`. `data.bots` is `[]`. `data.game.config.playerColors` has length `2`. No `ai-substitute` players.
- **Cleanup.** `session close` on guest and host, then `server stop` on `$HOST_DIR`.

## Gotchas

- One run dir holds one bridge. A second human needs a second `--run-dir` (and `--url` for the guest). A second `session open` in the same run dir CONFLICTS.
- Solo (exactly one human at `room:ready`) fills bots instead — see `features/solo-vs-bots.md`.
