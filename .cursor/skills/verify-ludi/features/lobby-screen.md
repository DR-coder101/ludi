# Lobby screen

The host lobby shows the five-character room code, four colour seats, house-rule toggles, voice/video, and START GAME. Unused seats stay invitational. The rebuilt fixture is `/dev/lobby` (Dean host, Shanice ready, Andre joined, yellow empty).

## Sub-features

- `lobby-code` prints the 5-character code `7X8K9` on the fixture.
- `lobby-seats` shows four yards' colours: Kingston (red, you), Ocho Rios (green), Negril (blue), Montego Bay (yellow invite).
- `lobby-start` enables START GAME once at least two players are present (`· 3 players` on this fixture).

## How to get to it (user POV)

- In the Expo app: Online Multiplayer → create room. Guests join with the code (`/lobby/[code]`).
- Via `ludi` server: `room create` then a second session `room join` (see [lobby-ready](./lobby-ready.md)).
- Via `ludi` screens: `screens check --screen lobby` loads `/dev/lobby`.

## Driving it with ludi

Preconditions:

- Screens doctor is green (`worth_driving`).
- Chromium is installed for this Playwright version.

- **Baseline.** Run `pnpm -s ludi -- screens check --screen lobby --run-dir "$RUN_DIR" --output json`. Exit 0. The capture waits for the heading `PRIVATE ROOM`.
- **Record.** `"$RUN_DIR/evidence/screens/lobby.png"`.
- **Server path.** Lobby *behavior* (two humans, no bot fill) is still [lobby-ready](./lobby-ready.md). This file proves the rebuilt lobby *pixels*.
- **Cleanup.** Keep evidence.

## Gotchas

- `/dev/lobby?state=host` and `?state=guest` map a server-shaped `RoomState`. The committed screenshot is the mockup fixture (`/dev/lobby` with no query), not those variants.
- House-rule toggles on this fixture are the Jamaican defaults. `blockadeCanMoveTogether` stays false. Changing toggles in the UI is not part of the screenshot check.
- Web vs emulator: same rule as the other screens. Diff against `baselines/web/lobby.png`.
- At 390×844 on Expo web the house-rule row and START GAME sit below the fold. The native emulator shot fits them. The web baseline is the un-scrolled viewport, not a full-page capture.
