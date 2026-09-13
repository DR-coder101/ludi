# LUDI — Cursor Agent Prompt Pack
### Copy-paste prompts, ordered by milestone. Run ONE at a time. Review the diff before moving on.

**Repo setup first:** create the monorepo from ARCHITECTURE.md §2, then ensure GAME_RULES.md and ARCHITECTURE.md are in docs/. Cursor agents read the repo — these docs are their guardrails.

**Rules of engagement for every session:**
- One prompt = one task. Never "build the whole game."
- After each agent run: `pnpm test` + manually run the app. Fix forward, don't layer prompts on broken code.
- Commit after every green task.

---

## PHASE 0 — Scaffold

**Prompt 0.1 — Monorepo scaffold**
> Create a pnpm + TypeScript monorepo exactly per the layout in docs/ARCHITECTURE.md §2: apps/mobile (Expo SDK 52, expo-router, TypeScript strict), server (Node + Express + Socket.IO, TS strict), packages/rules (pure TS, vitest), packages/protocol (shared types, zod schemas). Wire workspace deps: server and mobile both depend on rules and protocol. Add root scripts: dev:server, dev:mobile, test, lint. No game logic yet — just a booting skeleton with a hello-world socket round-trip (client connects, server replies "pong").

**Prompt 0.2 — Protocol types**
> In packages/protocol, define all Socket.IO event names and payload types listed in docs/ARCHITECTURE.md §3.4, plus RoomState, Player, and RoomConfig (with the houseRules object from docs/GAME_RULES.md §11 GameConfig). Export zod schemas for every client→server payload. Write a README in the package listing every event.

---

## PHASE 1 — Rules engine (M1)

**Prompt 1.1 — Core state + board topology**
> Read docs/GAME_RULES.md fully. In packages/rules, implement: types (Color, TokenPos, GameState, GameConfig per §11), createGame, and board topology helpers: absolute track index mapping per colour, start cell indices (Red=0, Green=13, Yellow=26, Blue=39), safe cells (§7), and path computation for any token (yard→track→homeColumn→home, 57 total steps). Pure functions, immutable state, no I/O. Unit tests for topology: correct start cells, safe cells, home-column entry points for all 4 colours.

**Prompt 1.2 — Movement & legal moves**
> In packages/rules, implement legalMoves(state) per docs/GAME_RULES.md §3–§8: coming out only on 6, blockades (§6) blocking everyone including owner, safe-cell semantics, exact-count home entry, no-legal-move detection. Do NOT implement capture resolution or turn advancement yet — just move generation. Write tests covering edge cases 1, 4, 5, 6, 10 from §10.

**Prompt 1.3 — Capture, sixes, applyMove**
> Implement applyMove with full GameEvent emission (§11): captures (§5 — including the start-cell-safe exception, edge case 8), blockade form/break events, consecutive-six logic with maxConsecutiveSixes house rule (§4, edge case 2), extra_roll only when configured, win detection and placements (§9). Tests for edge cases 2, 3, 7, 8, 9, 11, 12 and a property-style test: random legal games never produce an invalid state (no two opposing tokens on one non-safe cell, blockades never passed).

**Prompt 1.4 — CLI demo game**
> Add a scripts/demo-game.ts in packages/rules: plays a full 4-player game in the terminal with random moves, printing the board as ASCII each turn, until someone wins. Must terminate. This is our smoke test that the engine is complete and correct.

---

## PHASE 2 — Local pass-and-play app (M2)

**Prompt 2.1 — Board rendering**
> In apps/mobile, build the Ludi board per docs/ARCHITECTURE.md §4: a 15×15 grid in react-native-svg driven entirely by a data file src/components/board/boardLayout.ts (cell coordinates for the 52-cell track, 4 yards, 4 home columns, start/star safe-cell markers). Colour the yards, home columns, and centre triangles. No game logic — render a static board with 16 tokens placed in yards. Fit to screen width, support portrait phones.

**Prompt 2.2 — Local game screen**
> Wire packages/rules into the app: a pass-and-play screen for 2–4 players (colour count selected on home screen). Dice component with roll animation, tap-to-roll, legal tokens pulse-highlighted, tap token to move, token hop animation along its path with react-native-reanimated, capture knock-out animation, turn indicator. Show whose turn, last roll, and a win banner with final placements per house rules.

**Prompt 2.3 — Game feel pass**
> Add: dice shake/tumble animation, haptics (expo-haptics) on roll/your-turn/capture, sound effects via expo-av (dice, hop, capture, win), and a subtle JA-inspired theme (dark felt background, gold accents). Keep 60fps on a mid-range Android; memoize board cells.

---

## PHASE 3 — Online multiplayer (M3)

**Prompt 3.1 — Server rooms**
> In server/, implement room lifecycle per docs/ARCHITECTURE.md §3.2: room:create (6-char human-friendly code, host sets houseRules), room:join (max 4, seat colours in order), room:state broadcast on every change, room:leave. Validate every payload with the protocol zod schemas; rate-limit per socket. In-memory room registry is fine for now. Tests with socket.io-client: create/join/leave flows, join full room rejected, bad payloads rejected.

**Prompt 3.2 — Authoritative game loop**
> Implement the turn state machine per docs/ARCHITECTURE.md §3.3 using packages/rules on the server: game:roll (server-side crypto.randomInt dice, phase-gated), legal moves computed server-side, game:move validation, MOVE_REJECTED with rollback hint, no-legal-move auto-pass after 3s, 30s move timer with random-legal-move on timeout, consecutive-six extra turns, game:over with placements. Broadcast full GameState after every change (see §3.4 full-state strategy) plus game:tokenMoved for animations. Integration test: 4 simulated clients play a full random game to completion.

**Prompt 3.3 — Client online mode**
> In the app: Home screen gets Create Room / Join by Code. Lobby screen shows player cards + house-rules summary + ready buttons; host sees start. Game screen connects via src/net socket singleton: renders from server GameState only, optimistic move with rollback on MOVE_REJECTED, turn deadline countdown, "reconnecting…" badges per §3.5. Chat: slide-up panel using chat:send/chat:message. Session token persisted in expo-secure-store so app restarts reattach to your seat.

**Prompt 3.4 — Reconnect & dropout**
> Implement §3.5 server-side: 60s grace with paused turn timer (once), then AI-substitute (server plays random legal moves for the missing player). Client handles socket reconnection with full-state resync. Test: kill one client mid-game, verify substitution and rejoin paths.

---

## PHASE 4 — Video chat (M4)

**Prompt 4.1 — LiveKit server token endpoint**
> Add to server: POST /video-token issuing LiveKit access tokens (room = room code, identity = user id) gated to players seated in that room and only from READY_CHECK phase onward. Env vars per §7. Never log tokens.

**Prompt 4.2 — Video grid in app**
> Integrate @livekit/react-native into the game screen: 2×2 collapsible video grid per docs/ARCHITECTURE.md §3.6, mic/camera toggles, speaking-indicator border on active talker, graceful degradation to avatar when camera off. Note: requires an EAS development build — update docs. Test on two physical devices.

---

## PHASE 5 — Accounts & polish (M5)

**Prompt 5.1**
> Add Supabase: email auth + guest upgrade path, match history persistence per the data model in §3.7, profile with display name + avatar. History screen in app listing past matches (players, winner, date, house rules used).

**Prompt 5.2**
> Final polish: app icon + splash (expo config), onboarding first-run tooltip overlay on the board, error toasts, empty states, lobby code share sheet (expo-sharing / Linking). Run a full 4-player real-device game and fix everything that feels off.

---

## Debugging prompts (use when stuck)

> Read the failing test/error below, then read the relevant rules section in docs/GAME_RULES.md. Explain the root cause in ≤5 lines, propose the minimal fix, and show the diff. Do not refactor anything else. [paste error]

> Review [file] against docs/GAME_RULES.md §[X] and docs/ARCHITECTURE.md §3.1 trust model. List every rule violation or trust violation you find, with line numbers. Do not fix yet.

> The client and server disagree about [symptom]. Trace the exact event sequence from both logs [paste], identify the desync point, and propose a fix that keeps the server authoritative per docs/ARCHITECTURE.md §3.1.

Build order reminder: get M1 (rules engine + tests) green before any UI.
