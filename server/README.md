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
PORT=3000                # Server port (default: 3000)
DATABASE_URL=...         # Postgres connection (Phase 5)
LIVEKIT_API_KEY=...      # LiveKit credentials (Phase 4)
LIVEKIT_API_SECRET=...   # LiveKit credentials (Phase 4)
```

## Endpoints

- `GET /` - Server info and status
- `GET /health` - Health check

## Socket.IO Events

### Phase 0 (Hello World)
- Client connects → Server emits `pong`

### Future Phases
See `docs/ARCHITECTURE.md` for full event specification.
