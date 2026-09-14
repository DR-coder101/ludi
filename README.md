# Ludi

Caribbean (Jamaican) Ludo — Expo + Socket.IO monorepo.

**Phase 0.1** - Monorepo scaffold with hello-world Socket.IO connection.

## Overview

Ludi is a 4-player mobile multiplayer implementation of Caribbean/Jamaican Ludo with live video chat. This repository contains the complete stack:

- **Mobile App**: React Native + Expo SDK 52+ (iOS/Android)
- **Game Server**: Node.js + Express + Socket.IO
- **Game Rules**: Pure TypeScript engine (shared client/server)
- **Protocol**: Shared type definitions for type-safe networking

## Project Structure

```
ludi-monorepo/
├── apps/
│   └── mobile/          # Expo mobile app (React Native)
├── server/              # Express + Socket.IO server
├── packages/
│   ├── rules/           # Pure game logic (dependency-free)
│   └── protocol/        # Shared Socket.IO types
├── docs/
│   ├── ARCHITECTURE.md  # Full technical specification
│   ├── GAME_RULES.md    # Official Jamaican Ludo rules
│   └── PROMPT_PACK.md   # Development roadmap
├── package.json         # Monorepo scripts
└── pnpm-workspace.yaml  # Workspace configuration
```

## Prerequisites

- **Node.js**: 20.x or higher
- **pnpm**: 9.x or higher
- **iOS**: Xcode 15+ and iOS Simulator (for iOS development)
- **Android**: Android Studio and Android Emulator (for Android development)

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

In a new terminal, start the Expo development server:

```bash
pnpm dev:mobile
```

This opens the Expo developer tools. You can then:

- **iOS Simulator**: Press `i` to open in iOS Simulator
- **Android Emulator**: Press `a` to open in Android Emulator  
- **Physical Device**: Scan QR code with Expo Go app

**⚠️ Important: Video Chat Requires EAS Development Build**

The LiveKit video chat feature (M4) requires native modules that **do NOT work in Expo Go**. To use video chat, you must create an EAS development build:

```bash
# Install EAS CLI globally
npm install -g eas-cli

# Log in to your Expo account
eas login

# Create a development build for your device
cd apps/mobile
eas build --profile development --platform ios    # or android
```

Once the build completes, install it on your physical device. Development builds include all native modules and can connect to your local server just like Expo Go.

For more details, see: https://docs.expo.dev/develop/development-builds/create-a-build/

**Environment Variables**:
- `EXPO_PUBLIC_SERVER_URL`: Backend server URL (default: `http://localhost:3000`)
- `EXPO_PUBLIC_LIVEKIT_URL`: LiveKit server URL (required for video chat)

Update these in `apps/mobile/.env.local` or via EAS Secrets for development builds.

**Note**: Update `SERVER_URL` if running on a physical device:
- Use your local IP address (e.g., `http://192.168.1.100:3000`)
- Or use a tunneling service like ngrok

### 4. Test the Connection

Once both server and mobile app are running:

1. The mobile app should automatically connect to the server
2. You'll see "🟢 Connected" status in the app
3. The connection log will show: "📨 Welcome! Server says: Hello from @ludi/rules"
4. Tap "Test Connection" button to verify bidirectional communication

## Development Scripts

Run from the monorepo root:

```bash
# Development
pnpm dev:server          # Start server with hot reload
pnpm dev:mobile          # Start Expo dev server
pnpm dev                 # Run both server and mobile in parallel

# Testing
pnpm test                # Run all tests (all packages)
pnpm test:rules          # Run only game rules tests

# Type Checking
pnpm lint                # TypeScript type check (all packages)

# Building
pnpm build               # Build all packages
```

### Workspace-Specific Commands

Run commands in specific workspaces:

```bash
# Server
pnpm --filter server dev
pnpm --filter server build
pnpm --filter server start

# Mobile
pnpm --filter mobile dev
pnpm --filter mobile ios
pnpm --filter mobile android

# Rules Package
pnpm --filter @ludi/rules test
pnpm --filter @ludi/rules test:watch
```

## Testing

The project uses Vitest for testing. Currently only the rules package has tests:

```bash
# Run rules package tests
pnpm test:rules

# Watch mode (auto-rerun on changes)
cd packages/rules
pnpm test:watch
```

**Expected output**:
```
✓ packages/rules/src/index.test.ts (1)
  ✓ rules package (1)
    ✓ should export hello function

Test Files  1 passed (1)
Tests  1 passed (1)
```

## Architecture

Ludi follows a **server-authoritative** architecture:

1. **Client** sends intents (e.g., "roll dice", "move token 2")
2. **Server** validates using `@ludi/rules` engine
3. **Server** broadcasts authoritative state to all clients
4. **Client** can predict locally for smooth UX, but server always wins

The `@ludi/rules` package is **pure TypeScript** (no dependencies, no side effects) and is shared by both client and server. This ensures consistent game logic and enables client-side prediction.

## Current Phase: 0.1 (Scaffold)

**What's implemented**:
- ✅ Monorepo structure with pnpm workspaces
- ✅ Server with Express + Socket.IO (hello-world)
- ✅ Mobile app with Expo + expo-router
- ✅ Basic Socket.IO connection (client ↔ server)
- ✅ Packages: rules (hello function + test), protocol (type placeholders)
- ✅ Documentation (ARCHITECTURE.md, GAME_RULES.md, PROMPT_PACK.md)

**What's NOT implemented yet**:
- ❌ Game rules engine (Phase 1)
- ❌ Board UI and gameplay (Phase 2)
- ❌ Multiplayer rooms (Phase 3)
- ❌ Live video chat (Phase 4)
- ❌ User accounts (Phase 5)

See `docs/PROMPT_PACK.md` for the complete development roadmap.

## Documentation

- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)**: Full technical specification, tech stack, data models, API design
- **[GAME_RULES.md](docs/GAME_RULES.md)**: Official Caribbean/Jamaican Ludo rules, edge cases, house rules
- **[PROMPT_PACK.md](docs/PROMPT_PACK.md)**: Ordered development milestones and prompts

## Troubleshooting

### "Cannot connect to server" in mobile app

1. Verify server is running: `pnpm dev:server`
2. Check `SERVER_URL` in `apps/mobile/app/index.tsx` matches your server address
3. For physical devices, use your computer's local IP (not `localhost`)
4. Check firewall settings allow connections on port 3000

### pnpm install fails

1. Verify Node.js version: `node --version` (should be 20.x+)
2. Verify pnpm version: `pnpm --version` (should be 9.x+)
3. Clear pnpm cache: `pnpm store prune`
4. Delete `node_modules` and `pnpm-lock.yaml`, then retry

### Expo won't start

1. Clear Expo cache: `cd apps/mobile && npx expo start -c`
2. Verify Expo CLI is installed: `npx expo --version`
3. Check for port conflicts (default: 8081, 19000, 19001)

### TypeScript errors

1. Ensure all dependencies installed: `pnpm install`
2. Check for TypeScript version conflicts: `pnpm why typescript`
3. Rebuild type definitions: `pnpm -r exec tsc --build --clean && pnpm build`

## Contributing

This is Dean's personal project. Contributions welcome but please discuss major changes via issues first.

Development workflow:
1. Create feature branch from `main`
2. Make changes, add tests
3. Ensure all tests pass: `pnpm test`
4. Ensure TypeScript compiles: `pnpm lint`
5. Submit PR with clear description

## License

UNLICENSED - Private project.

## Roadmap

- **Phase 1** (Next): Implement game rules engine in `@ludi/rules`
- **Phase 2**: Build local gameplay UI (board, tokens, animations)
- **Phase 3**: Add online multiplayer (rooms, matchmaking)
- **Phase 4**: Integrate LiveKit for video chat
- **Phase 5**: Add user accounts and persistence (Supabase)
- **Phase 6**: Polish, sound effects, app store submission

See `docs/PROMPT_PACK.md` for detailed milestones.

---

**Status**: Phase 0.1 Complete ✅ | Next: Phase 1.1 (Core Types)
