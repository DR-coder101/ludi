# LUDI — Technical Specification Version 1.0

**Companion docs:** [GAME_RULES.md](./GAME_RULES.md) for Jamaican Ludo rules, [PROMPT_PACK.md](./PROMPT_PACK.md) for phased prompts.

---

## 1. Product Overview

**Ludi** is a 4-player mobile multiplayer implementation of **Caribbean/Jamaican Ludo** with live video chat. The MVP targets authentic gameplay with social features; **non-goals** include monetization, tournaments, AI opponents, competitive rankings, and spectator mode.

**Core experience:**
- Authentic Jamaican Ludo with house rule toggles
- Private rooms with invite codes (no public matchmaking in MVP)
- Live video + audio during matches (LiveKit)
- Guest and persistent accounts (Supabase Auth)
- Mobile-first (iOS + Android via Expo)

---

## 2. Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| **Mobile** | React Native, Expo SDK 52+ | TypeScript strict, expo-router |
| **State** | Zustand + Immer | Client game state, optimistic updates |
| **Networking** | Socket.IO client | Real-time, full-state-over-delta |
| **Video/Audio** | LiveKit React Native SDK | Cloud-hosted SFU, tokens from server |
| **UI/Animation** | Reanimated 3, React Native SVG | Board rendering, smooth token moves |
| **Server** | Node.js 20+, Express, Socket.IO | TypeScript strict |
| **Game Logic** | `@ludi/rules` (pure TS, no deps) | Shared client/server, injected RNG |
| **Database** | PostgreSQL via Supabase | Users, rooms, matches |
| **Auth** | Supabase Auth | Guest accounts + email/social |
| **Deployment** | Railway / Render / Fly.io | Server; EAS for mobile |
| **Testing** | Vitest (rules + server), Jest (RN components) | 100% coverage goal for rules engine |

**Monorepo layout (pnpm workspaces):**
```
apps/mobile/          # Expo app
server/               # Node + Express + Socket.IO
packages/rules/       # Pure TS rules engine
packages/protocol/    # Shared Socket.IO types
docs/                 # This file, GAME_RULES.md, PROMPT_PACK.md
```

---

## 3. Architecture Principles

### Server Authority (Trust Model)

- **Server is sole source of truth** for all game state.
- **Client sends intents** only: `game:roll`, `game:move tokenIndex=2`.
- **Server validates via `@ludi/rules`**, applies move or rejects (`MOVE_REJECTED` + resync).
- **Dice rolls use `crypto.randomInt()` server-side** — client never generates randomness.
- **Full-state-over-delta**: server broadcasts complete `GameState` snapshots to avoid drift.
- **Client prediction allowed** for UX (show move immediately), but server response is authoritative; rollback on rejection.

### Pure Rules Engine (`packages/rules`)

- **Dependency-free** — no npm packages, no Node APIs, no I/O.
- **Pure functions** — no side effects, immutable state (all functions return new state).
- **Injected RNG** — `rollDice(state, rng: () => number)` for deterministic testing.
- **Shared by client and server** — ensures identical validation logic.
- **100% test coverage target** — all 12 edge cases from GAME_RULES.md, plus combinatorics.

---

## 4. Match Lifecycle

```
LOBBY → READY_CHECK → COUNTDOWN → IN_PROGRESS → FINISHED → [rematch → LOBBY | CLOSED]
```

- **LOBBY**: Host creates room, shares invite code; players join, configure house rules, select colours.
- **READY_CHECK**: All 4 players mark ready; 30s timeout → kick un-ready players.
- **COUNTDOWN**: 3-2-1 countdown; LiveKit tokens issued, video connections establish.
- **IN_PROGRESS**: Turn-based gameplay (see §5).
- **FINISHED**: Winner declared, placements recorded; show stats screen.
- **Rematch or close**: Return to LOBBY with same players, or disband room.

---

## 5. Turn Loop (IN_PROGRESS phase)

```
awaiting_roll → [player rolls] → awaiting_move → [player moves] → [check extra roll] → awaiting_roll (next player)
```

**Flow:**
1. **awaiting_roll**: Current player must roll (30s timeout → server auto-rolls).
2. Server calls `rollDice(state, crypto.randomInt)`, gets dice value.
3. Server emits `game:diceRolled { playerId, value }`.
4. State becomes **awaiting_move**; server calculates `legalMoves(state)`.
5. If no legal moves → auto-pass turn.
6. Player emits `game:move { tokenIndex }`.
7. Server validates tokenIndex is in legal moves; if not → `MOVE_REJECTED`.
8. Server calls `applyMove(state, tokenIndex)`, gets new state + events.
9. Server emits `game:tokenMoved`, `game:state`, plus any capture/blockade events.
10. **Extra roll logic**:
    - If rolled a 6 → another `awaiting_roll` for same player (unless 3rd consecutive 6 → forfeit).
    - If captured + `extraRollOnCapture=true` → extra roll.
    - Else → `game:turnChanged` to next player.

**Timeouts:**
- Roll timeout (30s) → server picks `Math.floor(rng() * 6) + 1`.
- Move timeout (30s) → server picks `legalMoves[0]` (first legal move).

---

## 6. Socket.IO Events

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `room:create` | `{ houseRules?: HouseRules }` | Create room, receive `{ roomId, inviteCode }` |
| `room:join` | `{ inviteCode: string }` | Join existing room |
| `room:ready` | `{ ready: boolean }` | Mark ready for game start |
| `game:roll` | `{}` | Request dice roll (only if current player + awaiting_roll) |
| `game:move` | `{ tokenIndex: number }` | Move intent (only if current player + awaiting_move) |
| `chat:send` | `{ message: string }` | Text chat during match |
| `room:leave` | `{}` | Leave room gracefully |

### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `room:state` | `RoomState` | Full room snapshot (players, ready states, house rules) |
| `game:state` | `GameState` | Full game state (from `packages/rules`) |
| `game:diceRolled` | `{ playerId, value }` | Dice result |
| `game:tokenMoved` | `{ playerId, tokenIndex, from, to }` | Move applied |
| `game:turnChanged` | `{ playerId, deadline }` | New turn starts |
| `game:over` | `{ winnerId, placements }` | Match finished |
| `chat:message` | `{ playerId, message, timestamp }` | Chat broadcast |
| `player:connectionChanged` | `{ playerId, connected }` | Connection status change |
| `error` | `{ code, message }` | Action rejected (e.g., `MOVE_REJECTED`) |

---

## 7. Reconnection & Grace Period

- **60-second grace period**: Player disconnects → server marks as disconnected but keeps slot open.
- **Within 60s**: Player reconnects → server sends `game:state` (full resync) + recent chat messages.
- **After 60s**: Player slot forfeited; if <4 players remain → match ends (no AI fill in MVP).
- **Full-state resync**: On reconnect, client receives complete `GameState`, not deltas.

---

## 8. LiveKit Integration

- **When**: Tokens generated during COUNTDOWN phase (after all players ready).
- **Room naming**: LiveKit room = `ludi-match-{roomId}`.
- **Token claims**: `{ identity: userId, name: displayName, metadata: { color, roomId } }`.
- **Permissions**: All participants can publish audio/video, subscribe to others.
- **Client flow**: Receive token via `livekit:token { token, roomName }` event → connect to LiveKit → show video grid.
- **Deferred connection**: Video connects *after* COUNTDOWN, so game starts immediately without waiting for video handshake.

---

## 9. Data Model (Supabase PostgreSQL)

```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Active rooms (ephemeral, deleted after match ends)
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_code TEXT UNIQUE NOT NULL,  -- 6-char alphanumeric
  host_id UUID REFERENCES users(id) ON DELETE CASCADE,
  house_rules JSONB NOT NULL,
  state TEXT NOT NULL,  -- LOBBY | READY_CHECK | IN_PROGRESS | FINISHED
  created_at TIMESTAMPTZ DEFAULT now(),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ
);

-- Completed matches (for history)
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID,  -- not FK, room may be deleted
  house_rules JSONB NOT NULL,
  winner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ NOT NULL,
  total_turns INTEGER,
  final_state JSONB  -- full GameState snapshot
);

-- Match participants
CREATE TABLE match_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  color TEXT NOT NULL,  -- red | green | yellow | blue
  placement INTEGER,     -- 1 | 2 | 3 | 4
  turns_taken INTEGER DEFAULT 0,
  captures INTEGER DEFAULT 0,
  was_captured INTEGER DEFAULT 0,
  UNIQUE(match_id, user_id)
);

-- Friendships (post-MVP)
CREATE TABLE friendships (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL,  -- pending | accepted | blocked
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, friend_id)
);
```

**Indexes:**
- `rooms.invite_code` (unique)
- `matches.winner_id`, `matches.started_at`
- `match_players.user_id`, `match_players.match_id`

---

## 10. Client Structure (`apps/mobile`)

```
apps/mobile/
├── app/                       # expo-router file-based routing
│   ├── (tabs)/
│   │   ├── index.tsx         # Home / lobby list
│   │   ├── profile.tsx       # User profile
│   │   └── history.tsx       # Match history
│   ├── game/[roomId].tsx     # Active game screen
│   ├── room/[inviteCode].tsx # Room lobby (pre-game)
│   └── _layout.tsx           # Root layout
├── components/
│   ├── Board.tsx             # SVG board rendering
│   ├── Token.tsx             # Animated token component
│   ├── Dice.tsx              # Dice display + roll animation
│   ├── VideoGrid.tsx         # LiveKit video layout
│   └── Chat.tsx              # Text chat UI
├── stores/                    # Zustand stores
│   ├── gameStore.ts          # Current game state (from server)
│   ├── authStore.ts          # User auth state
│   └── socketStore.ts        # Socket.IO connection state
├── services/
│   ├── socket.ts             # Socket.IO client wrapper
│   ├── livekit.ts            # LiveKit connection logic
│   └── supabase.ts           # Supabase client
└── lib/
    ├── rules.ts              # Re-export @ludi/rules for client predictions
    └── constants.ts          # Colors, board dimensions, etc.
```

---

## 11. Security Considerations

1. **Input Validation**: All client events validated server-side; never trust client data.
2. **Move Validation**: Server enforces rules via `@ludi/rules.legalMoves()` — client cannot cheat.
3. **Dice Integrity**: Server-only `crypto.randomInt()` prevents client manipulation.
4. **Auth Tokens**: Short-lived JWT (15min) with refresh tokens (7 days); Supabase handles rotation.
5. **Rate Limiting**: Socket.IO events rate-limited (max 10 actions/sec per client).
6. **Database Security**: Supabase RLS policies restrict row access to match participants.

---

## 12. Development Milestones

### M0: Scaffold (Current)
- ✅ Monorepo with hello-world Socket.IO
- ✅ Documentation (this file, GAME_RULES.md, PROMPT_PACK.md)

### M1: Rules Engine (Phase 1)
- Implement full `packages/rules` per GAME_RULES.md
- Achieve 100% test coverage (12 edge cases + combinatorics)
- 4 sub-phases: types, dice, movement, captures/blockades/win

### M2: Local UI (Phase 2)
- Board SVG rendering (15×15 grid, 52-cell track, home columns)
- Token components with Reanimated movement
- Dice UI with roll animation
- Local game loop (single device, no network) using `@ludi/rules` directly

### M3: Online Multiplayer (Phase 3)
- Room creation/joining (server)
- Real-time state sync via Socket.IO
- Reconnection handling (60s grace)
- Chat messages

### M4: Video Chat (Phase 4)
- LiveKit token generation (server)
- LiveKit React Native integration (client)
- Video grid layout + controls (mute, camera toggle)
- Picture-in-picture mode

### M5: Accounts & Persistence (Phase 5)
- Supabase Auth (guest + email/social)
- User profiles (avatar, display name)
- Match history (Postgres via Supabase)
- Active game persistence (reconnect after app kill)

### M6: Polish & Launch (Phase 6)
- Sound effects + haptics
- Onboarding tutorial
- App store assets (icons, screenshots, descriptions)
- Privacy policy + terms of service
- EAS build profiles (production)

---

## 13. Environment Variables

### Server (`server/.env`)
```bash
PORT=3000
NODE_ENV=development

# Supabase
DATABASE_URL=postgresql://...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_KEY=eyJhbGc...  # server-only

# LiveKit (M4)
LIVEKIT_API_KEY=APIxxx
LIVEKIT_API_SECRET=xxx
LIVEKIT_URL=wss://xxx.livekit.cloud

# Security
JWT_SECRET=xxx  # for custom tokens if needed
CORS_ORIGIN=*   # restrict in production
```

### Mobile (`apps/mobile/.env`)
```bash
EXPO_PUBLIC_API_URL=http://localhost:3000  # or production server
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
EXPO_PUBLIC_LIVEKIT_URL=wss://xxx.livekit.cloud
```

**Notes:**
- Use `expo-env` or `@env` for React Native env var access.
- LiveKit credentials are sensitive; use Expo Secrets for EAS builds.
- Early dev uses Expo Go; LiveKit requires custom dev client (EAS).

---

## 14. Deployment Strategy

### Development
- Server: local (`pnpm dev:server`)
- Mobile: Expo Go
- Database: Supabase free tier

### Staging
- Server: Railway free tier (or Render)
- Mobile: EAS internal builds
- Database: Supabase staging project

### Production
- Server: Railway/Render/Fly.io (paid, auto-scaling)
- Mobile: App Store + Google Play (EAS managed builds)
- Database: Supabase production (connection pooling, backups)
- CDN: Cloudflare for static assets

---

## 15. Testing Strategy

**Unit Tests (Vitest):**
- `packages/rules`: 100% coverage, all 12 edge cases, pure function tests.
- `server`: Business logic (room management, move validation).

**Integration Tests:**
- Socket.IO event flows (create room → join → ready → play).
- Database operations (Supabase queries).

**E2E Tests (post-MVP):**
- Detox for mobile critical paths (login → join room → play turn).

---

## 16. Performance Targets

- Server response time: <50ms for game actions (roll, move).
- Client frame rate: 60 FPS during animations.
- Network tolerance: graceful degradation on 3G (full-state-over-delta helps).
- Reconnection time: <2s to resync full state.

---

## 17. Post-MVP Considerations

- **Horizontal scaling**: Redis for session state, pub/sub for multi-server Socket.IO.
- **Spectator mode**: Read-only Socket.IO connections.
- **AI opponents**: Monte Carlo tree search for single-player.
- **Tournaments**: Bracket system, matchmaking.
- **Analytics**: Mixpanel or Amplitude for user metrics.
- **Monetization**: Cosmetic skins, premium rooms (no pay-to-win).

---

**End of Technical Specification v1.0**
