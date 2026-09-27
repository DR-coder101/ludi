# Ludi Mobile App

## Environment Variables

Copy `.env.example` to `.env` in the `apps/mobile` directory and set:

```bash
# Game server URL (default: http://localhost:3000)
EXPO_PUBLIC_SOCKET_URL=http://localhost:3000

# For development with a physical device on the same network:
# EXPO_PUBLIC_SOCKET_URL=http://192.168.1.x:3000

# LiveKit URL (video chat)
EXPO_PUBLIC_LIVEKIT_URL=wss://your-project.livekit.cloud

# Supabase (auth, profiles, match history) - anon key only, never the service_role key
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

`EXPO_PUBLIC_SOCKET_URL` is used for the Socket.IO connection and the auth, profile and match-history requests. The one exception is the video-token request in `src/net/videoToken.ts`, which currently reads `EXPO_PUBLIC_SERVER_URL`. Until that is fixed in code, set `EXPO_PUBLIC_SERVER_URL` to the same value as `EXPO_PUBLIC_SOCKET_URL` when testing video on anything other than `localhost`.

## Development

```bash
# Install dependencies
pnpm install

# Start the development server
pnpm dev

# Run on Android
pnpm android

# Run on iOS
pnpm ios
```

## Connecting to the Server

1. **Local development (emulator/simulator):**
   - iOS simulator: use `http://localhost:3000`
   - Android emulator: use `http://10.0.2.2:3000`, or run `adb reverse tcp:3000 tcp:3000` and use `http://localhost:3000`

2. **Physical device on same network:**
   - Find your computer's local IP address
   - Use `http://<your-ip>:3000`
   - Example: `http://192.168.1.10:3000`

3. **Deployed server:**
   - Use the deployed server URL
   - Example: `https://ludi-server.railway.app`
