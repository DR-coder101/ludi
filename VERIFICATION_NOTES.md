# Two-Dice UX Verification Notes

## PR: #39 - Two-Dice UX Fixes
Branch: `cursor/two-dice-ux-fixes-49da`

## Changes Summary

### 1. Gold Ring Visibility Fix
**File**: `apps/mobile/src/components/game/TurnCard.tsx`

**Problem**: When a die was marked as `used`, the opacity was applied to the entire Pressable container, including the gold border that indicates the selected die. This made the gold ring also dim to 35% opacity.

**Solution**: Wrapped the `DiceFace` component in a `View` that receives the opacity styling, keeping the Pressable's border at full opacity.

```tsx
// Before
<Pressable style={[..., die.used && styles.dieUsed]}>
  <DiceFace ... />
</Pressable>

// After
<Pressable style={[..., isActive && styles.dieActive]}>
  <View style={die.used && styles.dieUsed}>
    <DiceFace ... />
  </View>
</Pressable>
```

### 2. Improved Visual Distinction
Lowered used-die opacity from `0.35` to `0.3` for clearer visual feedback that a die has been spent.

### 3. Test Coverage
Added 3 new test scenarios in `apps/mobile/src/components/game/diceModel.test.ts`:

1. **Die switching workflow**: Verifies `activeDie()` correctly updates when player picks different dice
2. **Selection persistence**: Ensures pick state remains valid after first die is spent
3. **Single-die fallback**: Confirms selection is irrelevant when only one die is playable

## Verification Checklist

### Unit Tests ✅
```bash
cd apps/mobile && pnpm test -- diceModel.test.ts --run
```
- All 8 tests pass (5 existing + 3 new)
- Full suite: 71 tests pass (68 existing + 3 new)

### Type Checking ✅
```bash
cd apps/mobile && pnpm exec tsc --noEmit
```
- Clean (1 pre-existing error in lobby/[code].tsx unrelated to changes)

### Manual Testing (Device/Emulator Required)

#### Test Case 1: Initial Gold Ring
1. Start game, roll dice with different values (e.g., 6 and 3)
2. **Expected**: Die 0 (first die) has gold ring by default

#### Test Case 2: Die Switch
1. Continue from Test Case 1
2. Tap die 1 (second die)
3. **Expected**: Gold ring moves from die 0 to die 1
4. Tap die 0 again
5. **Expected**: Gold ring moves back to die 0

#### Test Case 3: Used Die Dim
1. With die 1 selected (gold ring), tap a piece to move
2. **Expected**: 
   - Piece hops with die 1's value
   - Die 1 dims to 30% opacity
   - Gold ring automatically switches to die 0

#### Test Case 4: Gold Ring + Dim Together
1. After first move (die 1 used, die 0 has gold ring)
2. **Expected**:
   - Die 1 is visibly dimmed and not tappable
   - Gold ring on die 0 is bright and clear (100% opacity, not affected by any dim)
   - Die 0 is tappable

#### Test Case 5: Second Move
1. Continue from Test Case 4
2. Tap a piece to play die 0
3. **Expected**:
   - Piece hops with die 0's value
   - Die 0 also dims to 30%
   - Turn ends (or auto-passes to next turn if applicable)

## Implementation Details

### State Flow
1. `BoardScreen` maintains `pick` state: `{ rollKey: number, die: DieIndex }`
2. `picked = pick?.rollKey === rollKey ? pick.die : null` ensures selection resets on new roll
3. `activeDie(moves, picked)` determines which die is active:
   - Returns `picked` if it still has moves
   - Falls back to first playable die
   - Returns `null` if no moves available
4. `TurnCard` receives `activeDie` prop and applies gold ring to matching index
5. `gameStore.applyOptimisticMove()` marks `die.used = true` when move is made
6. `TurnCard` applies `styles.dieUsed` (opacity 0.3) to used dice

### Key Files Modified
- `apps/mobile/src/components/game/TurnCard.tsx` (visual fix)
- `apps/mobile/src/components/game/diceModel.test.ts` (test coverage)

### Key Files Referenced (No Changes)
- `apps/mobile/src/components/game/BoardScreen.tsx` (pick state management)
- `apps/mobile/src/components/game/diceModel.ts` (die selection logic)
- `apps/mobile/src/stores/gameStore.ts` (optimistic update)

## Architecture Notes

### Why the Fix Works
The CSS styling hierarchy means child opacity is cumulative with parent opacity. By moving `styles.dieUsed` from the Pressable to an inner View:
- The Pressable's border (gold ring) maintains 100% opacity
- Only the die face content receives the 30% opacity
- Visual hierarchy is preserved: selection indicator stays prominent even when die is used

### Edge Cases Covered
1. **Used die can't be selected**: `pickable = !idle && !die.used && !!onPickDie` ensures used dice are disabled
2. **Pick persists across roll**: `rollKey` comparison ensures pick resets on new roll
3. **Stale pick handling**: `activeDie()` falls back when picked die has no moves
4. **Single die playable**: Logic correctly ignores pick when only one die is valid

## Future Improvements (Out of Scope)
- Could add subtle shake animation when tapping a disabled (used) die
- Could add brief highlight animation on die switch
- Could experiment with additional visual cues (grayscale filter, checkmark on used die)
- Device testing will reveal if 30% opacity is sufficient across lighting conditions

## Related PRs
- #37: Two-dice gameplay implementation (protocol, engine, mobile)
- #38: HopPiece animation fix
