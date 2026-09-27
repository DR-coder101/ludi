# Ludi

Caribbean (Jamaican) Ludo — Expo + Socket.IO multiplayer game with live video chat.

## Overview

Ludi is a 4-player mobile multiplayer implementation of Caribbean/Jamaican Ludo with real-time gameplay, live video chat, and user accounts. This repository contains the complete stack:

- **Mobile App**: React Native + Expo SDK 52 (iOS/Android) with expo-router navigation
- **Game Server**: Node.js + Express + Socket.IO (server-authoritative multiplayer)
- **Game Rules**: Pure TypeScript rules engine (shared client/server, dependency-free)
- **Protocol**: Shared Socket.IO event types and Zod schemas for type-safe networking

**Current status**: Milestones M1–M5 are complete (rules engine, local pass-and-play, online multiplayer with rooms and reconnect, LiveKit video chat, Supabase auth/profiles/match history, polish). See [Status](#status).

## Project Structure

```
ludi-monorepo/
├── apps/
│   └── mobile/          # Expo mobile app (React Native + expo-router)
├── server/              # Express + Socket.IO authoritative game server
├── packages/
│   ├── rules/           # Pure game logic (dependency-free, runs client + server)
│   └── protocol/        # Shared Socket.IO types and Zod validation schemas
├── docs/
│   ├── ARCHITECTURE.md  # Full technical specification
│   ├── GAME_RULES.md    # Jamaican Ludo rules (source of truth for the engine)
│   ├── PROMPT_PACK.md   # Development roadmap and milestone prompts
│   └── QA_RUNBOOK.md    # 4-player real-device QA procedure
├── package.json         # Monorepo root scripts
└── pnpm-workspace.yaml  # pnpm workspace configuration
```

## Prerequisites

- **Node.js**: 20.x or higher
- **pnpm**: 9.x or higher
- **Android**: Android Studio with the Android SDK (for Android builds and emulators)
- **iOS**: Xcode 15+ and iOS Simulator (macOS only)

Install pnpm globally if you don't have it:

```bash
npm install -g pnpm
```

## Getting Started

### 1. Install dependencies

```bash
git clone <repository-url>
cd ludi-monorepo
pnpm install
```

This installs dependencies for all workspaces (server, mobile, packages).

### 2. Configure environment variables

```bash
cp server/.env.example server/.env
cp apps/mobile/.env.example apps/mobile/.env
```

Then fill in the values described in [Environment Variables](#environment-variables). The server starts without LiveKit or Supabase credentials, but video chat and auth/profiles/match history are disabled until they are set.

### 3. Run the server

```bash
pnpm dev:server
```

The server listens on port `3000` by default (override with `PORT` in `server/.env`). You should see:

```
🎲 Ludi server running on http://localhost:3000
🔌 Socket.IO ready for connections
```

Check it with `http://localhost:3000` (server info) and `http://localhost:3000/health` (health check).

### 4. Run the mobile app

LiveKit video uses native WebRTC modules, which **do not load in Expo Go**, and the online game screen imports them. Use a native development build instead. Run these from `apps/mobile` (the Expo CLI is installed there, not at the repo root):

```bash
cd apps/mobile
npx expo run:android   # builds and installs a native debug app on the running emulator/device
npx expo run:ios       # macOS only
```

Once the native app is installed, `pnpm dev:mobile` (from the repo root) starts the Metro bundler it loads JavaScript from.

**Pointing the app at the server** — set `EXPO_PUBLIC_SOCKET_URL` in `apps/mobile/.env`:

| Where the app runs | `EXPO_PUBLIC_SOCKET_URL` |
|---|---|
| iOS simulator | `http://localhost:3000` |
| Android emulator | `http://10.0.2.2:3000` (or run `adb reverse tcp:3000 tcp:3000` and use `http://localhost:3000`) |
| Physical device on the same network | `http://<your-computer's-LAN-IP>:3000`, e.g. `http://192.168.1.100:3000` |

Restart Metro after changing `.env`; `EXPO_PUBLIC_*` values are inlined at bundle time.

**EAS development builds** (for installing on devices without a USB connection): the repo does not yet contain an `eas.json` or the `expo-dev-client` package, so set those up first (`eas build:configure`, then `npx expo install expo-dev-client`) before running `eas build --profile development --platform android` (or `ios`). See https://docs.expo.dev/develop/development-builds/create-a-build/.

### 5. Check it works

1. On the home screen, choose **Local Pass & Play** to play 2–4 players on one device (no server needed), or **Online Multiplayer** to create/join a room.
2. When you create an online room, the server logs `Room created: <CODE> by player ...`.
3. The host can start once 2–4 players have joined. Video chat connects when the game screen opens (requires the LiveKit variables on both server and mobile).

## Development Scripts

Run from the monorepo root:

```bash
# Development
pnpm dev:server          # Start the server with hot reload (tsx watch)
pnpm dev:mobile          # Start the Expo/Metro dev server
pnpm dev                 # Run server and mobile dev servers in parallel

# Testing
pnpm test                # Run all test suites (@ludi/rules and server)
pnpm test:rules          # Run only @ludi/rules tests

# Type checking
pnpm lint                # tsc --noEmit in every workspace

# Building
pnpm build               # Compile the server (the only workspace with a build step)
```

### Workspace-specific commands

```bash
# Server
pnpm --filter server dev
pnpm --filter server build
pnpm --filter server start     # runs the compiled dist/index.js
pnpm --filter server test

# Mobile (these run `expo start`; they open an already-installed native build or Expo Go)
pnpm --filter mobile dev
pnpm --filter mobile android
pnpm --filter mobile ios

# Rules package
pnpm --filter @ludi/rules test
pnpm --filter @ludi/rules test:watch
pnpm --filter @ludi/rules demo    # CLI demo: plays a full random game in the terminal
```

## Architecture

Ludi follows a **server-authoritative** architecture:

1. **Client** sends intents (e.g., "roll dice", "move token 2")
2. **Server** rolls the dice and validates moves with the `@ludi/rules` engine
3. **Server** broadcasts authoritative state to all clients via Socket.IO
4. **Client** can predict locally for smooth UX, but the server always wins (rollback on rejection)

The `@ludi/rules` package is **pure TypeScript** (zero dependencies, no side effects) and is shared by client and server, so there is one ruleset and no drift. See `docs/ARCHITECTURE.md` for the full spec.

## Status

**Completed milestones** (on `main`):

- ✅ **M1**: Rules engine with Jamaican Ludo logic (blockades, captures, consecutive-sixes limit, house-rule toggles) and a CLI demo game
- ✅ **M2**: Local pass-and-play UI with board rendering, animations, haptics, and sound effects
- ✅ **M3**: Online multiplayer — room codes, authoritative turn loop, reconnect with session tokens, 60-second grace period, AI substitute on dropout
- ✅ **M4**: LiveKit video chat (server `POST /video-token` endpoint + client 2×2 video grid with mic/camera toggles) and text chat
- ✅ **M5**: Supabase auth (email + guest, guest upgrade), profiles, match history, final polish (onboarding, app icon, splash screen, error toasts)

**In progress / decided**:

- The board is Dean's 19×19 Jamaican plywood layout (8×8 yards, 3×8 arms, 3×3 centre). The on-screen track coordinates in `apps/mobile/src/components/board/boardLayout.ts` still have known mapping bugs; the engine itself is unaffected.
- The game is moving to **two dice**. This is decided but not yet implemented; the engine currently rolls a single die (see `docs/GAME_RULES.md` §2).

**Not implemented**:

- ❌ App Store / Play Store release
- ❌ Matchmaking or public lobbies (room-code only)
- ❌ Friends list or social features
- ❌ Monetization

## Environment Variables

### Server (`server/.env`)

```bash
PORT=3000                     # optional; defaults to 3000

# LiveKit (video chat)
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret
LIVEKIT_URL=wss://your-project.livekit.cloud

# Supabase (auth, profiles, match history)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

`SUPABASE_SERVICE_ROLE_KEY` grants admin access — keep it server-side only.

### Mobile (`apps/mobile/.env`)

```bash
# Game server URL (Socket.IO, auth, profiles, match history)
EXPO_PUBLIC_SOCKET_URL=http://localhost:3000

# LiveKit URL (video chat)
EXPO_PUBLIC_LIVEKIT_URL=wss://your-project.livekit.cloud

# Supabase - anon (public) key only, never the service_role key
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

**Known inconsistency:** the video-token request (`apps/mobile/src/net/videoToken.ts`) reads `EXPO_PUBLIC_SERVER_URL` instead of `EXPO_PUBLIC_SOCKET_URL`, falling back to `http://localhost:3000`. Until that is fixed in code, also set `EXPO_PUBLIC_SERVER_URL` to the same value when testing video on an emulator or device.

## Testing

Vitest runs the rules engine and server tests:

```bash
pnpm test                         # everything
pnpm test:rules                   # rules engine only
pnpm --filter server test         # server: room lifecycle, turn loop, reconnect, auth, video token, match history

cd packages/rules && pnpm test:watch   # watch mode
```

For end-to-end testing on real phones, follow `docs/QA_RUNBOOK.md`.

## Documentation

- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)**: Technical specification — tech stack, trust model, networking events, data model
- **[GAME_RULES.md](docs/GAME_RULES.md)**: Jamaican Ludo rules, board, edge cases, house rules (source of truth for `packages/rules`)
- **[PROMPT_PACK.md](docs/PROMPT_PACK.md)**: Ordered development milestones with agent prompts
- **[QA_RUNBOOK.md](docs/QA_RUNBOOK.md)**: 4-player real-device QA procedure

## Troubleshooting

### "Cannot connect to server" in the mobile app

1. Verify the server is running: `pnpm dev:server`
2. Check `EXPO_PUBLIC_SOCKET_URL` in `apps/mobile/.env` (see the table in [Run the mobile app](#4-run-the-mobile-app)), then restart Metro
3. For physical devices, use your computer's LAN IP, not `localhost`
4. Make sure your firewall allows connections on port 3000 (or your `PORT` override)

### Video chat not working

1. Expo Go cannot load LiveKit — use a native build (`npx expo run:android` / `npx expo run:ios` from `apps/mobile`)
2. Check the `LIVEKIT_*` variables in `server/.env` and `EXPO_PUBLIC_LIVEKIT_URL` in `apps/mobile/.env`
3. Set `EXPO_PUBLIC_SERVER_URL` as described in [Mobile environment variables](#mobile-appsmobileenv)
4. Video only starts once the game begins

### Android build fails with "JAVA_HOME not set"

Point `JAVA_HOME` at the JDK bundled with Android Studio, then restart your terminal:

- **Windows**: `set JAVA_HOME=C:\Program Files\Android\Android Studio\jbr`
- **macOS**: `export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"`
- **Linux**: `export JAVA_HOME=/opt/android-studio/jbr`

### pnpm install fails

1. Check versions: `node --version` (20.x+) and `pnpm --version` (9.x+)
2. Clear the pnpm cache: `pnpm store prune`
3. Delete `node_modules` folders and retry `pnpm install`

### Metro bundler won't start

1. Clear the Expo cache: `cd apps/mobile && npx expo start -c`
2. Check for port conflicts (Metro defaults to 8081)

## Contributing

This is Dean's personal project. Contributions are welcome, but please discuss major changes via GitHub issues first.

1. Create a feature branch from `main`
2. Make changes, add tests where applicable
3. Ensure tests pass: `pnpm test`
4. Ensure TypeScript compiles: `pnpm lint`
5. Open a pull request with a clear description

## License

UNLICENSED — private project.
