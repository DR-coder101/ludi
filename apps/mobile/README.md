# Ludi Mobile App

## Environment Variables

Create a `.env` file in the `apps/mobile` directory with the following variables:

```bash
# Server URL (default: http://localhost:3000)
EXPO_PUBLIC_SOCKET_URL=http://localhost:3000

# For development with a physical device on the same network:
# EXPO_PUBLIC_SOCKET_URL=http://192.168.1.x:3000
```

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
   - Use `http://localhost:3000`
   
2. **Physical device on same network:**
   - Find your computer's local IP address
   - Use `http://<your-ip>:3000`
   - Example: `http://192.168.1.10:3000`

3. **Deployed server:**
   - Use the deployed server URL
   - Example: `https://ludi-server.railway.app`
