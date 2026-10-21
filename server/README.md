# Ludi Server

Express + Socket.IO server for Caribbean/Jamaican Ludo multiplayer game.

## Tech Stack

- **Express**: HTTP server for REST endpoints
- **Socket.IO**: Real-time bidirectional communication
- **TypeScript**: Strict mode, fully typed
- **@ludi/rules**: Pure game logic (shared with client)
- **@ludi/protocol**: Shared type definitions

## Architecture

- Server is the **sole source of truth** for game state
- Client sends intents (e.g., `game:move`), server validates and broadcasts results
- Full-state-over-delta: clients receive complete state snapshots
- 60-second reconnection grace period

## Development

```bash
# Start dev server with auto-reload
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

## Environment Variables

```bash
PORT=3000                          # Server port (default: 3000)

# LiveKit (M4 - Video chat)
LIVEKIT_API_KEY=...                # LiveKit API key
LIVEKIT_API_SECRET=...             # LiveKit API secret
LIVEKIT_URL=...                    # LiveKit server URL (e.g., wss://your-project.livekit.cloud)

# Supabase (M5.1 - Auth & match history)
SUPABASE_URL=...                   # Supabase project URL (e.g., https://xxxxx.supabase.co)
SUPABASE_SERVICE_ROLE_KEY=...      # Supabase service role key (NEVER expose to client)

LUDI_DICE_AUDIT_PATH=
LUDI_MAX_ROOMS=
LUDI_REDIS_ADAPTER=0
LUDI_REDIS_URL=

# Note: The server will run without Supabase configured, but M5.1 features
# (auth, profiles, match history) will be disabled.
```

## Endpoints

- `GET /` - Server info and status
- `GET /health` - Health check
- `POST /invites` - Create a private room. Returns `{ code, shareUrl, sessionToken, playerId, inviterId }`. `shareUrl` is `https://<host>/r/<code>`. The inviter id is a SHA-256 prefix. The server stores no contacts.
- `GET /r/:code` - Landing page that redirects to `ludi://room/<code>` and links App Store / Play Store fallbacks. Records `invite_opened`.
- `GET /opponents/recent` - Last 20 opponents for `x-ludi-player-id` or `Authorization`.
- `POST /opponents/:id/block` and `DELETE /opponents/:id` - Block or remove one opponent.

New socket events: `room:rematchOffer`, `room:rematchRespond`, `room:rematch`. A rematch keeps the same room and seats. Every human player must accept within 30 seconds. Bots are not required to vote.

When `LUDI_MAX_ROOMS` is reached, or the in-process capacity flag is set, `room:create` and `room:join` return `{ success: false, error: "servers busy" }`. In-progress rolls and moves are unchanged.

Dice rolls use `crypto.randomInt(1, 7)`. Each face is appended to the dice audit log as `{ matchId, turn, playerId, value, timestamp }`. A cleanup job drops rows older than 90 days.

## How to run the load test

From `server/`:

```bash
pnpm load-test
```

The script starts a local server, opens concurrent 2-player rooms over Socket.IO, and prints `p95 move latency` plus a JSON line with `p95_ms`. Set `LUDI_LOAD_ROOMS` and `LUDI_LOAD_SAMPLES` to change the size. Set `LUDI_LOAD_URL` to aim at an already running server.

## How to run horizontal scaling with Redis

The Redis adapter stays off unless you set `LUDI_REDIS_ADAPTER=1`. Leave that unset in development and CI.

1. Install the optional packages on the server host: `pnpm add redis @socket.io/redis-adapter`.
2. Run Redis and set `LUDI_REDIS_URL=redis://<host>:6379`.
3. Set `LUDI_REDIS_ADAPTER=1`.
4. Run two or more Node processes behind the same HTTP load balancer. Sticky sessions are still required for Socket.IO polling. Websocket-only clients can use any instance once the adapter is attached.
5. Keep `LUDI_MAX_ROOMS` per process, or put a global cap in front of the fleet. A busy process returns `servers busy` instead of seating a new room. Matches that already started on that process keep playing.

## Socket.IO Events

### Phase 0 (Hello World)
- Client connects → Server emits `pong`

### Future Phases
See `docs/ARCHITECTURE.md` for full event specification.
