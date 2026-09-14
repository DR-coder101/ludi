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

# Note: The server will run without Supabase configured, but M5.1 features
# (auth, profiles, match history) will be disabled.
```

## Endpoints

- `GET /` - Server info and status
- `GET /health` - Health check

## Socket.IO Events

### Phase 0 (Hello World)
- Client connects → Server emits `pong`

### Future Phases
See `docs/ARCHITECTURE.md` for full event specification.
