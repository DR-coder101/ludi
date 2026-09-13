# Ludi Mobile

React Native + Expo mobile app for Caribbean/Jamaican Ludo.

## Tech Stack

- **Expo SDK 52+**: Modern React Native development
- **expo-router**: File-based routing (v4)
- **TypeScript**: Strict mode
- **Socket.IO Client**: Real-time multiplayer
- **@ludi/rules**: Game logic (client-side prediction)
- **@ludi/protocol**: Type-safe Socket.IO events

## Development

```bash
# Start Expo dev server
pnpm dev

# Run on iOS simulator
pnpm ios

# Run on Android emulator
pnpm android

# Run in web browser (for testing)
pnpm web
```

## Current Features (Phase 0.1)

- Socket.IO connection to server
- Connection status display
- Real-time message logging
- Hello-world pong response

## Future Architecture

### State Management
- **Zustand + Immer**: Client game state
- **React Query**: Server synchronization

### UI Components
- **Reanimated**: Smooth animations
- **React Native SVG**: Board rendering
- **Custom components**: Board, tokens, dice

### Features by Phase
- **Phase 2**: Local game UI (board, tokens, turns)
- **Phase 3**: Online multiplayer (rooms, matchmaking)
- **Phase 4**: Live video chat (LiveKit integration)
- **Phase 5**: User accounts (Supabase Auth)

## Configuration

Update `SERVER_URL` in `app/index.tsx` to match your server location.

For Expo Go development:
- Use your local IP address (e.g., `http://192.168.1.100:3000`)
- Or use ngrok for tunneling

For EAS builds (Phase 4+):
- Use production server URL
- Configure environment variables in `eas.json`
