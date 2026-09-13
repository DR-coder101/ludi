# Caribbean/Jamaican Ludo Rules

Official rules specification for Ludi. This document is the single source of truth for game mechanics.

## Overview

Caribbean/Jamaican Ludo is a variant of the classic Ludo/Parcheesi board game with regional rule variations. This implementation focuses on authentic Jamaican rules with configurable house rules.

## Board Layout

### Dimensions
- **Board Size**: 15×15 grid
- **Main Track**: 52 cells forming a cross-shaped circuit
- **Start Positions**: Cell 0 (Red), 13 (Green), 26 (Yellow), 39 (Blue)
- **Home Columns**: 5 cells leading to each player's "home" area

### Player Order
Players take turns clockwise in this order:
1. **Red** (starts at cell 0)
2. **Green** (starts at cell 13)
3. **Yellow** (starts at cell 26)
4. **Blue** (starts at cell 39)

### Special Cells

#### Safe Cells (Cannot be Captured)
- **Starting cells**: 0, 13, 26, 39 (each player's entry point)
- **Star cells**: 8, 21, 34, 47 (marked with stars on the board)

#### Home Column Entry Points
- Red: Cell 51 → Red home column (5 cells)
- Green: Cell 12 → Green home column (5 cells)
- Yellow: Cell 25 → Yellow home column (5 cells)
- Blue: Cell 38 → Blue home column (5 cells)

### Total Journey
Each token must travel **57 cells total**:
- 52 cells on main track (from start position to home entry)
- 5 cells in home column
- Exact count required to enter final "home" position

## Game Components

### Tokens
- Each player controls **4 tokens** of their color
- Tokens start in the **yard** (off-board staging area)
- Tokens must **come out** onto the starting cell before moving

### Dice
- Single **6-sided die** per roll
- Only the current player rolls
- Rolls are server-authoritative (client cannot manipulate)

## Core Rules

### Starting the Game

1. **Coming Out**: A token can only leave the yard and enter the starting cell by rolling a **6**
2. **First Roll**: Players take turns rolling until someone rolls a 6 to bring out their first token
3. **Multiple Tokens**: Players can have multiple tokens on the board simultaneously

### Turn Structure

1. **Roll**: Current player rolls the die (or server auto-rolls after 30s timeout)
2. **Select Token**: Player selects which token to move (if multiple legal moves exist)
3. **Move**: Server validates and applies the move
4. **Extra Roll**: If the player rolled a 6, they get another roll immediately
5. **Pass Turn**: If no legal moves or no extra roll earned, turn passes to next player

### Movement Rules

1. **Forward Only**: Tokens move clockwise around the track
2. **Exact Moves**: Must move the exact number rolled (cannot move fewer steps)
3. **Track Completion**: After completing the 52-cell track, tokens enter their home column
4. **Exact Finish**: Must roll the exact number to reach the final home position (no overshooting)
5. **Blocked Moves**: If a move would land on an illegal cell, that token cannot be moved

### Captures

1. **Landing on Opponent**: If your token lands on an opponent's token (not on a safe cell), the opponent's token is captured
2. **Capture Effect**: Captured token returns to its yard and must come out again with a 6
3. **Safe Cells**: Tokens on starting cells (0, 13, 26, 39) or star cells (8, 21, 34, 47) cannot be captured
4. **Own Tokens**: Landing on your own token is allowed (creates a blockade)

### Blockades

1. **Formation**: When **2 tokens of the same color** occupy the same cell, they form a **blockade**
2. **Impassable**: Opponent tokens **cannot pass through** a blockade (move is illegal if it would pass through)
3. **Breaking**: A blockade can only be broken when one of the two tokens moves away
4. **Home Column**: Blockades do not exist in home columns (only on the main track)

### Extra Rolls

1. **Rolling a 6**: Always grants an extra roll
2. **Consecutive Sixes**: Limited by house rules (default: 2 consecutive sixes allowed, 3rd consecutive 6 forfeits turn)
3. **Captures**: May grant extra roll depending on house rules (default: no extra roll on capture)
4. **Entering Home**: No extra roll for reaching final home position (game ends or turn passes)

### Winning

1. **Primary Win Condition**: First player to get all 4 tokens into their home area wins
2. **Placements**: Other players continue to determine 2nd, 3rd, 4th place (house rule toggle)
3. **Exact Count**: Tokens must enter home with exact die roll (e.g., if 2 cells away, must roll a 2)

## House Rules (Configurable Toggles)

### 1. Max Consecutive Sixes
- **Options**: 2 (default), 3, unlimited
- **Effect**: After rolling N consecutive sixes, the Nth six is forfeited and turn passes
- **Example**: With max=2, rolling 6-6-6 causes the 3rd roll to be ignored and turn ends

### 2. Extra Roll on Capture
- **Default**: `false` (no extra roll)
- **Options**: `true` (capturing grants an extra roll like rolling a 6)
- **Effect**: Adds strategic incentive to hunt opponent tokens

### 3. Blockade Movement
- **Default**: `false` (blockade must break apart to move)
- **Options**: `true` (blockade can move together as a unit)
- **Effect**: If true, both tokens in a blockade move together when either is selected

### 4. Exact Finish Bonus
- **Default**: `false` (no bonus)
- **Options**: `true` (exact finish grants extra roll)
- **Effect**: Landing exactly on home grants another roll, potentially speeding up endgame

### 5. Play for Placements
- **Default**: `false` (game ends when first player finishes)
- **Options**: `true` (all players continue until placements determined)
- **Effect**: Determines if only 1st place matters or if 2nd/3rd/4th are tracked

## Edge Cases for Testing

The rules engine must handle these scenarios correctly:

1. **No Legal Moves**: Player has tokens on board but all moves are blocked → Turn passes automatically
2. **All Tokens in Yard, No 6**: Player cannot come out → Turn passes automatically
3. **Home Column with No Exact Roll**: Token 2 cells from home, rolls a 6 → Cannot move, turn passes (or moves another token)
4. **Blockade Bypassing**: Opponent has blockade on cell 10, your token on cell 7 rolls a 4 → Move is illegal
5. **Capture on Last Cell Before Home**: Opponent token on cell 51 (Red's home entry), Red rolls to land on 51 → Capture happens, Red enters home column
6. **Triple Six with Max=2**: Rolls 6, 6, 6 → First two rolls valid, third forfeits turn
7. **Fourth Token Finishing Exactly**: Player rolls exact number for 4th token → Player wins immediately
8. **Safe Cell Stacking**: Multiple opponent tokens on same safe cell → All are safe, all can coexist
9. **Blockade on Safe Cell**: Two tokens of same color on star cell → Still forms blockade, still safe from capture
10. **Home Column Collision**: Two tokens of same color in home column → Both allowed, no blockade rules apply
11. **Capture During Extra Roll Sequence**: Roll 6, move and capture, roll again → Extra roll from 6 continues (capture doesn't reset sequence)
12. **Simultaneous Win**: Player finishes 4th token exactly when time limit expires → Player wins (server timestamp breaks tie)

## Turn Timeouts

- **Roll Phase**: 30 seconds to roll (or server auto-rolls)
- **Move Phase**: 30 seconds to select token (or server auto-selects first legal move)
- **Disconnection**: 60 seconds grace period before forfeit

## Implementation Notes for Developers

### Game State Structure

```typescript
interface GameState {
  phase: 'LOBBY' | 'READY_CHECK' | 'IN_PROGRESS' | 'FINISHED';
  players: Player[]; // Red, Green, Yellow, Blue
  currentPlayerIndex: number;
  turnPhase: 'awaiting_roll' | 'rolled' | 'awaiting_move';
  lastRoll: number | null;
  consecutiveSixes: number;
  board: BoardState; // Token positions
  houseRules: HouseRules;
  winner: PlayerId | null;
  placements: PlayerId[]; // Ordered 1st, 2nd, 3rd, 4th
}
```

### Pure Function Design

All rules logic must be **pure functions**:
- No side effects (no network calls, no DB writes, no logging in logic)
- Immutable (return new state, don't mutate input)
- Deterministic (same input + RNG = same output)
- Testable (inject RNG for reproducible tests)

Example:
```typescript
// ❌ BAD: Mutates state, uses Math.random
function rollDice(state: GameState): GameState {
  state.lastRoll = Math.floor(Math.random() * 6) + 1;
  return state;
}

// ✅ GOOD: Pure, injected RNG, returns new state
function rollDice(state: GameState, rng: () => number): GameState {
  return {
    ...state,
    lastRoll: Math.floor(rng() * 6) + 1,
  };
}
```

### Server Authority

```typescript
// Client sends intent only
socket.emit('game:move', { tokenIndex: 2 });

// Server validates via @ludi/rules
const legalMoves = getLegalMoves(gameState);
if (!legalMoves.some(m => m.tokenIndex === 2)) {
  socket.emit('error', { code: 'ILLEGAL_MOVE', message: 'That token cannot move' });
  return;
}

// Server applies move and broadcasts result
const newState = applyMove(gameState, { tokenIndex: 2 });
io.to(roomId).emit('game:state', newState);
```

## Visual Design Notes

### Board Colors
- **Red**: #E53E3E (Chakra red.500)
- **Green**: #38A169 (Chakra green.500)
- **Yellow**: #D69E2E (Chakra yellow.600)
- **Blue**: #3182CE (Chakra blue.500)

### Cell Types
- **Normal**: White/light gray
- **Start**: Player's color, thick border
- **Star**: Gold star icon, safe cell indicator
- **Home Column**: Player's color gradient
- **Home (final)**: Player's color, checkered flag icon

### Tokens
- Circular pieces with player color
- Drop shadow for depth
- Smooth animations (Reanimated)
- Scale up on hover/selection

## References

- [Ludo Wikipedia](https://en.wikipedia.org/wiki/Ludo_(board_game))
- Caribbean/Jamaican variations collected from community gameplay
- This document supersedes conflicting interpretations

## Changelog

- **v0.1.0** (Phase 0): Initial rules specification
