# @ludi/rules

Pure TypeScript game rules engine for Caribbean/Jamaican Ludo.

## Design Principles

- **Pure functions**: No side effects, dependency-free
- **Immutable state**: All operations return new state
- **Injected randomness**: RNG passed as parameter for testability
- **Shared validation**: Used by both client (prediction) and server (authority)

## Usage

```typescript
import { createGame, rollDice, legalMoves, applyMove } from '@ludi/rules';

let state = createGame({ playerColors: ['red', 'green'], houseRules: { ... } });
state = rollDice(state, rng).state;            // throws both dice; rng() is called once per die
const [move] = legalMoves(state);              // { tokenIndex, dieIndex, steps, resulting, captures? }
state = applyMove(state, move.tokenIndex, move.dieIndex).state;
// still "awaiting_move" while the other die is playable — see docs/GAME_RULES.md §2, §11
```

## Testing

```bash
pnpm test
```
