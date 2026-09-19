# Ludi

Caribbean (Jamaican) Ludo — Expo + Socket.IO multiplayer game with live video chat.

## Overview

Ludi is a 4-player mobile multiplayer implementation of Caribbean/Jamaican Ludo with real-time gameplay, live video chat, and user accounts. This repository contains the complete stack:

- **Mobile App**: React Native + Expo SDK 52 (iOS/Android) with expo-router navigation
- **Game Server**: Node.js + Express + Socket.IO (server-authoritative multiplayer)
- **Game Rules**: Pure TypeScript rules engine (shared client/server, dependency-free)
- **Protocol**: Shared Socket.IO event types and Zod schemas for type-safe networking

**Current Status**: Milestones M1–M5 complete (rules engine, local pass-and-play, online multiplayer with rooms/reconnect, LiveKit video chat, Supabase auth/profiles/match history, polish). See [Status](#status) below.

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
│   ├── GAME_RULES.md    # Official Jamaican Ludo rules reference
│   ├── PROMPT_PACK.md   # Development roadmap and milestone prompts
│   └── QA_RUNBOOK.md    # QA test scenarios
├── package.json         # Monorepo root scripts
└── pnpm-workspace.yaml  # pnpm workspace configuration
```

## Prerequisites

- **Node.js**: 20.x or higher
- **pnpm**: 9.x or higher
- **Android**: Android Studio with Android SDK (for Android development/emulation)
- **iOS**: Xcode 15+ and iOS Simulator (macOS only, for iOS development)

Install pnpm globally if you don't have it:

```bash
npm install -g pnpm
```

## Getting Started

### 1. Install Dependencies

Clone the repository and install all dependencies:

```bash
git clone <repository-url>
cd ludi-monorepo
pnpm install
```

This installs dependencies for all workspaces (server, mobile, packages).

### 2. Run the Server

Start the backend server in development mode:

```bash
pnpm dev:server
```

The server will start on `http://localhost:3000`. You should see:

```
🎲 Ludi server running on http://localhost:3000
🔌 Socket.IO ready for connections
```

**Test the server**:
- Open `http://localhost:3000` in a browser to see server info
- Open `http://localhost:3000/health` for health check

### 3. Run the Mobile App

**IMPORTANT**: For online multiplayer and video chat features, you **must** use a native development build or run directly on a device/emulator using `npx expo run:android` or `npx expo run:ios`. **Expo Go does NOT support** the LiveKit native video SDK.

#### Option A: Native Build on Android Emulator (Recommended for Windows)

```bash
# Start Android Studio and launch an Android emulator first
# Then from the project root:
npx expo run:android --device
```

Or, if you prefer to use the workspace filter:

```bash
pnpm --filter mobile android
```

**Environment Configuration for Android Emulator**:

Android emulators use a special IP address `10.0.2.2` to reach the host machine's `localhost`. Set this in your environment:

```bash
# In apps/mobile/.env.local (create if it doesn't exist):
EXPO_PUBLIC_SOCKET_URL=http://10.0.2.2:3000
```

Alternatively, you can use `adb reverse` to map ports:

```bash
adb reverse tcp:3000 tcp:3000
# Then use EXPO_PUBLIC_SOCKET_URL=http://localhost:3000
```

#### Option B: Physical Device on Same Network

For testing on a physical Android or iOS device:

1. Find your computer's local IP address:
   - **Windows**: `ipconfig` (look for IPv4 Address)
   - **macOS/Linux**: `ifconfig` or `ip addr` (look for 192.168.x.x)

2. Update `apps/mobile/.env.local`:

```bash
EXPO_PUBLIC_SOCKET_URL=http://192.168.1.100:3000  # Replace with your IP
```

3. Build and install the development client:

```bash
npx expo run:android  # or npx expo run:ios on macOS
```

#### Option C: EAS Development Build (For Testing on Physical Devices Without USB)

If you need to test on physical devices without a USB connection, create an EAS development build:

```bash
# Install EAS CLI globally if you haven't
npm install -g eas-cli

# Log in to your Expo account
eas login

# Create a development build
cd apps/mobile
eas build --profile development --platform android  # or ios
```

Once the build completes, install it on your device. Development builds include all native modules (LiveKit) and can connect to your local server.

### 4. Test the Connection

Once both server and mobile app are running:

1. The mobile app should automatically connect to the server
2. You'll see "🟢 Connected" status in the app
3. Create a room or join an existing room to test online multiplayer
4. Video chat will activate once a game reaches the ready/countdown phase (requires LiveKit configuration)

## Development Scripts

Run from the monorepo root:

```bash
# Development
pnpm dev:server          # Start server with hot reload (tsx watch)
pnpm dev:mobile          # Start Expo dev server
pnpm dev                 # Run both server and mobile in parallel

# Testing
pnpm test                # Run all tests across all packages
pnpm test:rules          # Run only @ludi/rules tests

# Type Checking
pnpm lint                # TypeScript type check (all packages)

# Building
pnpm build               # Build all packages
```

### Workspace-Specific Commands

Run commands in specific workspaces using pnpm filters:

```bash
# Server
pnpm --filter server dev
pnpm --filter server build
pnpm --filter server start
pnpm --filter server test

# Mobile
pnpm --filter mobile dev
pnpm --filter mobile android
pnpm --filter mobile ios

# Rules Package
pnpm --filter @ludi/rules test
pnpm --filter @ludi/rules test:watch
pnpm --filter @ludi/rules demo    # Run CLI demo game
```

## Architecture

Ludi follows a **server-authoritative** architecture:

1. **Client** sends intents (e.g., "roll dice", "move token 2")
2. **Server** validates using `@ludi/rules` engine and generates dice rolls server-side
3. **Server** broadcasts authoritative state to all clients via Socket.IO
4. **Client** can predict locally for smooth UX, but server always wins (rollback on rejection)

The `@ludi/rules` package is **pure TypeScript** (zero dependencies, no side effects) and is shared by both client and server. This ensures consistent game logic and enables client-side prediction without ruleset drift.

## Status

**Completed Milestones** (on `main`):

- ✅ **M1 (Phase 1)**: Full rules engine with Jamaican Ludo logic, blockades, captures, consecutive sixes, house rules support, CLI demo game
- ✅ **M2 (Phase 2)**: Local pass-and-play UI with board rendering, animations, haptics, sound effects, Jamaican-inspired theme
- ✅ **M3 (Phase 3)**: Online multiplayer with rooms, authoritative server, validation, reconnect with session tokens, 60s grace period, AI substitution on dropout
- ✅ **M4**: LiveKit video chat integration (server token endpoint + client 2×2 video grid with mic/camera toggles)
- ✅ **M5**: Supabase auth (email + guest upgrade), user profiles, match history persistence, final polish (onboarding, app icon, splash screen, error states)

**What's NOT implemented**:
- ❌ App Store / Play Store submission (not yet released)
- ❌ Matchmaking or public lobbies (currently room-code based only)
- ❌ Friends list or social features
- ❌ Monetization or in-app purchases

See `docs/PROMPT_PACK.md` for the complete development roadmap and milestone details.

## Environment Variables

### Server (`server/.env`)

Copy `server/.env.example` to `server/.env` and configure:

```bash
PORT=3000

# LiveKit (required for video chat)
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret
LIVEKIT_URL=wss://your-project.livekit.cloud

# Supabase (required for auth and match history)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**Important**: The `SUPABASE_SERVICE_ROLE_KEY` grants admin access — keep it secret and server-side only.

### Mobile (`apps/mobile/.env.local`)

Copy `apps/mobile/.env.example` to `apps/mobile/.env.local` and configure:

```bash
# Socket Server URL
# Android emulator: http://10.0.2.2:3000
# Physical device on LAN: http://192.168.x.x:3000 (your computer's IP)
EXPO_PUBLIC_SOCKET_URL=http://10.0.2.2:3000

# Supabase (required for auth and profiles)
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

**Note**: Only use the Supabase `anon` (public) key in the mobile app. Never use the `service_role` key client-side.

## Testing

The project uses Vitest for unit testing. The rules engine has comprehensive test coverage:

```bash
# Run all tests
pnpm test

# Run only rules package tests
pnpm test:rules

# Watch mode (auto-rerun on changes)
cd packages/rules
pnpm test:watch

# Run the CLI demo game (plays a full random game to completion)
pnpm --filter @ludi/rules demo
```

Server integration tests (room lifecycle, turn state machine, reconnect) are also available:

```bash
pnpm --filter server test
```

## Documentation

- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)**: Full technical specification, tech stack, trust model, networking events, data models
- **[GAME_RULES.md](docs/GAME_RULES.md)**: Official Caribbean/Jamaican Ludo rules, edge cases, house rules reference
- **[PROMPT_PACK.md](docs/PROMPT_PACK.md)**: Ordered development milestones (M1–M5) with agent-friendly prompts
- **[QA_RUNBOOK.md](docs/QA_RUNBOOK.md)**: QA test scenarios and edge cases

## Troubleshooting

### "Cannot connect to server" in mobile app

1. Verify server is running: `pnpm dev:server`
2. Check `EXPO_PUBLIC_SOCKET_URL` in `apps/mobile/.env.local`:
   - Android emulator: use `http://10.0.2.2:3000`
   - Physical device: use your computer's LAN IP (e.g., `http://192.168.1.100:3000`)
3. Ensure firewall allows connections on port 3000
4. For Android emulator, verify the emulator is running and accessible

### Video chat not working / LiveKit errors

1. **Expo Go does NOT support LiveKit**. You must use a native development build:
   - Run `npx expo run:android` or `npx expo run:ios`, OR
   - Create an EAS development build with `eas build --profile development`
2. Verify `LIVEKIT_*` environment variables are set in `server/.env`
3. Check that your LiveKit project is active and credentials are correct
4. LiveKit video only activates once a game reaches the ready/countdown phase

### Android build fails with "JAVA_HOME not set"

If you see Java-related errors when running `npx expo run:android`:

1. Android Studio includes a bundled JDK (recommended). Set `JAVA_HOME` to Android Studio's JBR:
   - **Windows**: `set JAVA_HOME=C:\Program Files\Android\Android Studio\jbr`
   - **macOS**: `export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"`
   - **Linux**: `export JAVA_HOME=/opt/android-studio/jbr`
2. Verify with `echo $JAVA_HOME` (or `echo %JAVA_HOME%` on Windows)
3. Restart your terminal after setting `JAVA_HOME`

### pnpm install fails

1. Verify Node.js version: `node --version` (should be 20.x+)
2. Verify pnpm version: `pnpm --version` (should be 9.x+)
3. Clear pnpm cache: `pnpm store prune`
4. Delete `node_modules` folders and `pnpm-lock.yaml`, then retry `pnpm install`

### Expo Metro bundler won't start

1. Clear Expo cache: `cd apps/mobile && npx expo start -c`
2. Verify Expo CLI is available: `npx expo --version`
3. Check for port conflicts (defaults: 8081, 19000, 19001)

### TypeScript errors after pulling changes

1. Ensure all dependencies installed: `pnpm install`
2. Rebuild packages: `pnpm build`
3. Check for conflicting TypeScript versions: `pnpm why typescript`

## Contributing

This is Dean's personal project. Contributions are welcome, but please discuss major changes via GitHub issues first.

Development workflow:
1. Create a feature branch from `main`
2. Make changes, add tests where applicable
3. Ensure tests pass: `pnpm test`
4. Ensure TypeScript compiles: `pnpm lint`
5. Submit a pull request with a clear description

## License

UNLICENSED - Private project.

---

**Built with** Expo, Socket.IO, LiveKit, Supabase, and agent-assisted development (Cursor).
