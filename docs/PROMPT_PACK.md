# Ludi Prompt Pack

Ordered development milestones and prompts for building Ludi. Each prompt represents a discrete, testable task. Complete one phase before moving to the next.

## Philosophy

- **One prompt = One task**: Each prompt should take 30 minutes to 2 hours
- **Test after each**: Every phase must pass tests before moving forward
- **Incremental complexity**: Build foundation before adding features
- **Monorepo awareness**: Changes may touch multiple packages

## Phase 0: Scaffold ✅

**Status**: Complete

### 0.1: Monorepo Setup ✅
**Prompt**: Scaffold Phase 0.1 for Dean's Caribbean/Jamaican Ludo mobile game. Create pnpm workspace monorepo with apps/mobile (Expo SDK 52+), server (Node + Express + Socket.IO), packages/rules (pure TS + vitest), packages/protocol (shared types). Hello-world Socket.IO: client connects, server replies pong. Include docs/ARCHITECTURE.md, docs/GAME_RULES.md, docs/PROMPT_PACK.md. TypeScript strict mode.

**Done when**:
- `pnpm install` succeeds
- `pnpm test:rules` passes
- Server connects to client and sends pong
- All docs present

---

## Phase 1: Rules Engine

**Goal**: Build pure TypeScript game logic in `packages/rules`. Dependency-free, fully tested, shared by client and server.

### 1.1: Core Types and Game Initialization
**Prompt**: Implement core types in @ludi/rules: GameState, Player, Token, BoardState, HouseRules. Create `createGame(config)` function that initializes a new 4-player game. All players start with 4 tokens in yard. Board has 52-cell track + 4 home columns. Add tests for initialization.

**Acceptance Criteria**:
- `createGame({ players: ['red', 'green', 'yellow', 'blue'] })` returns valid GameState
- All tokens start in yard (position: -1)
- Board positions 0-51 on main track, 52-56 home columns per player
- House rules have sensible defaults
- 10+ tests covering initialization edge cases

**Files**:
- `packages/rules/src/types.ts`
- `packages/rules/src/engine.ts`
- `packages/rules/src/engine.test.ts`

### 1.2: Dice Rolling and Turn Management
**Prompt**: Implement dice rolling in @ludi/rules. Add `rollDice(state, rng)` that accepts injected RNG, updates lastRoll, handles consecutive sixes tracking, and manages turn phase transitions (awaiting_roll → rolled). Add `passTurn(state)` to advance currentPlayerIndex. Test with deterministic RNG.

**Acceptance Criteria**:
- `rollDice(state, () => 0.5)` produces roll of 3 (deterministic)
- Rolling a 6 increments consecutiveSixes
- Rolling non-6 resets consecutiveSixes
- Max consecutive sixes enforced (default 2, configurable)
- Turn phase transitions correctly
- 15+ tests including edge cases (triple six forfeit)

**Files**:
- `packages/rules/src/dice.ts`
- `packages/rules/src/dice.test.ts`
- Update `packages/rules/src/index.ts` exports

### 1.3: Token Movement and Validation
**Prompt**: Implement token movement in @ludi/rules. Add `legalMoves(state): Move[]` to calculate all valid moves for current player. Add `applyMove(state, move): GameState` to execute a move. Handle: coming out on 6, forward movement, track wrapping, home column entry, exact finish. No captures or blockades yet.

**Acceptance Criteria**:
- `legalMoves()` returns empty array if no valid moves
- Coming out requires roll of 6 and empty start cell
- Tokens advance correct number of cells
- Home column entry at correct cell (Red: 51→52, etc.)
- Exact count required for finishing (no overshoot)
- 20+ tests covering movement scenarios

**Files**:
- `packages/rules/src/movement.ts`
- `packages/rules/src/movement.test.ts`
- `packages/rules/src/validation.ts`
- `packages/rules/src/validation.test.ts`

### 1.4: Captures, Blockades, and Win Conditions
**Prompt**: Complete @ludi/rules with captures and blockades. Implement: capturing opponent tokens (return to yard), safe cells (start + star cells), blockade formation (2 same-color tokens), blockade impassability. Add `isGameOver(state)` and `getWinner(state)`. Handle all 12 edge cases from GAME_RULES.md.

**Acceptance Criteria**:
- Capturing returns opponent token to yard
- Safe cells (0,13,26,39,8,21,34,47) prevent captures
- Blockades block opponent movement through cell
- All 12 edge cases from GAME_RULES.md pass
- `isGameOver()` returns true when player has 4 tokens home
- 30+ tests covering all capture/blockade scenarios

**Files**:
- `packages/rules/src/captures.ts`
- `packages/rules/src/captures.test.ts`
- `packages/rules/src/blockades.ts`
- `packages/rules/src/blockades.test.ts`
- `packages/rules/src/game-over.ts`
- `packages/rules/src/game-over.test.ts`

---

## Phase 2: Local Gameplay

**Goal**: Build board UI and local game loop (single device, no multiplayer yet).

### 2.1: Board SVG Rendering
**Prompt**: Create board UI in apps/mobile using react-native-svg. Render 15x15 grid with 52-cell track, 4 start positions, star cells, and home columns. Use colors from GAME_RULES.md. Board should be responsive and fill screen. No tokens yet, just static board.

**Acceptance Criteria**:
- Board renders on iOS and Android
- All 52 track cells visible and correctly positioned
- Start cells (0,13,26,39) highlighted in player colors
- Star cells (8,21,34,47) marked with star icons
- Home columns clearly distinguished
- Responsive layout (works on different screen sizes)

**Files**:
- `apps/mobile/components/Board.tsx`
- `apps/mobile/components/Cell.tsx`

### 2.2: Token Rendering and Animation
**Prompt**: Add token rendering to board. Display 4 tokens per player in yard or on board based on GameState. Use Reanimated 3 for smooth movement animations (300ms ease-out). Add token selection (scale up, glow effect). Tokens should stack if multiple on same cell (offset slightly).

**Acceptance Criteria**:
- All 16 tokens (4 players × 4 tokens) render correctly
- Tokens in yard appear in designated area
- Tokens on board positioned correctly on cells
- Movement animates smoothly (no jank)
- Selection state visually clear
- Multiple tokens on same cell stack neatly

**Files**:
- `apps/mobile/components/Token.tsx`
- `apps/mobile/hooks/useTokenAnimation.ts`

### 2.3: Dice UI and Roll Animation
**Prompt**: Create dice component with roll animation. Show current roll value, animate rolling (1-6 cycling, 500ms). Add roll button that triggers animation then reveals result. Disable button when not current player's turn or during awaiting_move phase.

**Acceptance Criteria**:
- Dice shows current roll value
- Roll button triggers animation
- Animation cycles through 1-6 before settling
- Button disabled during opponent turns
- Button disabled during awaiting_move phase
- Accessible (screen reader support)

**Files**:
- `apps/mobile/components/Dice.tsx`
- `apps/mobile/components/RollButton.tsx`

### 2.4: Local Game Loop Integration
**Prompt**: Wire up local game in apps/mobile. Use Zustand + Immer for state management. Integrate @ludi/rules for game logic. Implement full turn cycle: roll → select token → move → next turn. Add turn indicator, legal move highlighting, current player banner. Game runs entirely client-side (no server yet).

**Acceptance Criteria**:
- Complete game playable with 4 human players on one device
- Turn indicator shows current player
- Legal moves highlighted when dice rolled
- Selecting valid token moves it and passes turn
- Illegal moves rejected with visual feedback
- Game detects winner and shows victory screen
- Can start new game after finishing

**Files**:
- `apps/mobile/store/gameStore.ts`
- `apps/mobile/screens/GameScreen.tsx`
- `apps/mobile/hooks/useGameLogic.ts`

---

## Phase 3: Online Multiplayer

**Goal**: Implement server-authoritative multiplayer with Socket.IO.

### 3.1: Server Game Manager
**Prompt**: Build game manager on server. Implement room creation, joining (by invite code), player ready checks. Store active games in memory (Map<roomId, GameState>). Add Socket.IO event handlers for room:create, room:join, room:ready. Validate player actions server-side using @ludi/rules.

**Acceptance Criteria**:
- `room:create` generates unique 6-character invite code
- `room:join` adds player to room (max 4)
- `room:ready` tracks player ready state
- Game starts when all 4 players ready
- Server validates all moves via @ludi/rules
- Full state broadcast on every change

**Files**:
- `server/src/game-manager.ts`
- `server/src/room-manager.ts`
- `server/src/handlers/room-handlers.ts`
- `server/src/handlers/game-handlers.ts`

### 3.2: Client Socket.IO Integration
**Prompt**: Replace local game logic with Socket.IO client in apps/mobile. Connect to server, emit game actions, listen for state updates. Implement optimistic updates (predict locally, rollback if server rejects). Show connection status. Handle disconnects gracefully.

**Acceptance Criteria**:
- Client connects to server on app launch
- Connection status indicator (green=connected, red=disconnected)
- User can create or join room via UI
- Optimistic UI updates for smooth UX
- Server rejections rollback client state
- Reconnection within 60s resumes game

**Files**:
- `apps/mobile/services/socket.ts`
- `apps/mobile/hooks/useSocket.ts`
- `apps/mobile/store/connectionStore.ts`
- Update `apps/mobile/store/gameStore.ts` for server sync

### 3.3: Room and Lobby UI
**Prompt**: Create lobby screens for room creation and joining. Room creation shows invite code (shareable). Room lobby shows 4 player slots, ready checkboxes, house rules configuration. Host can kick players and configure rules. Start button enabled when all ready.

**Acceptance Criteria**:
- Create room flow: tap button → see invite code → share code
- Join room flow: enter code → join lobby
- Lobby shows all players with avatars/names
- Ready checkboxes for each player
- Host can configure house rules (toggle switches)
- Start button only enabled when all 4 players ready

**Files**:
- `apps/mobile/screens/LobbyScreen.tsx`
- `apps/mobile/screens/CreateRoomScreen.tsx`
- `apps/mobile/screens/JoinRoomScreen.tsx`
- `apps/mobile/components/RoomLobby.tsx`
- `apps/mobile/components/HouseRules.tsx`

### 3.4: Chat and Player Status
**Prompt**: Add chat system (text messages during game). Show player connection status (green dot = online, gray = disconnected). Add "player disconnected" overlay with 60s countdown. Persist messages during session.

**Acceptance Criteria**:
- Chat input at bottom of game screen
- Messages show sender name and timestamp
- Chat scrolls automatically to newest message
- Connection status dots for each player
- Disconnection overlay shows countdown (60s → forfeit)
- Chat messages persist during disconnection

**Files**:
- `apps/mobile/components/Chat.tsx`
- `apps/mobile/components/PlayerStatus.tsx`
- `apps/mobile/store/chatStore.ts`
- Update `server/src/handlers/chat-handlers.ts`

---

## Phase 4: Video Chat (LiveKit)

**Goal**: Integrate LiveKit for real-time video and audio.

### 4.1: LiveKit Server Token Generation
**Prompt**: Add LiveKit token generation to server. When game enters READY_CHECK, generate LiveKit room and tokens for all 4 players. Return tokens to clients. Room name = game roomId. Tokens valid for 2 hours.

**Acceptance Criteria**:
- Server generates LiveKit room after ready check
- Each player receives unique LiveKit token
- Token payload includes player identity (name, color)
- Tokens expire after 2 hours
- Environment variables for LIVEKIT_API_KEY and LIVEKIT_API_SECRET

**Files**:
- `server/src/livekit/token-generator.ts`
- Update `server/src/handlers/game-handlers.ts`
- Update `.env.example`

### 4.2: LiveKit Mobile Integration
**Prompt**: Integrate @livekit/react-native in apps/mobile. Connect to LiveKit room after countdown. Show 4 video tiles (grid layout). Add mute/unmute and camera on/off buttons. Handle permissions (camera, microphone). Show video connection quality indicators.

**Acceptance Criteria**:
- Video chat starts after 3-2-1 countdown
- 4 video tiles in grid (or picture-in-picture)
- Audio works bidirectionally
- Mute button mutes local audio
- Camera button toggles local video
- Permissions requested on first use
- Graceful fallback if permissions denied
- Connection quality indicator (green/yellow/red)

**Files**:
- `apps/mobile/components/VideoChat.tsx`
- `apps/mobile/services/livekit.ts`
- `apps/mobile/hooks/useVideoChat.ts`
- Update `apps/mobile/app.json` for permissions

### 4.3: Video Layout and Picture-in-Picture
**Prompt**: Improve video layout. Add picture-in-picture mode (small floating video tiles over game board). Add "focus mode" (large video, small board). Let users drag/resize video tiles. Add "hide video" option.

**Acceptance Criteria**:
- Default: side-by-side (board + video)
- PiP mode: video tiles float over board (draggable)
- Focus mode: video large, board small (swappable)
- Hide video: collapse video section, audio continues
- Layout preference persisted
- Smooth transitions between layouts

**Files**:
- `apps/mobile/components/VideoLayout.tsx`
- `apps/mobile/components/PiPVideo.tsx`
- `apps/mobile/store/layoutStore.ts`

---

## Phase 5: User Accounts and Persistence

**Goal**: Add Supabase Auth and persist game data.

### 5.1: Supabase Auth Setup
**Prompt**: Integrate Supabase Auth in apps/mobile. Support guest accounts (auto-generated) and full accounts (email/password, Google, Apple). Add login/signup screens. Store user token in secure storage. Send token to server on Socket.IO connection.

**Acceptance Criteria**:
- Guest accounts created automatically on first launch
- Users can upgrade to full account (email/password)
- Social login (Google, Apple) works on native
- User token stored securely (Expo SecureStore)
- Token sent to server on Socket.IO auth
- Server validates token with Supabase

**Files**:
- `apps/mobile/services/auth.ts`
- `apps/mobile/screens/LoginScreen.tsx`
- `apps/mobile/screens/SignupScreen.tsx`
- `apps/mobile/store/authStore.ts`
- Update `server/src/middleware/auth.ts`

### 5.2: User Profiles
**Prompt**: Create user profile screen in apps/mobile. Display: username, avatar, join date, total games, wins, favorite color. Add edit profile (username, avatar upload). Store profiles in Supabase.

**Acceptance Criteria**:
- Profile screen shows user stats
- Edit profile updates Supabase users table
- Avatar upload to Supabase Storage
- Avatar displayed in game lobby and video chat
- Username validation (min 3 chars, alphanumeric)

**Files**:
- `apps/mobile/screens/ProfileScreen.tsx`
- `apps/mobile/components/AvatarPicker.tsx`
- Update `server/src/database/users.ts`

### 5.3: Database Persistence
**Prompt**: Persist completed games to Supabase. When game ends, server writes to matches and match_players tables. Include final state, placements, stats (turns, captures). Add match history screen in app (list past games, view details).

**Acceptance Criteria**:
- Completed games saved to Supabase matches table
- Match players saved with placements and stats
- Server handles database writes on game:over event
- Match history screen shows past 20 games
- Match detail view shows full game summary
- Pagination for match history (20 per page)

**Files**:
- `server/src/database/matches.ts`
- `apps/mobile/screens/MatchHistoryScreen.tsx`
- `apps/mobile/components/MatchCard.tsx`
- Database migrations in `server/migrations/`

### 5.4: Reconnection with Persistence
**Prompt**: Improve reconnection. When user disconnects, persist game state to Supabase (active_games table). On reconnect, check for active game and resume. Handle cases where user closed app mid-game.

**Acceptance Criteria**:
- Active games saved to Supabase on state changes
- Reconnection within 60s resumes from DB state
- App re-launch checks for active game and prompts resume
- If all players disconnect, game persists for 10 minutes
- After 10 minutes, game archived as abandoned

**Files**:
- Update `server/src/database/games.ts`
- Update `server/src/game-manager.ts` for persistence
- Update `apps/mobile/services/socket.ts` for resume

---

## Phase 6: Polish and Post-MVP

**Goal**: Final polish, optional features, and launch prep.

### 6.1: Animations and Sound Effects
**Prompt**: Add sound effects (dice roll, token move, capture, win). Add haptic feedback (iOS/Android). Improve animations (token hop on move, celebration on win). Add background music (toggleable).

**Acceptance Criteria**:
- Sound effects for all major actions
- Sounds can be muted in settings
- Haptic feedback on roll and move
- Token hop animation on move
- Confetti animation on win
- Background music (looping, toggleable)

**Files**:
- `apps/mobile/services/sound.ts`
- `apps/mobile/services/haptics.ts`
- `apps/mobile/assets/sounds/`
- Update `apps/mobile/components/Token.tsx` for animations

### 6.2: Onboarding Tutorial
**Prompt**: Create interactive tutorial for first-time users. Step-by-step guide covering: board layout, rolling dice, moving tokens, captures, winning. Use overlay hints and guided actions. Skippable.

**Acceptance Criteria**:
- Tutorial launches on first app open
- Step-by-step overlay guides user
- User can skip tutorial
- Tutorial replayable from settings
- Tutorial covers all core mechanics

**Files**:
- `apps/mobile/screens/TutorialScreen.tsx`
- `apps/mobile/components/TutorialOverlay.tsx`
- `apps/mobile/store/tutorialStore.ts`

### 6.3: Settings and Preferences
**Prompt**: Add settings screen. Options: sound on/off, music on/off, haptics on/off, video quality (auto/high/low), notification preferences, language (English only for MVP, but structure for i18n). Add about screen with credits and version.

**Acceptance Criteria**:
- Settings screen accessible from main menu
- All toggles persist (AsyncStorage)
- Video quality setting applied to LiveKit
- About screen shows version, credits, links (privacy, terms)

**Files**:
- `apps/mobile/screens/SettingsScreen.tsx`
- `apps/mobile/screens/AboutScreen.tsx`
- `apps/mobile/store/settingsStore.ts`

### 6.4: App Store Preparation
**Prompt**: Prepare for app store submission. Create app icons (all sizes), splash screens, screenshots (iOS + Android). Write app store descriptions. Configure EAS build profiles (production, preview). Add privacy policy and terms of service placeholders.

**Acceptance Criteria**:
- App icons generated for all required sizes
- Splash screens for iOS and Android
- 5 screenshots per platform (gameplay, lobby, video)
- App store description (short + long)
- EAS build profiles configured
- Privacy policy and terms pages (web links)

**Files**:
- `apps/mobile/assets/` (icons, splash)
- `apps/mobile/eas.json`
- `docs/PRIVACY.md`
- `docs/TERMS.md`
- `docs/APP_STORE.md` (submission checklist)

---

## Post-MVP Prompts (Future)

### Friends System
**Prompt**: Add friend system. Send/accept friend requests. View friends list. Invite friends directly to games (bypass invite codes).

### AI Opponents
**Prompt**: Implement AI player using Monte Carlo tree search. AI can fill empty slots in rooms. Difficulty levels: Easy, Medium, Hard.

### Tournaments
**Prompt**: Add tournament system. Create brackets, schedule matches, track standings. Public and private tournaments.

### Spectator Mode
**Prompt**: Allow users to spectate ongoing games. Read-only Socket.IO connection. Live video feed (optional).

### Match Replay
**Prompt**: Record match history with full move log. Add replay screen with scrubbing timeline. Share replays with friends.

### Monetization
**Prompt**: Add in-app purchases (cosmetic skins, premium rooms). Integrate Stripe or RevenueCat. No pay-to-win mechanics.

---

## Usage Instructions

### For Developers
1. Complete phases in order (0 → 1 → 2 → 3 → 4 → 5 → 6)
2. Each prompt is a discrete PR or commit
3. Test thoroughly before moving to next prompt
4. Update this file if requirements change

### For AI Assistants
1. User will provide a prompt from this file (or custom derivative)
2. Implement the feature described
3. Write tests to verify acceptance criteria
4. Do not skip ahead to future phases
5. Ask clarifying questions if prompt is ambiguous

## Testing Checklist

After each phase, verify:
- [ ] All tests pass (`pnpm test`)
- [ ] TypeScript compiles (`pnpm lint`)
- [ ] App runs on iOS simulator
- [ ] App runs on Android emulator
- [ ] Server starts without errors
- [ ] Socket.IO connection works
- [ ] No console errors or warnings

## Notes

- This is a living document — update as requirements evolve
- Actual prompts may be adapted based on progress
- Some prompts may be split or combined as needed
- Community feedback may influence future phases
