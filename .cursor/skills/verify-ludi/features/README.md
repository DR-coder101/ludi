# Ludi verification map

Maintained source for verifying Ludi behavior agents can drive. Read this index, then the matching feature file.

## Surface

Primary: Ludi server over HTTP + Socket.IO (guest room, lobby, match, solo vs bots).

Screens: Expo web export of `apps/mobile` at 390×844, driven by `ludi screens`. Routes are `/dev/home`, `/dev/lobby`, `/dev/board?state=start`, `/dev/board?state=video`, `/dev/win`. No simulator is required.

`baselines/emulator/` holds owner-approved simulator shots for humans. `ludi screens check` compares against `baselines/web/`, which are Chromium captures of the same fixtures. They will not match the emulator files.

## Baseline preconditions

- Use a disposable run dir: `--run-dir /tmp/ludi-v-$RUN_ID` (or `LUDI_RUN_DIR`).
- Invoke the **`ludi`** binary only (`pnpm ludi -- …`). Never a second binary name.
- Server recipes: run `ludi doctor --run-dir … --output json` and require `worth_driving`.
- Screen recipes: run `ludi screens doctor --output json` and require `worth_driving`. Install Chromium with `pnpm --dir tools/ludi exec playwright install chromium`.
- Never drive a server this run did not start unless `--url` is intentional. For screens, `--url` means an Expo web export already being served.
- Mutating recipes: prefer `--dry-run` once before the live call.

## Driving conventions

- Start from baseline unless a feature file says otherwise.
- Treat every `ludi` argv as literal.
- Progressive disclosure: `ludi --help` → `ludi <module> --help` → leaf.
- Restore nothing that deletes `"$RUN_DIR/evidence/"`.

## Proof and skip reporting

- Capture the `ludi` command, JSON stdout, and exit code.
- Mutation proof includes the evidence JSON under the run dir (and a copy under `.cursor/skills/verify-ludi/artifacts/` when bootstrapping).
- Screen proof includes `"$RUN_DIR/evidence/screens/<id>.png"` and, on failure, the sibling `.diff.png`.
- Record the feature ID and entry point with every artifact.
- Report an unreachable path with the attempted `ludi` command and unmet precondition.

## Feature entry contract

Each feature file: H1, one paragraph, then exactly `Sub-features`, `How to get to it (user POV)`, `Driving it with ludi`, `Gotchas`.

## Features

- [Solo vs bots](./solo-vs-bots.md) covers alone-in-lobby start, bot seat fill, and a human turn.
- [Guest room create](./guest-room.md) covers host room creation and the join code.
- [Lobby ready (multiplayer)](./lobby-ready.md) covers two humans (two run dirs) starting without bot fill.
- [HTTP health](./http-health.md) covers `/health` and server identity probes.
- [House-rules lobby toggles](./house-rules.md) covers host toggles before start, including that `blockadeCanMoveTogether` stays false.
- [Reconnect rejoin](./reconnect-rejoin.md) covers dropping a seat and `room join` with the saved session on an in-progress match.
- [Single-6 come-out](./come-out.md) covers one yard piece per 6, two on 6-6 (GAME_RULES.md §3).
- [Match history](./match-history.md) covers `GET /matches/:userId` for a finished match, and the Supabase prerequisite.
- [Home screen](./home-screen.md) covers `/dev/home` screenshot vs `baselines/web/home.png`.
- [Lobby screen](./lobby-screen.md) covers `/dev/lobby` screenshot vs `baselines/web/lobby.png`.
- [Board screen](./board-screen.md) covers `/dev/board?state=start`, `/dev/board?state=video`, 68-cell track, 7-cell home columns, empty unused yards in 2-player, two dice, single-6 come-out, and the yard video tiles plus call bar.
- [Win screen](./win-screen.md) covers `/dev/win` screenshot vs `baselines/web/win.png`.
