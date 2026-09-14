# LUDI — Technical Specification
### Caribbean (Jamaican) Ludo · 4-player mobile game with live video & chat

**Version:** 1.0 — Working spec for Cursor agent-driven development
**Owner:** Dean
**Companion docs:** `GAME_RULES.md` (rules source of truth), `PROMPT_PACK.md`

---

## 1. Product Overview

Ludi is a mobile multiplayer board game app based on the Jamaican/Caribbean version of Ludo.

**Core features:**
- 1–4 players per match (online multiplayer; local pass-and-play for MVP)
- Real-time, server-authoritative game state (no client trust)
- In-match video chat (all players can see each other) + text chat
- Jamaican ruleset, with a "house rules" toggle system since rules vary by family
- Matchmaking, private rooms with invite codes, friends list (post-MVP)

**Non-goals for MVP:** monetization, tournaments, AI opponents, rankings/elo.

---

## 2. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Mobile app | **React Native + Expo (SDK 52+)**, TypeScript | Cursor agents are strongest in TS; one codebase for iOS + Android; EAS Build for store binaries |
| Navigation | expo-router | File-based, standard |
| Local state | zustand + immer | Simple, agent-friendly |
| Server | **Node.js + TypeScript, Socket.IO** | Authoritative game server; rooms + chat over one transport |
| Video/voice | **LiveKit Cloud** (alt: Agora) | React Native SDK, 4-way video handled, generous free tier; avoids raw WebRTC |
| DB | PostgreSQL via Supabase (or Neon) | Users, friends, match history |
| Auth | Supabase Auth (email + anonymous guest) | Guest mode keeps onboarding friction ~zero |
| Hosting (server) | Railway / Render / Fly.io | Cheap node hosting with websockets |
| Animations | react-native-reanimated + react-native-svg | Board + token animations |
| Tests | Vitest (rules engine), Maestro (E2E, post-MVP) | Rules engine must be 100% tested |

**Monorepo layout (pnpm workspaces):**

```
ludi/
  apps/
    mobile/        # Expo app
  server/          # Node + Socket.IO authoritative server
  packages/
    rules/         # PURE TS rules engine — shared by client (prediction) and server (authority)
    protocol/      # Shared types: socket events, DTOs, room config
  docs/
    GAME_RULES.md  # Copy of doc 02 — agents read this
    ARCHITECTURE.md
```

> **Critical design decision:** `packages/rules` is a pure, dependency-free TypeScript module. The server imports it to validate moves; the client imports it for UI hints (legal-move highlighting) and optimistic updates. One ruleset, zero drift.

---

## 3. Architecture

### 3.1 Trust model
- The **server is the single source of truth** for: dice rolls, legal moves, captures, turn order, win state.
- Dice are rolled **server-side** with crypto-grade RNG (`crypto.randomInt`). Clients never send a dice value.
- Client sends only *intent*: `{ type: "MOVE_TOKEN", tokenId }`. Server validates against legal moves computed from its own state + its own dice roll.
- Rejections return `MOVE_REJECTED` with reason; client rolls back optimistic update and re-syncs from server state.

### 3.2 Match lifecycle

```
LOBBY (room created, players join, host sets house rules)
  → READY_CHECK (all players ready)
  → COUNTDOWN (video tiles connect here)
  → IN_PROGRESS (turn loop)
  → FINISHED (results, rematch option)
  → LOBBY (on rematch) or CLOSED
```

### 3.3 Turn loop (server-side state machine)

```
awaiting_roll → rolled (dice value, legal moves computed)
  → if no legal moves: auto-pass after 3s → next player
  → awaiting_move (30s timer; on timeout server picks random legal move)
  → move applied (capture check, win check)
  → rolled a 6 → same player rolls again (max 2 consecutive sixes per Jamaican rules — see GAME_RULES)
  → else next player
```

### 3.4 Networking events (Socket.IO)

All payloads typed in `packages/protocol/src/events.ts`.

**Client → Server**
| Event | Payload | Notes |
|---|---|---|
| `room:create` | `{ displayName, houseRules }` | Returns room code |
| `room:join` | `{ roomCode, displayName }` | |
| `room:ready` | `{}` | |
| `game:roll` | `{}` | Server generates the value |
| `game:move` | `{ tokenId }` | Intent only |
| `chat:send` | `{ text }` | Rate-limited, 200 char max |
| `room:leave` | `{}` | Triggers forfeit logic |

**Server → Client**
| Event | Payload | Notes |
|---|---|---|
| `room:state` | `RoomState` | Full sync on join/reconnect |
| `game:state` | `GameState` | Authoritative full state (small — 16 tokens) |
| `game:diceRolled` | `{ playerId, value, legalMoves }` | |
| `game:tokenMoved` | `{ playerId, tokenId, from, to, captured? }` | For animation |
| `game:turnChanged` | `{ playerId, deadlineTs }` | |
| `game:over` | `{ winnerId, placements }` | |
| `chat:message` | `{ playerId, text, ts }` | |
| `player:connectionChanged` | `{ playerId, status }` | |

**Full-state-over-delta strategy:** entire `GameState` is < 2 KB serialized. Send full state after every move instead of deltas — eliminates desync classes of bugs entirely. Use `game:tokenMoved` purely for triggering client animations.

### 3.5 Reconnect & dropout handling
- Socket auth via short-lived session token → rejoining with the same token reattaches to your seat.
- 60-second reconnect grace: token state shows "reconnecting…" to other players; turn timer paused if it's their turn (once).
- After grace: player marked AI-substitute (server plays random legal moves) or forfeit, per house rules setting.
- Video: LiveKit handles its own reconnection independently of the game socket.

### 3.6 Video & chat architecture
- Server issues **LiveKit access tokens** (room name = game room code) after `READY_CHECK` starts. LiveKit credentials never live in the app bundle beyond the publishable URL.
- Mobile app renders 2×2 video grid above/beside the board (collapsible). Board stays primary focus; video tiles ~25% of screen each, tap-to-expand.
- Text chat rides Socket.IO (already connected); no separate service.
- Mute/camera-off toggles via LiveKit SDK. Report/block buttons are post-MVP but stub the UI now.

**Implementation details (M4.2)**:
- **VideoStore** (`src/stores/videoStore.ts`): Zustand store managing LiveKit connection state, token, mic/camera toggles, and collapse state
- **VideoTile** component: Renders individual participant video with speaking indicator border (color-coded by player color), graceful avatar fallback when camera off (displays first initial on colored background)
- **MicCamControls**: Toggle buttons for mic and camera, visual state indication
- **VideoGrid**: 2×2 collapsible grid (max 4 players), integrates with LiveKitRoom context, shows active speaker borders
- **Token fetch**: Client calls `POST /video-token` (roomCode + userId) when room reaches READY_CHECK phase; server validates player is seated and game exists before issuing token
- **Environment**: `EXPO_PUBLIC_LIVEKIT_URL` required in mobile app; server needs `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `LIVEKIT_URL`
- **Native module requirement**: LiveKit uses native WebRTC; **EAS development build required** — does NOT work in Expo Go

### 3.7 Data model (server, PostgreSQL)

```
users(id, display_name, avatar_url, created_at, is_guest)
rooms(id, code, house_rules jsonb, status, created_at)
matches(id, room_id, started_at, ended_at, winner_id, placements jsonb)
match_players(match_id, user_id, color, final_position)
friendships(user_id, friend_id, status)        -- post-MVP
```

No move-by-move replay storage in MVP (add `match_events` table later for replays).

---

## 4. Client App Structure

```
apps/mobile/
  app/                    # expo-router screens
    index.tsx             # Home: Create / Join
    lobby/[code].tsx      # Lobby + ready check
    game/[code].tsx       # Board + video grid + chat
    results/[code].tsx    # Results + rematch
  src/
    components/
      board/              # LudiBoard, TrackCell, Yard, HomeColumn, Token, Dice
      video/              # VideoGrid, VideoTile, MicCamControls
      chat/               # ChatSheet, MessageBubble
      lobby/              # PlayerCard, HouseRulesPicker
    engine/               # re-exports packages/rules; legal-move highlighting helpers
    net/                  # socket client (singleton), optimistic-move wrapper, reconnect logic
    stores/               # zustand: roomStore, gameStore, chatStore, videoStore
    theme/                # colors per player: red/green/yellow/blue + JA-inspired accent
```

**Board rendering:** draw the 15×15 grid in `react-native-svg` (or Skia). Coordinates for the 52-cell main track, 4 yards, 4 home columns, and 4 start cells are defined as **data** (`boardLayout.ts`), not hardcoded in components — this lets agents and tests reason about positions.

**Game feel checklist (do not skip):** dice shake + tumble animation, token hop along path cells, capture "knock out" animation, slide-up chat, subtle sound effects, haptics on your turn.

---

## 5. Security & Fair Play

- All validation server-side (see §3.1). Treat every client payload as hostile.
- Per-socket rate limiting on all events (e.g., `game:roll` ignored unless it's your turn and phase = `awaiting_roll`).
- Room codes: 6-char human-friendly (no ambiguous chars: 0/O, 1/I), expiring after 2h idle.
- No PII beyond display name for guests; email only for registered accounts.

---

## 6. Roadmap & Milestones

| # | Milestone | Definition of done |
|---|---|---|
| M1 | Rules engine + tests | `packages/rules` passes full test suite from GAME_RULES; CLI demo game playable in terminal |
| M2 | Local pass-and-play app | Expo app, 2–4 players on one device, full rules, animations |
| M3 | Online rooms | Server + rooms + turn sync + reconnect; two devices play a full game |
| M4 | Video + chat | LiveKit grid in game screen, text chat, mute/cam toggles |
| M5 | Polish & accounts | Auth, match history, sounds/haptics, app icons |
| M6 | Post-MVP | Matchmaking, friends, rematch streaks, replays, AI opponents |

M1–M3 are the core risk. Get two phones playing a complete online match before touching video.

---

## 7. Environment & Setup (for Cursor agents)

- Node 20+, pnpm 9+
- Env vars: `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `LIVEKIT_URL`, `DATABASE_URL`, `PORT`
- Mobile env vars: `EXPO_PUBLIC_SERVER_URL`, `EXPO_PUBLIC_LIVEKIT_URL`
- Dev commands: `pnpm dev:server`, `pnpm dev:mobile`, `pnpm test:rules`
- Expo Go for early dev; switch to a **development build** (EAS) once LiveKit native SDK lands in M4 — LiveKit does not run in Expo Go.
- For two-device video testing: both devices need development builds with same `EXPO_PUBLIC_LIVEKIT_URL` pointing to your LiveKit server (Cloud or self-hosted)
