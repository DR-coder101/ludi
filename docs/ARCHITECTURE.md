# Ludi Architecture

Technical specification for Caribbean/Jamaican Ludo multiplayer mobile game.

## Product Vision

**Ludi** is a mobile multiplayer implementation of Caribbean/Jamaican Ludo — a 4-player board game with live video chat and real-time gameplay. The MVP focuses on core gameplay mechanics with social features, while deferring monetization, tournaments, AI opponents, and competitive rankings to post-MVP phases.

## MVP Scope

### In Scope
- 4-player Jamaican/Caribbean Ludo rules with house rule toggles
- Real-time multiplayer via Socket.IO
- Live video + audio chat via LiveKit
- Private rooms with invite codes
- Basic user accounts and authentication
- Game state persistence
- Mobile-first UI (iOS + Android)

### Out of Scope (Post-MVP)
- Monetization (IAP, ads, premium features)
- Tournament system
- AI opponents
- Player rankings and leaderboards
- Spectator mode
- Replay system
- Social features (friends, chat history)

## Tech Stack

### Mobile Client
- **Framework**: React Native via Expo SDK 52+
- **Routing**: expo-router (file-based routing)
- **Language**: TypeScript (strict mode)
- **State Management**: Zustand + Immer
- **Networking**: Socket.IO client
- **Video/Audio**: LiveKit React Native SDK
- **Animation**: Reanimated 3
- **Graphics**: React Native SVG
- **Testing**: Vitest (shared logic), Jest (components)

### Backend Server
- **Runtime**: Node.js 20+ with TypeScript
- **Framework**: Express
- **Real-time**: Socket.IO
- **Database**: PostgreSQL via Supabase
- **Authentication**: Supabase Auth
- **Video Infrastructure**: LiveKit Cloud
- **Deployment**: Railway, Render, or Fly.io
- **Testing**: Vitest

### Shared Packages
- **@ludi/rules**: Pure TypeScript game rules engine (dependency-free)
- **@ludi/protocol**: Shared types and Socket.IO event definitions

## Architecture Principles

### Critical Design Decisions

1. **Server Authority**: Server is the sole source of truth for all game state
2. **Pure Rules Engine**: `@ludi/rules` is dependency-free, testable, and shared between client and server
3. **Client Prediction**: Client uses rules engine for immediate feedback; server validates and corrects
4. **Full State Over Delta**: Server sends complete state snapshots to avoid drift
5. **Secure Randomness**: Dice rolls use `crypto.randomInt()` server-side only
6. **Intent-Based Protocol**: Client sends intents (e.g., "move token 2"), server validates and executes

### Trust Model

```
Client                          Server
  |                              |
  | game:move (tokenIndex: 2)   |
  |----------------------------->|
  |                              | Validates via @ludi/rules
  |                              | Applies move or rejects
  | game:state (full state)      |
  |<-----------------------------|
  | game:tokenMoved OR           |
  | game:moveRejected            |
  |<-----------------------------|
```

Client can predict locally for smooth UX, but server response is authoritative. If client and server disagree, server wins and client resyncs.

## Game Flow

### Room Lifecycle States

```
LOBBY → READY_CHECK → COUNTDOWN → IN_PROGRESS → FINISHED → [LOBBY | CLOSED]
```

- **LOBBY**: Players join, select colors, configure house rules
- **READY_CHECK**: All players must mark ready; 30s timeout
- **COUNTDOWN**: 3-2-1 countdown before game starts
- **IN_PROGRESS**: Active gameplay with turn-based loop
- **FINISHED**: Game over, display winner and placements
- **LOBBY/CLOSED**: Return to lobby for rematch or room closes

### Turn Loop

```
awaiting_roll → [player rolls] → rolled → awaiting_move → [player moves] → awaiting_roll
```

- **awaiting_roll**: Current player must roll dice (30s timeout → auto-roll)
- **rolled**: Dice value determined, legal moves calculated
- **awaiting_move**: Player selects token to move (30s timeout → auto-select)
- Special cases:
  - Rolling a 6 grants an extra roll (configurable: max 2 or 3 consecutive sixes)
  - Capturing an opponent's token may grant an extra roll (house rule toggle)
  - If no legal moves, turn passes automatically

### Socket.IO Events

#### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `room:create` | `{ houseRules?: HouseRules }` | Create a new room, receive invite code |
| `room:join` | `{ roomId: string }` | Join existing room by code |
| `room:ready` | `{ ready: boolean }` | Mark player ready for game start |
| `game:roll` | `{}` | Request dice roll (if current player) |
| `game:move` | `{ tokenIndex: number }` | Move specified token (intent only) |
| `chat:send` | `{ message: string }` | Send text chat message |
| `room:leave` | `{}` | Leave room gracefully |

#### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `room:state` | `{ ...RoomState }` | Full room state snapshot |
| `game:state` | `{ ...GameState }` | Full game state snapshot |
| `game:diceRolled` | `{ playerId, value }` | Dice roll result |
| `game:tokenMoved` | `{ playerId, tokenIndex, from, to }` | Token moved successfully |
| `game:turnChanged` | `{ playerId, timeLimit }` | Turn passed to new player |
| `game:over` | `{ winnerId, placements }` | Game finished |
| `chat:message` | `{ playerId, message, timestamp }` | Chat message broadcast |
| `player:connectionChanged` | `{ playerId, connected }` | Player connected/disconnected |
| `error` | `{ code, message }` | Error feedback |

### Reconnection Strategy

- **60-second grace period**: Player can reconnect and resume without penalty
- **After 60s**: Player marked as disconnected; game continues with AI or forfeit rules
- **Full state on reconnect**: Server sends complete state snapshot immediately

### LiveKit Integration

- **Token Generation**: Server generates LiveKit tokens after READY_CHECK completes
- **Room Mapping**: Each game room maps to a LiveKit room (1:1)
- **Permissions**: All players have publish/subscribe permissions (video, audio, screen share)
- **Token Lifecycle**: Tokens valid for duration of game session
- **Deferred Initialization**: Video/audio connections established after game countdown

## Data Model

### Database Schema (Supabase PostgreSQL)

```sql
-- Users
users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)

-- Rooms (active sessions)
rooms (
  id UUID PRIMARY KEY,
  invite_code TEXT UNIQUE,
  host_id UUID REFERENCES users(id),
  house_rules JSONB,
  state TEXT, -- LOBBY, READY_CHECK, etc.
  created_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ
)

-- Matches (completed games)
matches (
  id UUID PRIMARY KEY,
  room_id UUID REFERENCES rooms(id),
  house_rules JSONB,
  winner_id UUID REFERENCES users(id),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  total_turns INTEGER,
  final_state JSONB
)

-- Match Players
match_players (
  id UUID PRIMARY KEY,
  match_id UUID REFERENCES matches(id),
  user_id UUID REFERENCES users(id),
  color TEXT, -- red, green, yellow, blue
  placement INTEGER, -- 1st, 2nd, 3rd, 4th
  turns_taken INTEGER,
  captures INTEGER,
  was_captured INTEGER
)

-- Friendships (Post-MVP)
friendships (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  friend_id UUID REFERENCES users(id),
  status TEXT, -- pending, accepted, blocked
  created_at TIMESTAMPTZ,
  UNIQUE(user_id, friend_id)
)
```

### Rules Engine API

The `@ludi/rules` package exports pure functions:

```typescript
// Game initialization
createGame(config: GameConfig): GameState

// Dice rolling (RNG injected for testability)
rollDice(state: GameState, rng: () => number): GameState

// Move validation
legalMoves(state: GameState): Move[]

// Move application
applyMove(state: GameState, move: Move): GameState

// Game status checks
isGameOver(state: GameState): boolean
getWinner(state: GameState): PlayerId | null
```

All functions are **pure** (no side effects), **immutable** (return new state), and **deterministic** (given RNG).

## Development Milestones

### Phase 0: Scaffold (✅ Current)
- Monorepo structure with pnpm workspaces
- Hello-world Socket.IO connection
- Basic documentation

### Phase 1: Rules Engine (1.1–1.4)
- **1.1**: Core types and game initialization
- **1.2**: Dice rolling and turn management
- **1.3**: Token movement and validation
- **1.4**: Captures, blockades, win conditions

### Phase 2: Local Gameplay
- Board UI with SVG rendering
- Token animations with Reanimated
- Local game loop (single device, no network)
- House rules configuration screen

### Phase 3: Online Multiplayer
- Room creation and joining
- Real-time state synchronization
- Reconnection handling
- Chat messages

### Phase 4: Video Chat
- LiveKit integration
- Video/audio controls (mute, camera toggle)
- Picture-in-picture layout
- Connection quality indicators

### Phase 5: User Accounts
- Supabase Auth integration
- Guest accounts → full accounts
- Profile management
- Match history

### Phase 6: Polish & Post-MVP
- Animations and sound effects
- Onboarding tutorial
- Friend system
- Match replay
- Rankings and leaderboards

## Environment Variables

### Server

```bash
# Server
PORT=3000
NODE_ENV=development

# Database (Supabase)
DATABASE_URL=postgresql://...
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_KEY=...

# LiveKit (Phase 4)
LIVEKIT_API_KEY=...
LIVEKIT_API_SECRET=...
LIVEKIT_URL=wss://...

# Security
JWT_SECRET=...
CORS_ORIGIN=*
```

### Mobile (Expo)

Early development uses Expo Go. LiveKit integration requires EAS builds (custom native modules).

```bash
# .env (managed by expo-env)
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
EXPO_PUBLIC_LIVEKIT_URL=...
```

## Deployment Strategy

### Development
- **Server**: Local development with `pnpm dev:server`
- **Mobile**: Expo Go for rapid iteration
- **Database**: Supabase free tier

### Staging
- **Server**: Railway or Render (free tier)
- **Mobile**: EAS builds (internal distribution)
- **Database**: Supabase staging project

### Production
- **Server**: Railway/Render/Fly.io (paid tier, auto-scaling)
- **Mobile**: App Store + Google Play via EAS
- **Database**: Supabase production project (pooling enabled)
- **CDN**: Cloudflare for static assets

## Testing Strategy

### Unit Tests (Vitest)
- `@ludi/rules`: 100% coverage of pure game logic
- Server: Business logic and validation
- Critical edge cases (see GAME_RULES.md)

### Integration Tests
- Socket.IO event flows
- Database operations
- Auth flows

### E2E Tests (Phase 5+)
- Detox for mobile UI flows
- Critical user journeys

## Performance Targets

- **Server**: <50ms response time for game actions
- **Client**: 60 FPS animations
- **Network**: Graceful degradation on 3G
- **Reconnection**: <2s to resync state

## Security Considerations

1. **Input Validation**: All client inputs validated server-side
2. **Rate Limiting**: Prevent spam and abuse
3. **Auth Tokens**: Short-lived JWT with refresh tokens
4. **Database**: Row-level security policies in Supabase
5. **Dice Integrity**: Server-only randomness prevents cheating
6. **Move Validation**: Server enforces rules; client cannot cheat

## Future Considerations (Post-MVP)

- **Horizontal Scaling**: Redis for session state, pub/sub for multi-server
- **Spectator Mode**: Read-only Socket.IO connections
- **Tournament System**: Bracket management, matchmaking
- **AI Opponents**: Monte Carlo tree search for single-player
- **Analytics**: Game metrics, user retention, error tracking
- **Monetization**: Cosmetic skins, premium rooms, battle pass
