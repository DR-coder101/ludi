# Lobby ready (multiplayer)

Two humans share a lobby; the host starts a match without filling bot seats.

## Sub-features

- `lobby-join` adds a second human by room code.
- `lobby-ready-mp` starts with two humans and no AI fill.
- `lobby-game` observes `game` with two player colors.

## How to get to it (user POV)

- In the Expo app: host creates a room; guest joins with the code; host taps Start Game.
- Via `ludi`: two sessions are not modeled as two bridges in one run dir yet. Prefer the deep solo flow for automated proof, or compose create/join with two run dirs when extending this map.

## Driving it with ludi

Preconditions:

- Doctor is green on a managed server.
- This recipe is for extending coverage. Bootstrap proof used solo-vs-bots.

- **Host create.** `ludi room create --name Host` on session A.
- **Guest join.** `ludi room join --code <code> --name Guest` on session B (separate bridge/run when supported).
- **Ready.** Host runs `ludi room ready`. `data.bots` is empty. `data.game.config.playerColors` has length `2`.

## Gotchas

- One run dir currently holds one bridge. Multi-human automation needs two bridges or a future `ludi` session slot. Until then, treat multiplayer ready as mapped but not the bootstrap proof path.
- Solo vs bots is the proven deep path (`features/solo-vs-bots.md`).
