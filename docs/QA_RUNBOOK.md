# 4-Player Real-Device QA Runbook for Ludi

This document describes how to perform a complete 4-player test of Ludi on real physical devices.

## Prerequisites

### Hardware
- **4 physical devices** (iOS or Android)
  - Can be any combination: all iOS, all Android, or mixed
  - Devices should be on the same WiFi network as the development server
  - Each device should have camera and microphone permissions for video chat testing

### Software Setup
- **Running Ludi server** on your development machine
  - Server must be accessible from all devices on the local network
  - Note your machine's local IP address (e.g., `192.168.1.100`)
- **Expo development build** installed on each device
  - Build with: `cd apps/mobile && eas build --profile development --platform [ios|android]`
  - Or use `npx expo run:ios` / `npx expo run:android` for locally built dev clients
- **LiveKit server** running (for video chat)
  - Set `EXPO_PUBLIC_LIVEKIT_URL` in `.env`
  - Ensure LiveKit is accessible from devices

### Environment Configuration
Update `apps/mobile/.env`:
```
EXPO_PUBLIC_SERVER_URL=http://192.168.1.100:3001
EXPO_PUBLIC_LIVEKIT_URL=wss://your-livekit-server.com
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Test Procedure

### Phase 1: App Launch & Onboarding

**Device 1 (Host):**
1. Launch Ludi app on Device 1
2. Observe splash screen with gold Ludi branding
3. First-time users should see onboarding tooltip overlay on board
   - ✅ Tooltip explains game rules clearly
   - ✅ "Got it! Let's Play" dismisses overlay
   - ✅ Overlay does not appear on subsequent launches

### Phase 2: Room Creation & Joining

**Device 1 (Host):**
1. Tap "Online Multiplayer"
2. Enter display name (e.g., "Player 1")
3. Tap "Create Room"
4. ✅ Room code appears (6 characters, e.g., "ABC123")
5. ✅ Lobby screen shows Player 1 as host (crown icon)
6. Tap "📤 Share" button
7. ✅ Share sheet opens with room code message

**Device 2:**
1. Launch Ludi app on Device 2
2. Tap "Online Multiplayer"
3. Enter display name (e.g., "Player 2")
4. Enter room code from Device 1
5. Tap "Join Room"
6. ✅ Joins lobby successfully
7. ✅ Both players visible in lobby on all devices

**Device 3:**
1. Repeat joining process with "Player 3"
2. ✅ Three players now visible in lobby

**Device 4:**
1. Repeat joining process with "Player 4"
2. ✅ Four players now visible in lobby
3. ✅ Empty slot message disappears

**Test Error Cases:**
- Try joining with invalid code → ✅ Error toast appears
- Try creating room without name → ✅ Error toast appears
- Try joining full room (5th player) → ✅ Error toast appears

### Phase 3: Game Start & Video

**Device 1 (Host):**
1. Tap "Start Game"
2. ✅ All devices transition to game screen
3. ✅ Video grid appears showing all 4 players (or avatars if camera off)
4. ✅ Speaking indicator highlights active talker

**All Devices:**
1. Test mic/camera toggles
2. ✅ Camera toggle shows/hides video feed
3. ✅ Mic toggle mutes/unmutes audio
4. ✅ Video grid collapses/expands

### Phase 4: Gameplay

**Turn 1 (Red player):**
1. Red player taps dice
2. ✅ Dice animates and shows random value (1-6)
3. ✅ If 6: token in yard highlights as legal move
4. ✅ If not 6: turn passes automatically after 3s
5. Tap highlighted token to move
6. ✅ Token animates along path
7. ✅ Haptic feedback on roll and move (device-specific)
8. ✅ Sound effects play (dice, hop)

**Continue play rotation:**
1. Each player in turn: Red → Green → Yellow → Blue
2. Test scenarios:
   - ✅ Bringing token out of yard (requires 6)
   - ✅ Capturing opponent token (sends to yard, plays capture sound)
   - ✅ Landing on safe cell (star marker)
   - ✅ Entering home column (exact count required)
   - ✅ Rolling consecutive sixes (max 2, then turn ends per house rules)
   - ✅ Turn deadline countdown visible (30s)
   - ✅ Auto-move on timeout

**Test MOVE_REJECTED error:**
1. Simulate network delay (put device in/out of airplane mode briefly)
2. Try to move token during state desync
3. ✅ Error toast appears with rejection reason
4. ✅ Optimistic move rolls back
5. ✅ Game state recovers

### Phase 5: Chat

**Any Device:**
1. Tap chat button (💬 bottom-right)
2. ✅ Chat panel slides up
3. ✅ "No messages yet" empty state visible
4. Type message and send
5. ✅ Message appears on all devices
6. ✅ Unread badge shows count when chat closed
7. ✅ Badge clears when chat opened

### Phase 6: Reconnection

**Device 2:**
1. Kill app or force disconnect WiFi
2. ✅ Other devices show "Offline" badge for Player 2
3. ✅ Turn timer pauses (60s grace period)
4. Reconnect WiFi and reopen app
5. ✅ Automatically rejoins game
6. ✅ Game state fully synced
7. ✅ "Offline" badge clears

**After 60s grace:**
1. If player still disconnected:
2. ✅ AI substitute plays random legal moves
3. ✅ Original player can still rejoin

### Phase 7: Game Completion

**Play to finish:**
1. One player gets all 4 tokens home
2. ✅ Win banner appears on all devices
3. ✅ Shows winner color and placement (if play-for-placements enabled)
4. ✅ Win sound and haptic play
5. ✅ "New Game" button returns to home

**Check Match History (if authenticated):**
1. Navigate to Profile → History
2. ✅ Match recorded with correct players
3. ✅ Winner marked with 🏆
4. ✅ Placements shown (#1, #2, etc.)
5. ✅ House rules listed
6. ✅ Duration calculated

## Pass/Fail Criteria

### Must Pass (Blocking Issues)
- [ ] All 4 devices can create/join/play a complete game
- [ ] Game rules enforced correctly (can't move without 6 to exit yard, captures work, etc.)
- [ ] No crashes or hangs during normal gameplay
- [ ] Toast errors appear for network/auth/move failures
- [ ] Video/audio works for all participants

### Should Pass (Polish Issues)
- [ ] Animations smooth on all devices (60fps target)
- [ ] Onboarding appears on first run only
- [ ] Empty states visible where appropriate
- [ ] Share functionality works from lobby
- [ ] Reconnection recovers game state

### Known Limitations (Non-Blocking)
- Video quality may degrade on slow networks (expected LiveKit behavior)
- Haptics unavailable on devices without vibration motors
- First load may be slow while assets download

## Troubleshooting

**"Connection failed" error:**
- Verify server is running: `pnpm dev:server` in repo root
- Check firewall allows port 3001
- Confirm devices can ping server IP

**Video not connecting:**
- Verify LIVEKIT_URL and LIVEKIT_API_KEY/SECRET in server `.env`
- Check LiveKit server is accessible from devices
- Confirm camera/mic permissions granted in device settings

**TypeScript/build errors:**
- Run `pnpm lint` in `apps/mobile` to verify
- Ensure all dependencies installed: `pnpm install` in repo root

## Notes for QA

**DO NOT fabricate test results.** If you do not have 4 physical devices to test with, state that clearly. This runbook is for actual device testing, not simulator/emulator testing.

For simulator-only validation, note the limitations:
- Simulators cannot test real network conditions
- Video chat may not work properly
- Haptics unavailable
- Performance does not reflect real devices

The runbook above is the gold standard for pre-release QA validation on real hardware.
