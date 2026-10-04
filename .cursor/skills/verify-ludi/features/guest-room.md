# Guest room create

A host creates a private online room and receives a five-character join code.

## Sub-features

- `room-create` opens a lobby room as host.
- `room-code` exposes the join code for guests.
- `room-state` shows the host seated in lobby status.

## How to get to it (user POV)

- In the Expo app: Online Multiplayer → enter name → Create Room.
- Via `ludi`: `ludi session open` then `ludi room create`.

## Driving it with ludi

Preconditions:

- `ludi server start --run-dir "$RUN_DIR"` succeeded.
- `ludi doctor --run-dir "$RUN_DIR"` reports `worth_driving`.
- `ludi session open --run-dir "$RUN_DIR"` succeeded.

- **Create.** Run `pnpm -s ludi -- room create --name Dean --run-dir "$RUN_DIR" --output json`. Exit `0`. `data.room_code` is five characters.
- **State.** Run `pnpm -s ludi -- room state --run-dir "$RUN_DIR" --output json`. Lobby status is `lobby` and the host is present.
- **Cleanup.** `ludi session close` then `ludi server stop` for this run dir. Keep any evidence copies you wrote.

## Gotchas

- Room commands require a live session bridge. If you see `PRECONDITION_FAILED`, run the hint: `ludi session open --run-dir …`.
- Disconnecting the bridge mid-lobby marks the host offline but does not delete the room until leave/empty cleanup paths run.
