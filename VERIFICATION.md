# Verification Guide: Fix "Opening the room…" Hang

## PR: #40

Branch: `cursor/fix-create-room-hang-0e59`

## What was fixed

1. **Race condition**: `room:create` emitted `room:state` before lobby mounted → missed event → infinite hang
2. **SecureStore web crash**: expo-secure-store is iOS/Android only, crashed on web
3. **Auth 503 hang**: When Supabase unset, auth failures caused infinite spinner instead of error

## How to verify

### Test 1: Normal Create (Auth UP)

**Setup**: Server with Supabase configured
```bash
cd server
# Ensure .env has SUPABASE_URL and SUPABASE_ANON_KEY
pnpm dev
```

**Steps**:
1. Open mobile app
2. Tap "Online Play"
3. Enter name → "Create Room"
4. **Expected**: Lobby opens within 1-2 seconds showing room code

**Pass**: ✅ Lobby shows immediately, no "Opening the room…" hang

---

### Test 2: Auth Down (503 handling)

**Setup**: Server without Supabase
```bash
cd server
# Remove or comment out SUPABASE_URL in .env
pnpm dev
```

**Steps**:
1. Open mobile app
2. Tap "Online Play"
3. Enter name → "Create Room"
4. **Expected within 10s**: 
   - "Unable to load room" error
   - Error message visible
   - "Retry" and "Back to Home" buttons

**Pass**: ✅ Error UI shows, no infinite hang

---

### Test 3: Web Platform (localStorage fallback)

**Setup**: Run mobile on web
```bash
cd apps/mobile
pnpm start
# Open http://localhost:8081 in browser
```

**Steps**:
1. Open DevTools → Console (check for SecureStore errors)
2. Create room with name
3. **Expected**: 
   - No "SecureStore not available" errors
   - Room creates successfully
   - localStorage used instead (check Application → Local Storage)

**Pass**: ✅ Works on web, no crashes

---

### Test 4: Race Condition Recovery

**Setup**: Server running, slow network simulation
```bash
# In browser DevTools → Network tab
# Set throttling to "Slow 3G"
```

**Steps**:
1. Create room
2. **Expected**: Even with slow network, lobby loads (may take a few seconds)
3. Should NOT hang forever

**Pass**: ✅ Lobby eventually loads, timeout at 10s if truly stuck

---

### Test 5: Reconnect Flow

**Setup**: Existing room
```bash
# Create a room first
```

**Steps**:
1. After creating room, note the room code
2. Kill app / close browser tab
3. Reopen app → Join Room → enter same code
4. **Expected**: Joins successfully, loads room state

**Pass**: ✅ Reconnect works, room state syncs

---

## Logs to check

### Server logs (expected):
```
Client connected: <socket-id>
Room created: <CODE> by player <player-id> (socket <socket-id>)
```

### Mobile logs (expected):
```
[Lobby] Room state update: { roomCode: '...', players: [...] }
```

### Error case logs (expected when auth down):
```
[Lobby] Timeout waiting for room state
```

---

## Files changed

- `packages/protocol/src/index.ts`: Added `room:requestState` event
- `server/src/server.ts`: Added `room:requestState` handler
- `apps/mobile/src/utils/storage.ts`: **NEW** - Cross-platform storage
- `apps/mobile/src/net/socket.ts`: Use cross-platform storage
- `apps/mobile/src/stores/authStore.ts`: Use cross-platform storage
- `apps/mobile/app/lobby/[code].tsx`: Request state on mount + timeout
- `apps/mobile/src/components/lobby/LobbyRoom.tsx`: Error state UI

---

## CI Status

All tests pass:
- ✅ `@ludi/rules` (129 tests)
- ✅ `mobile` (68 tests)
- ✅ `server` (84 tests)

No TypeScript errors.
