# LUDI — Game Rules (Jamaican / Caribbean Ludo)
### Source of truth for the rules engine. Cursor agents: read this before touching `packages/rules`.

> House rules vary by family and island. Anything marked **[HOUSE]** must be a configurable toggle in `RoomConfig.houseRules`. Everything else is fixed for MVP.

---

## 1. Board & Setup

- Standard 15×15 cross board: **52-cell main track** (circular), 4 corner yards (bases), 4 home columns of 6 cells leading to centre.
- 4 players, colours in clockwise turn order: **Red → Green → Yellow → Blue**. (2–3 player games use a subset in this order.)
- Each player has **4 tokens**, all starting in their yard.
- Player start cells are 13 track positions apart: Red=0, Green=13, Yellow=26, Blue=39 (absolute track indices).
- A token's journey: leave yard → travel the full 52-cell track clockwise → enter own home column → reach centre (home). Total steps from start cell to home = **57**.

## 2. Starting & Turn Order

- Highest opening roll goes first **[HOUSE: or youngest/host choice]**; play proceeds clockwise.
- **[HOUSE]** `diceCount: 1 | 2` (default **2**, Jamaican standard):
  - With **2 dice**: roll two dice (each 1–6), then move your token(s) according to the dice values. You may split the values across different tokens or apply them as sequential sub-moves to one token. Captures are evaluated at the end of each sub-move.
  - With **1 die**: roll one die (1–6), then move one legal token exactly that many steps.

## 3. Leaving the Yard ("Coming Out")

- A token may leave the yard **only on a roll of exactly 6** (on **either die** when `diceCount: 2`), and is placed on its colour's start cell.
- The start cell is a **safe cell** while occupied by its own colour's newly-entered token(s).
- **[HOUSE]** Some play that you cannot come out if your own start cell is occupied by an opponent blockade — standard: blockades block other players only (see §6).

## 4. Rolling a 6

- Rolling a 6 grants **another roll** after completing the move(s).
  - With `diceCount: 2`: a 6 on **either die** grants an extra roll after completing the move(s) from that roll. Rolling doubles (same value on both dice) does **not** grant an extra roll unless one of the dice shows a 6.
  - With `diceCount: 1`: rolling a 6 grants an extra roll.
- **[HOUSE — Jamaican standard]** Maximum **two consecutive sixes**: if you roll a third consecutive 6 (i.e., three consecutive rolls where at least one die shows 6), the turn is forfeited (no move) and play passes on. Toggle: `maxConsecutiveSixes: 2 | 3 | unlimited`.

## 5. Capturing ("Licking" / sending home)

- Landing on a cell occupied by a **single** opponent token captures it: the opponent token returns to its yard, and your token takes the cell.
- Capturing grants **no extra roll** in standard Jamaican play **[HOUSE: some families award an extra roll on capture — toggle `extraRollOnCapture`]**.
- You **cannot** capture on a safe cell (see §7).
- A token in its home column or centre can never be captured.

## 6. Blockades ("Doubles")

- **Two or more tokens of the same colour on one cell form a blockade.**
- A blockade **cannot be captured**.
- **Only the blockade's owner may land on or pass over that square.** All other players must stop behind it — they cannot pass or land on the blockade.
- A blockade may be formed on safe cells and start cells.
- **[HOUSE]** `blockadeCanMoveTogether: boolean` — some families allow a blockade to move as a pair when the dice value permits; standard Jamaican: **false**, each token moves individually and moving one off the cell breaks the blockade.
- Three or four tokens stacked = still treated as a blockade; the extras are just stacked tokens and may leave individually, but the cell remains impassable to other players while ≥2 same-colour tokens remain.

## 7. Safe Cells

- The 4 **start cells** and the 4 **star-marked cells** (indices 8, 21, 34, 47 in standard layout) are safe: tokens of multiple colours may share them; **no captures** occur there.
- Exception per §6: a blockade on a safe cell is still impassable.

## 8. Movement Rules

- Tokens move **clockwise only** on the main track; no backward movement, ever.
- You must move if you have any legal move. If no token can legally move (all blocked / overshooting home / blocked by blockades), the turn passes.
- A token enters its home column after completing the full track; the home column requires **exact count** — an overshooting roll is not a legal move for that token.
- Reaching the centre ("getting home") removes the token from play. **[HOUSE]** `exactFinishBonus` — some award an extra roll for bringing a token home; standard: no extra roll.

## 9. Winning

- First player to bring all 4 tokens home **wins the match**.
- **[HOUSE]** `playForPlacements: boolean` — continue for 2nd/3rd place after a winner; standard Jamaican money games: winner takes all, match ends immediately.

## 10. Edge Cases the Engine MUST Handle (test list)

1. Rolling 6 with all tokens in yard → must come out (no other move exists). With `diceCount: 2`, a 6 on either die allows coming out.
2. Third consecutive 6 → forfeit, even if moves were available. With `diceCount: 2`, this counts consecutive rolls where at least one die shows 6.
3. Landing on opponent single token → capture; on opponent blockade → illegal move.
4. Moving onto own single token → forms blockade.
5. Blockade directly ahead → opponent tokens cannot pass; owner's tokens **may** pass or land on the blockade.
6. Exact count required into home; overshoot = illegal for that token (other tokens may still move).
7. Safe cell: two different colours coexist; third colour also fine.
8. Capture on entry to track (coming out onto opponent's token on your start cell) — start cell is safe → NO capture.
9. All 4 tokens of a colour stacked on one non-safe cell: opponent landing attempt is illegal (blockade present); owner may land on or pass over.
10. No-legal-move auto-pass, including the case where the only movable token would overshoot home.
11. 2-player and 3-player games: unused colours' cells are plain track cells.
12. Turn timeout → server picks a random legal move (online mode only).
13. With `diceCount: 2`, dice values may be split across pieces or applied as sequential sub-moves; capture is evaluated at the end of each sub-move.

## 11. Engine API Contract (`packages/rules`)

```ts
type Color = "red" | "green" | "yellow" | "blue";

interface GameConfig {
  playerColors: Color[];           // 2–4 colours
  houseRules: {
    diceCount: 1 | 2;              // default 2 (Jamaican standard)
    maxConsecutiveSixes: 2 | 3 | "unlimited";
    extraRollOnCapture: boolean;
    blockadeCanMoveTogether: boolean;
    exactFinishBonus: boolean;
    playForPlacements: boolean;
  };
}

interface TokenState { color: Color; index: 0|1|2|3; pos: TokenPos; }
// TokenPos: { zone: "yard" } | { zone: "track"; cell: number } /* 0–51 absolute */
//         | { zone: "homeColumn"; step: 1..6 } | { zone: "home" }

interface GameState {
  config: GameConfig;
  tokens: TokenState[];            // 4 per active colour
  turn: Color;
  phase: "awaiting_roll" | "awaiting_move" | "finished";
  dice: number | number[] | null;  // number for diceCount:1, number[] for diceCount:2
  consecutiveSixes: number;
  winner: Color | null;
  placements: Color[];
}

createGame(config): GameState
rollDice(state, rng): { state, value }        // server supplies rng; value is number or number[]
legalMoves(state): { tokenIndex: number; resulting: TokenPos; captures?: TokenRef }[]
applyMove(state, tokenIndex): { state, events: GameEvent[] }
// GameEvent: "moved" | "came_out" | "captured" | "blockade_formed" | "blockade_broken"
//          | "entered_home_column" | "got_home" | "extra_turn" | "turn_passed" | "game_over"
```

**Purity requirement:** no I/O, no Date, no Math.random — rng injected. Every function returns new state (immutable). 100% branch coverage target on this package.

**Note:** The `packages/rules` implementation of `diceCount: 2` logic (2-dice rolling, split moves, sequential sub-move captures, and 6-on-either-die extra roll) will be delivered in a follow-up PR.
