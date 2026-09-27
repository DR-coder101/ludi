# Two-Dice UI Implementation - Gap Analysis

## Status: UI Ready, Engine Not Yet Updated

This document explains the two-dice implementation status for the Ludi game.

## Current State (As of PR #28)

### ✅ UI Implementation - COMPLETE
The mobile app now displays **TWO dice** with the dancehall premium aesthetic:

**Component**: `apps/mobile/src/components/DicePair.tsx`
- Displays two side-by-side dice
- Staggered roll animation (50ms delay between dice)
- Shows TOTAL value below the dice
- Fully styled with gold borders and shadows
- Haptic feedback on roll

**Screens Updated**:
- `apps/mobile/app/game.tsx` (local pass & play)
- `apps/mobile/app/game/[code].tsx` (online multiplayer)

### ❌ Engine Implementation - NOT YET DONE

The game engine (`packages/rules`) and server still use **ONE die**:

**Current Engine State**:
```typescript
// packages/rules/src/types.ts
interface GameState {
  dice: number | null;  // Single die: 1-6
  // ...
}

// packages/rules/src/rollDice.ts
export function rollDice(state: GameState, rng: RngFunction): RollDiceResult {
  const value = Math.floor(rng() * 6) + 1;  // Single die roll
  // ...
}
```

**What the UI Currently Does**:
- Displays the SAME value on BOTH dice (e.g., if engine rolls 4, both dice show 4)
- TOTAL shows the engine value (4, not 8)
- This is a **temporary workaround** until the engine is updated

## The Gap

### What Needs to Change in the Engine (Separate PR)

1. **Type Definitions** (`packages/rules/src/types.ts`):
   ```typescript
   interface GameState {
     dice: [number, number] | null;  // Two dice: [1-6, 1-6]
     // ...
   }
   ```

2. **Roll Function** (`packages/rules/src/rollDice.ts`):
   ```typescript
   export function rollDice(state: GameState, rng: RngFunction): RollDiceResult {
     const die1 = Math.floor(rng() * 6) + 1;
     const die2 = Math.floor(rng() * 6) + 1;
     const value = [die1, die2];
     // ...
   }
   ```

3. **Legal Moves** (`packages/rules/src/legalMoves.ts`):
   - Update to use `state.dice[0] + state.dice[1]` for move distance
   - Handle special rules if doubles are rolled (if applicable)

4. **Move Application** (`packages/rules/src/applyMove.ts`):
   - Update to use sum of both dice
   - Handle any special two-dice rules

5. **Game Rules** (`docs/GAME_RULES.md`):
   - Update §2 from "roll one die" to "roll two dice"
   - Document behavior when sum is used vs individual dice
   - Document any doubles rules (if applicable)

6. **Protocol** (`packages/protocol/src/index.ts`):
   ```typescript
   interface DiceRolledPayload {
     playerId: PlayerId;
     value: [number, number];  // Two dice values
     legalMoves: LegalMove[];
   }
   ```

7. **Server** (`server/src/handlers/game.ts`):
   - Update socket event payloads to send both dice values
   - Broadcast both dice to all players

8. **Tests** (`packages/rules/src/index.test.ts`):
   - Update all tests to use two-dice format
   - Add tests for doubles, special sums, etc.

### What the UI Will Do After Engine Update

Once the engine is updated, the UI component only needs **minor changes**:

**Component Update** (`apps/mobile/src/components/DicePair.tsx`):
```typescript
interface DicePairProps {
  value: [number, number] | null;  // Update type
  onRoll: () => void;
  disabled?: boolean;
}

export const DicePair: React.FC<DicePairProps> = ({ value, onRoll, disabled }) => {
  const [die1, die2] = value ?? [null, null];
  const total = value !== null ? die1 + die2 : null;

  return (
    <TouchableOpacity /* ... */>
      <View style={styles.diceContainer}>
        <AnimatedDie value={die1} delay={0} />
        <AnimatedDie value={die2} delay={50} />
      </View>
      {total !== null && (
        <View style={styles.totalContainer}>
          <Text style={styles.totalValue}>{total}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};
```

**That's it!** The animations, styling, haptics, and layout are already done.

## Why This Approach?

### Benefits of Splitting UI and Engine Changes

1. **UI Ready Now**: The dancehall premium UI can be reviewed and merged without waiting for engine changes
2. **Clear Separation**: UI changes are purely visual, engine changes affect game logic
3. **Easier Review**: Two focused PRs are easier to review than one massive PR
4. **Testable**: The UI can be visually verified with the single-die engine
5. **Safer**: Engine changes require extensive testing (91 tests need updates)

### Testing the Two-Dice UI Today

Even though both dice show the same value, you can verify:
- ✅ Two dice render side-by-side
- ✅ Staggered roll animation works
- ✅ TOTAL displays correctly
- ✅ Gold borders and shadows match theme
- ✅ Haptic feedback triggers
- ✅ "TAP TO ROLL" text appears when dice are null
- ✅ Disabled state works

## Next Steps

### For This PR (#28)
- ✅ Two-dice UI is complete and functional
- ✅ Shows same value on both dice (engine limitation)
- ✅ Ready for when engine is updated

### For Future Engine PR
1. Update `packages/rules` types and logic
2. Update `packages/protocol` socket types
3. Update server handlers
4. Update all 91+ tests
5. Update `docs/GAME_RULES.md`
6. Update `DicePair` component (minor change)
7. Test thoroughly with two-dice gameplay

## Visual Comparison

### Before (Single Die)
```
┌─────┐
│  ?  │  <- One die, tap to roll
└─────┘
Tap to Roll
```

### After This PR (Two Dice, Same Value)
```
┌─────┐  ┌─────┐
│  4  │  │  4  │  <- Both show engine value
└─────┘  └─────┘
┌─────────┐
│ TOTAL 4 │      <- Shows engine value
└─────────┘
```

### After Engine Update (Two Dice, Different Values)
```
┌─────┐  ┌─────┐
│  3  │  │  5  │  <- Each shows different value
└─────┘  └─────┘
┌─────────┐
│ TOTAL 8 │      <- Sum of both dice
└─────────┘
```

## Code Markers

The `DicePair` component has clear comments marking the temporary workaround:

```typescript
/**
 * IMPORTANT: The game engine (packages/rules) currently uses ONE die.
 * This component is built to display TWO dice and is ready for when
 * the engine is updated to support two-dice gameplay.
 * 
 * Current state: Displays the single die value on BOTH dice
 * Future state: Will display two separate dice values when engine supports it
 */
```

## Questions?

- **Why not just keep one die?** Dean requested two dice for the dancehall aesthetic
- **Why not update the engine in this PR?** This is a UI-focused PR; engine changes require separate testing and review
- **Will the UI break?** No, it gracefully handles the single-die engine today
- **How much work to update the UI later?** ~10 lines of code in one component
- **How much work to update the engine?** Significant: types, logic, protocol, server, 91+ tests, docs

## Summary

✅ **UI is ready** - Two dice display with animations, styling, and haptics  
⏳ **Engine pending** - Will be updated in a separate PR  
🎨 **No blockers** - This PR can be merged and the UI works today  
📋 **Clear path** - This document outlines exactly what needs to change  
