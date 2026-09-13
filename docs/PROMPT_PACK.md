# LUDI — Cursor Prompt Pack

**Rules of engagement:**
- One prompt = one task (30min–2hr target).
- Test after each (all tests green before next prompt).
- Commit after green (one logical commit per prompt completion).
- Read `GAME_RULES.md` before touching `packages/rules`.
- Read `ARCHITECTURE.md` for system design context.

---

## Phase 0: Scaffold ✅

### 0.1: Monorepo Setup ✅
**Prompt:** Scaffold Phase 0.1 for Dean's Caribbean/Jamaican Ludo mobile game on this repo. Monorepo skeleton only — no full game logic yet. There is already a README.md on main — keep/extend it, do not wipe history.

Layout (pnpm workspaces) at repo root:
```
apps/mobile/          # Expo SDK 52+, expo-router, TypeScript strict
server/               # Node + Express + Socket.IO, TypeScript strict
packages/rules/       # pure TS + vitest (hello + one smoke test)
packages/protocol/    # shared types placeholder
docs/
  GAME_RULES.md
  ARCHITECTURE.md
  PROMPT_PACK.md
package.json          # workspaces + scripts: dev:server, dev:mobile, test, test:rules, lint
pnpm-workspace.yaml
README.md
```

Wire workspaces: server and apps/mobile depend on packages/rules and packages/protocol. Hello-world Socket.IO: client connects, server replies `pong`. No game events yet. packages/rules: export tiny `hello()` + one passing vitest. TypeScript strict. Node 20+, pnpm 9+.

**Done when:** pnpm install works, pnpm test:rules passes, README explains how to run server + mobile, docs present.

### 0.2: Verify End-to-End Connection
**Prompt:** Verify Phase 0 scaffold works end-to-end. Start server (pnpm dev:server), start mobile (pnpm dev:mobile in iOS simulator), confirm mobile UI shows "Connected" status and displays pong message from server in connection log. If issues found, fix them. Document any manual setup steps (e.g., SERVER_URL for physical device testing) in README troubleshooting section.

**Done when:** Clean run from `pnpm install` → server start → mobile start → connection established with no errors.

---

## Phase 1: Rules Engine (M1)

**Goal:** Implement `packages/rules` per `GAME_RULES.md` §11 API contract. Pure functions, 100% immutable, injected RNG, zero dependencies.

### 1.1: Core Types and Game Initialization
**Prompt:** Implement core types in `packages/rules/src/types.ts`:

```ts
export type Color = "red" | "green" | "yellow" | "blue";

export interface GameConfig {
  playerColors: Color[];  // 2–4 colours
  houseRules: {
    maxConsecutiveSixes: 2 | 3 | "unlimited";
    extraRollOnCapture: boolean;
    blockadeCanMoveTogether: boolean;
    exactFinishBonus: boolean;
    playForPlacements: boolean;
  };
}

export type TokenPos =
  | { zone: "yard" }
  | { zone: "track"; cell: number }       // 0–51 absolute
  | { zone: "homeColumn"; step: number }  // 1–6
  | { zone: "home" };

export interface TokenState {
  color: Color;
  index: 0 | 1 | 2 | 3;
  pos: TokenPos;
}

export interface GameState {
  config: GameConfig;
  tokens: TokenState[];  // 4 per active colour (8–16 total)
  turn: Color;
  phase: "awaiting_roll" | "awaiting_move" | "finished";
  dice: number | null;
  consecutiveSixes: number;
  winner: Color | null;
  placements: Color[];  // ordered finish positions
}
```

Then implement `packages/rules/src/engine.ts`:

```ts
export function createGame(config: GameConfig): GameState {
  // Initialize game: all tokens in yard, turn = first color, phase = awaiting_roll
}
```

Add tests in `packages/rules/src/engine.test.ts`:
- 4-player game initializes with 16 tokens in yard.
- 2-player game initializes with 8 tokens.
- House rules are stored correctly.
- Turn order starts with first color (Red if 4-player).
- Phase is `awaiting_roll`, dice is `null`.

**Done when:** 10+ tests pass, `pnpm test:rules` green, types exported from `packages/rules/src/index.ts`.

### 1.2: Dice Rolling and Turn Management
**Prompt:** Implement dice rolling in `packages/rules/src/dice.ts`:

```ts
export function rollDice(
  state: GameState,
  rng: () => number  // returns [0, 1), caller supplies crypto.randomInt wrapper
): { state: GameState; value: number } {
  // Roll die (1–6), update state.dice, increment consecutiveSixes if 6
  // If 3rd consecutive 6 (and maxConsecutiveSixes=2), forfeit turn (phase=awaiting_roll, next player)
  // Otherwise phase=awaiting_move
}

export function passTurn(state: GameState): GameState {
  // Advance turn to next color in playerColors, reset consecutiveSixes=0, phase=awaiting_roll, dice=null
}
```

Add tests in `packages/rules/src/dice.test.ts`:
- Deterministic RNG test: `rng = () => 0.5` produces roll of 4.
- Rolling 6 increments `consecutiveSixes`.
- Rolling non-6 resets `consecutiveSixes` to 0.
- Third consecutive 6 with `maxConsecutiveSixes=2` forfeits turn (turn advances, phase=awaiting_roll).
- Third consecutive 6 with `maxConsecutiveSixes=3` is allowed.
- `"unlimited"` allows any number of consecutive sixes.

**Done when:** 15+ tests pass, `pnpm test:rules` green.

### 1.3: Token Movement and Validation
**Prompt:** Implement movement in `packages/rules/src/movement.ts`:

```ts
export interface Move {
  tokenIndex: number;  // index into state.tokens array
  resulting: TokenPos;
  captures?: { color: Color; index: number };  // if capturing opponent
}

export function legalMoves(state: GameState): Move[] {
  // Return all legal moves for current player
  // Must be in awaiting_move phase
  // Rules:
  // - Coming out: dice=6 only, start cell must not have own blockade
  // - Track movement: advance dice steps, cannot land on/pass blockade, cannot overshoot home column
  // - Home column: exact count to reach home
  // - Captures: single opponent on non-safe cell → legal + mark capture
  // - No legal moves → return []
}

export function applyMove(state: GameState, tokenIndex: number): { state: GameState; events: string[] } {
  // Apply move, return new state + event list
  // Events: "came_out", "moved", "captured", "blockade_formed", "blockade_broken", "entered_home_column", "got_home"
  // Update token pos, handle captures (send opponent to yard), check blockade formation
  // If got_home and all 4 tokens home → winner, phase=finished
  // Else determine extra turn: dice=6 or (captured + extraRollOnCapture) → phase=awaiting_roll same player
  // Else passTurn
}
```

Helpers in `packages/rules/src/board.ts`:
```ts
export function getStartCell(color: Color): number { /* Red=0, Green=13, Yellow=26, Blue=39 */ }
export function isSafeCell(cell: number): boolean { /* 0,13,26,39,8,21,34,47 */ }
export function getHomeEntryCell(color: Color): number { /* Red=51, Green=12, Yellow=25, Blue=38 */ }
export function isBlockade(state: GameState, pos: TokenPos): boolean { /* ≥2 same-colour tokens on pos */ }
```

Add tests in `packages/rules/src/movement.test.ts`:
- Coming out on 6: legal if start cell empty or has <2 own tokens.
- Coming out blocked by own blockade on start cell: no legal move for coming out.
- Track movement: token advances correct cells.
- Blockade ahead: move blocked (not in legal moves).
- Capture single opponent on non-safe cell: legal, move includes capture.
- Safe cell: opponent present but no capture.
- Home column entry: correct cell triggers entry.
- Exact count to home: legal; overshoot not legal.
- All tokens home: winner set, phase=finished.

**Done when:** 25+ tests pass (covering edge cases 1,3,4,5,6,7,8,10 from GAME_RULES.md §10), `pnpm test:rules` green.

### 1.4: Captures, Blockades, and Win Conditions
**Prompt:** Complete `packages/rules` with full blockade logic and win detection.

Update `packages/rules/src/movement.ts` to handle:
- **Blockade impassability:** A token cannot move through or onto a cell with ≥2 same-colour opponent tokens (even if different from moving token's colour). Exception: own blockade still blocks own other tokens.
- **Blockade formation:** Moving onto own single token forms blockade → emit "blockade_formed".
- **Blockade breaking:** Moving one token off a blockade cell → emit "blockade_broken".
- **Safe cells with multiple colours:** Multiple tokens of different colours coexist on safe cells; still no captures.
- **Home column:** Blockades don't apply in home columns (each token moves independently to home).

Add `packages/rules/src/game-over.ts`:
```ts
export function checkWinner(state: GameState): Color | null {
  // Return colour if all 4 tokens at { zone: "home" }
}

export function updatePlacements(state: GameState): GameState {
  // If playForPlacements=true and winner just finished, add to placements array
  // If all colours finished → phase=finished
}
```

Add tests in `packages/rules/src/blockades.test.ts`:
- Blockade (2 same-colour tokens) blocks all opponents' movement through cell.
- Blockade blocks owner's other tokens (case 4 from GAME_RULES.md §10).
- 4 tokens stacked = still blockade (case 9).
- Safe cell blockade: still impassable but no captures possible.
- Blockade on start cell: coming out attempt returns empty legalMoves (case 3 variant).

Add tests in `packages/rules/src/game-over.test.ts`:
- First player to get 4 tokens home wins.
- If `playForPlacements=false`, game ends immediately (phase=finished, placements=[winner]).
- If `playForPlacements=true`, game continues for 2nd/3rd/4th places.

**Acceptance:** All 12 edge cases from GAME_RULES.md §10 covered by tests. 40+ total tests in `packages/rules`, all green.

**Done when:** `pnpm test:rules` shows 40+ passing tests, 100% coverage of core logic (use `vitest --coverage` to verify).

---

## Phase 2: Local UI (M2)

**Goal:** Build board + token rendering + local game loop (single device, no network).

### 2.1: Board SVG Rendering
**Prompt:** Create `apps/mobile/components/Board.tsx` using `react-native-svg`. Render a 15×15 grid representing the 52-cell track, 4 start positions (cells 0,13,26,39), 4 star cells (8,21,34,47), and 4 home columns (6 cells each leading to centre). Use colours from GAME_RULES.md: Red=#E53E3E, Green=#38A169, Yellow=#D69E2E, Blue=#3182CE. Board should be responsive (fit screen width with padding). No tokens yet, just static board.

**Acceptance:**
- Board renders on iOS and Android.
- All 52 track cells visible and correctly positioned in cross shape.
- Start cells highlighted in player colours.
- Star cells marked with star icons or distinct styling.
- Home columns clearly distinguished (colour gradients or borders).

**Done when:** Board displays correctly in simulator, no layout issues on different screen sizes (iPhone SE to iPad).

### 2.2: Token Rendering and Animation
**Prompt:** Create `apps/mobile/components/Token.tsx` using `react-native-svg` for token shape (circle with colour fill) and `react-native-reanimated` for movement. Token should accept `pos: TokenPos` prop and animate smoothly (300ms ease-out) when pos changes. Add selection state (scale up + glow effect). If multiple tokens on same cell, stack them with slight offset.

Create `apps/mobile/components/GameBoard.tsx` that combines `Board` and renders all tokens from a `GameState` prop. Use `@ludi/rules` types.

**Acceptance:**
- 16 tokens (4 colours × 4 tokens) render correctly in yards initially.
- Tokens move smoothly when pos changes (no jank at 60 FPS).
- Selection highlight works (tap to select, shows glow).
- Multiple tokens on same cell stack neatly (offset by 5px).

**Done when:** Tokens render and animate smoothly in simulator.

### 2.3: Local Game Loop
**Prompt:** Implement local game loop in `apps/mobile/app/local-game.tsx`. Use Zustand store (`apps/mobile/stores/localGameStore.ts`) to hold current `GameState` from `@ludi/rules`. Integrate dice UI (`components/Dice.tsx` with roll button + animation) and token selection. Flow: tap Roll → animate dice → show legal moves (highlight tokens) → tap token → apply move → animate → next turn. Use `@ludi/rules` functions: `rollDice`, `legalMoves`, `applyMove`.

Add turn indicator banner ("Red's Turn") and game-over modal (show winner + placements).

**Acceptance:**
- Complete 4-player game playable on one device (pass phone around).
- Roll button enabled only during `awaiting_roll` phase for current player.
- Legal moves highlighted after roll.
- Tapping legal token moves it and advances turn.
- Tapping illegal token shows error toast.
- Game detects winner and shows victory screen.
- "New Game" button restarts.

**Done when:** Full game playable locally with no bugs, smooth 60 FPS animations.

---

## Phase 3: Online Multiplayer (M3)

**Goal:** Implement server-authoritative multiplayer via Socket.IO.

### 3.1: Server Room Management
**Prompt:** Implement room management in `server/src/managers/RoomManager.ts`. Store active rooms in memory (`Map<roomId, Room>`). Add Socket.IO handlers in `server/src/handlers/room.ts`:

**Events to handle:**
- `room:create { houseRules }` → generate roomId (UUID), inviteCode (6-char alphanumeric), return to client.
- `room:join { inviteCode }` → find room, add player (max 4), assign colour (first available in Red/Green/Yellow/Blue order), broadcast `room:state`.
- `room:ready { ready: boolean }` → mark player ready, broadcast `room:state`. If all 4 ready → transition to COUNTDOWN (3s), then IN_PROGRESS, emit `game:state` with `createGame()`.
- `room:leave` → remove player, broadcast `room:state`. If host leaves → assign new host or close room.

**Acceptance:**
- Create room returns `{ roomId, inviteCode }`.
- Join room with valid code adds player, assigns colour.
- Join room with invalid code returns error.
- Join full room (4 players) returns error.
- All-ready triggers game start (server emits `game:state` with initial GameState).

**Done when:** Manual test with 2 clients (browser Socket.IO client or Postman) can create room, join, ready-up, and receive initial game state.

### 3.2: Server Game Loop
**Prompt:** Implement game event handlers in `server/src/handlers/game.ts`:

**Events to handle:**
- `game:roll` → validate (current player + awaiting_roll phase), call `rollDice(state, () => Math.random())`, emit `game:diceRolled { playerId, value }` + `game:state`.
- `game:move { tokenIndex }` → validate (current player + awaiting_move phase + tokenIndex in legalMoves), call `applyMove(state, tokenIndex)`, emit `game:tokenMoved { ... }` + `game:state`. If move rejected → emit `error { code: "MOVE_REJECTED", message: "..." }`.

Add turn timeout logic: 30s timer per phase, auto-roll or auto-move if timeout expires.

**Acceptance:**
- Client can roll dice, server responds with dice value.
- Client can move token (valid), server applies move and broadcasts new state.
- Client attempts invalid move → server rejects with error event.
- Turn timeout → server auto-actions after 30s.

**Done when:** 2 mobile clients can play a full match over network (create room → join → play to completion).

### 3.3: Client Socket Integration
**Prompt:** Replace local game loop in `apps/mobile` with Socket.IO client. Create `apps/mobile/services/socket.ts` with typed Socket.IO client (use `@ludi/protocol` types). Update `apps/mobile/stores/gameStore.ts` to sync from server `game:state` events. Implement optimistic updates: predict move locally (using `@ludi/rules`), then rollback if server rejects.

Add connection status indicator (green dot = connected, red = disconnected). Handle reconnection: on disconnect → show "Reconnecting..." overlay; on reconnect → server sends full `game:state` resync.

**Acceptance:**
- Mobile client connects to server on app launch.
- Connection status indicator works.
- Client can create/join room, send ready, roll dice, move token.
- Optimistic UI updates (token moves immediately), rollback on server rejection.
- Reconnect within 60s → game resumes from server state.

**Done when:** 2 mobile clients can play online match with smooth UX (no noticeable lag on move, optimistic prediction works).

### 3.4: Lobby UI and Chat
**Prompt:** Create lobby screens:
- `apps/mobile/app/lobby/create.tsx`: Create room form (house rules toggles), displays invite code after creation, shareable via Share API.
- `apps/mobile/app/lobby/join.tsx`: Enter invite code input, join button.
- `apps/mobile/app/lobby/[inviteCode].tsx`: Room lobby showing 4 player slots, ready checkboxes, house rules summary. Host can kick players (emit `room:kick { playerId }`). "Start Game" button visible to host when all ready.

Add chat: `apps/mobile/components/Chat.tsx` (text input + message list). Emit `chat:send { message }`, listen for `chat:message { playerId, message, timestamp }`.

**Acceptance:**
- Create room flow: tap Create → configure house rules → see invite code → copy/share.
- Join room flow: enter code → see lobby with other players.
- Lobby shows ready states, host controls.
- Chat works during match (messages broadcast to all players).

**Done when:** Full multiplayer flow works: create → share code → friend joins → both ready → play match with chat.

---

## Phase 4: Video Chat (M4)

**Goal:** Integrate LiveKit for real-time video + audio.

### 4.1: LiveKit Server Token Generation
**Prompt:** Add LiveKit token generation in `server/src/services/livekit.ts`. Use `livekit-server-sdk`:

```ts
import { AccessToken } from 'livekit-server-sdk';

export function generateLivekitToken(roomName: string, userId: string, userName: string): string {
  const at = new AccessToken(process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET, {
    identity: userId,
    name: userName,
  });
  at.addGrant({ roomJoin: true, room: roomName, canPublish: true, canSubscribe: true });
  return at.toJwt();
}
```

In `server/src/handlers/game.ts`, when game transitions to IN_PROGRESS (after COUNTDOWN), generate tokens for all 4 players and emit `livekit:token { token, roomName }` to each.

**Acceptance:**
- Server generates LiveKit tokens after ready check.
- Each player receives unique token via `livekit:token` event.
- Token includes identity (userId) and room name (`ludi-{roomId}`).

**Done when:** Server emits valid LiveKit tokens (verify with LiveKit dashboard or token decoder).

### 4.2: LiveKit Client Integration
**Prompt:** Integrate `@livekit/react-native` in `apps/mobile`. Create `apps/mobile/components/VideoChat.tsx`:

- Listen for `livekit:token` event from server.
- Connect to LiveKit room using token.
- Render 4 video tiles in grid layout (or PiP mode).
- Add mute/unmute button (audio) and camera toggle button (video).
- Request camera/microphone permissions on first use (use `expo-av` or native permission APIs).

Add video layout toggle: default side-by-side (board + video), PiP mode (floating video over board), focus mode (large video, small board).

**Acceptance:**
- Video chat starts after COUNTDOWN (all 4 players see each other).
- Audio works bidirectionally.
- Mute button mutes local audio.
- Camera button toggles local video.
- Permissions requested gracefully (fallback if denied).
- Connection quality indicator (green/yellow/red based on LiveKit stats).

**Done when:** 4 players in match can see/hear each other via LiveKit, controls work, no crashes on permission denial.

---

## Phase 5: Accounts & Persistence (M5)

**Goal:** Add Supabase Auth and persist match data.

### 5.1: Supabase Auth Integration
**Prompt:** Integrate Supabase Auth in `apps/mobile`. Create `apps/mobile/services/auth.ts`:

- On first launch: create guest account (anonymous sign-in via Supabase).
- Add login/signup screens (`app/auth/login.tsx`, `app/auth/signup.tsx`): email/password, Google OAuth, Apple Sign-In.
- Store user session in Zustand store (`apps/mobile/stores/authStore.ts`).
- Send Supabase access token to server on Socket.IO connection (auth handshake).

In `server/src/middleware/auth.ts`: validate Supabase JWT on Socket.IO connection, attach `userId` to socket.

**Acceptance:**
- Guest accounts created automatically on first launch.
- Users can upgrade to full account (email/password or social).
- Social login works on iOS/Android (use Expo AuthSession).
- User token sent to server, server validates via Supabase client.

**Done when:** User can create account, log in, and server recognizes authenticated user (socket.userId populated).

### 5.2: Match Persistence
**Prompt:** Persist completed matches to Supabase. In `server/src/database/matches.ts`:

```ts
export async function saveMatch(matchData: {
  roomId: string;
  houseRules: HouseRules;
  winnerId: string;
  players: { userId: string; color: Color; placement: number; stats: PlayerStats }[];
  startedAt: Date;
  endedAt: Date;
  finalState: GameState;
}): Promise<void> {
  // Insert into matches table, then insert match_players rows
}
```

Call `saveMatch()` when game reaches `phase: "finished"`.

Add match history screen in `apps/mobile/app/(tabs)/history.tsx`: fetch user's past matches from Supabase (`SELECT * FROM match_players WHERE user_id = ... ORDER BY match.ended_at DESC LIMIT 20`), display as list (opponent names, result, date). Tap match → detail view (full game summary, placements, stats).

**Acceptance:**
- Completed matches saved to Supabase.
- Match history screen shows past 20 matches.
- Match detail view shows winner, placements, house rules used.
- Pagination works (load more button).

**Done when:** User can view full match history after playing multiple games.

---

## Phase 6: Polish & Launch (M6)

### 6.1: Sound Effects and Haptics
**Prompt:** Add sound effects using `expo-av`. Create `apps/mobile/services/sound.ts`:

Sounds needed:
- Dice roll (shake + settle)
- Token move (hop sound)
- Capture (opponent token sent home)
- Win (fanfare)

Add haptic feedback using `expo-haptics`: light impact on roll, medium impact on capture, heavy impact on win.

Add background music (looping, toggleable in settings). Add settings screen (`app/(tabs)/settings.tsx`) with toggles: sound FX on/off, music on/off, haptics on/off.

**Acceptance:**
- Sound effects play for all major actions.
- Sounds respect settings toggle (can be muted).
- Haptic feedback works on iOS and Android.
- Background music loops and respects settings toggle.

**Done when:** Game feels polished with audio and haptic feedback.

### 6.2: App Store Preparation
**Prompt:** Prepare for app store submission:

1. Generate app icons (all required sizes for iOS and Android) using `expo-icon` or Figma export. Place in `apps/mobile/assets/`.
2. Create splash screens (iOS + Android) using `expo-splash-screen`.
3. Take 5 screenshots per platform (iPhone 6.7", iPhone 6.5", iPad 12.9", Android phone, Android tablet): home screen, lobby, active game, video chat, match history.
4. Write app store descriptions (short: 80 chars, long: 4000 chars) in `docs/APP_STORE.md`.
5. Configure EAS build profiles in `apps/mobile/eas.json`: development (internal testing), preview (TestFlight/internal), production (App Store/Google Play).
6. Add privacy policy and terms of service (web pages), link in app settings.

**Acceptance:**
- App icons present for all sizes (iOS 1024×1024, adaptive icon for Android).
- Splash screens configured and display correctly.
- Screenshots captured (5 per platform, landscape + portrait where relevant).
- App store descriptions written.
- EAS build profiles configured.
- Privacy policy and terms accessible from app.

**Done when:** Ready to run `eas build --platform all --profile production` and submit to stores.

---

## Debugging Prompts (Use When Stuck)

### D1: State Desync Investigation
**Prompt:** Client and server game states are out of sync. Add debug logging in `packages/rules` functions (log all inputs/outputs), enable verbose Socket.IO logging on server (`io.on('connection', (socket) => { socket.onAny((event, ...args) => console.log('[SOCKET]', event, args)); })`). Trace specific desync case: reproduce with 2 clients, log full state snapshots on every `game:state` emit/receive. Identify divergence point (which event caused states to differ). Fix root cause (likely missing state update or incorrect optimistic prediction).

### D2: LiveKit Connection Failures
**Prompt:** LiveKit video not connecting or dropping frequently. Check:
1. LiveKit token expiry (default 1hr, increase to 2hr).
2. Token permissions (canPublish, canSubscribe both true).
3. Network: LiveKit requires UDP ports, some corporate networks block. Test on mobile data vs WiFi.
4. Logs: enable LiveKit SDK debug logs (`livekit.setLogLevel('debug')`).
5. Dashboard: check LiveKit cloud dashboard for connection attempts, errors.

Add connection quality indicator using LiveKit connection stats (ping, packet loss). Show warning if quality degrades. Implement reconnection logic (detect disconnect, attempt reconnect with same token).

### D3: Supabase RLS Policy Issues
**Prompt:** Database queries failing with "permission denied" errors. Review Supabase RLS policies:
1. `users` table: users can SELECT/UPDATE own row only.
2. `matches` table: public read (anyone can view match history), server writes only (use service key).
3. `match_players` table: users can SELECT own rows, server writes.
4. `rooms` table: participants can SELECT, host can UPDATE, server writes.

Use Supabase SQL editor to test policies with `auth.uid()` context. Add policy tests (insert test rows, query as different users, verify access). Fix policies by adding correct `USING` clauses.

---

**End of Prompt Pack**

Next prompt: Choose from Phase 1 (start with 1.1 if scaffold complete) or debugging prompts if issues arise.
