# @ludi/rules

Pure TypeScript game rules engine for Caribbean/Jamaican Ludo.

## Design Principles

- **Pure functions**: No side effects, dependency-free
- **Immutable state**: All operations return new state
- **Injected randomness**: RNG passed as parameter for testability
- **Shared validation**: Used by both client (prediction) and server (authority)

## Usage

```typescript
import { hello } from '@ludi/rules';

console.log(hello()); // "Hello from @ludi/rules"
```

## Testing

```bash
pnpm test
```

## Future API (Phase 1)

```typescript
import { createGame, rollDice, legalMoves, applyMove } from '@ludi/rules';

const game = createGame({ players: 4, houseRules: { ... } });
const rolled = rollDice(game, cryptoRNG);
const moves = legalMoves(rolled);
const nextState = applyMove(rolled, moves[0]);
```
