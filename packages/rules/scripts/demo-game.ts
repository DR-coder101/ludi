/**
 * Demo game script for Ludi - plays a full 4-player game to completion
 * 
 * This script demonstrates the complete rules engine by:
 * - Creating a 4-player game with standard Jamaican rules
 * - Rolling dice and making random legal moves
 * - Printing ASCII board state after each turn
 * - Playing until a winner is determined
 * 
 * Run with: pnpm --filter @ludi/rules demo
 */

import {
  createGame,
  rollDice,
  legalMoves,
  applyMove,
  type GameState,
  type Color,
  type TokenPos,
  type GameConfig,
} from "../src/index";

// Seeded RNG for reproducibility (can be replaced with Math.random)
class SeededRandom {
  private seed: number;

  constructor(seed: number = Date.now()) {
    this.seed = seed;
  }

  next(): number {
    // Simple LCG algorithm
    this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
    return this.seed / 4294967296;
  }
}

/**
 * Render the game state as ASCII art
 */
function renderBoard(state: GameState): void {
  console.log("\n" + "=".repeat(60));
  console.log(`Turn: ${state.turn.toUpperCase()} | Phase: ${state.phase} | Dice: ${state.dice ?? "-"}`);
  console.log(`Consecutive 6s: ${state.consecutiveSixes}`);
  
  if (state.winner) {
    console.log(`🏆 WINNER: ${state.winner.toUpperCase()}`);
  }
  
  if (state.placements.length > 0) {
    console.log(`Placements: ${state.placements.map((c, i) => `${i + 1}. ${c.toUpperCase()}`).join(", ")}`);
  }

  // Group tokens by color
  const colorMap: Record<Color, { yard: number; track: Map<number, number>; homeColumn: Map<number, number>; home: number }> = {
    red: { yard: 0, track: new Map(), homeColumn: new Map(), home: 0 },
    green: { yard: 0, track: new Map(), homeColumn: new Map(), home: 0 },
    yellow: { yard: 0, track: new Map(), homeColumn: new Map(), home: 0 },
    blue: { yard: 0, track: new Map(), homeColumn: new Map(), home: 0 },
  };

  for (const token of state.tokens) {
    const colorData = colorMap[token.color];
    
    if (token.pos.zone === "yard") {
      colorData.yard++;
    } else if (token.pos.zone === "track") {
      const count = colorData.track.get(token.pos.cell) ?? 0;
      colorData.track.set(token.pos.cell, count + 1);
    } else if (token.pos.zone === "homeColumn") {
      const count = colorData.homeColumn.get(token.pos.step) ?? 0;
      colorData.homeColumn.set(token.pos.step, count + 1);
    } else if (token.pos.zone === "home") {
      colorData.home++;
    }
  }

  console.log("\n--- TOKEN POSITIONS ---");
  
  for (const color of ["red", "green", "yellow", "blue"] as Color[]) {
    if (!state.config.playerColors.includes(color)) continue;
    
    const data = colorMap[color];
    const colorSymbol = color[0].toUpperCase();
    
    const parts: string[] = [];
    
    if (data.yard > 0) {
      parts.push(`Yard: ${data.yard}`);
    }
    
    if (data.track.size > 0) {
      const trackPositions = Array.from(data.track.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([cell, count]) => `${cell}${count > 1 ? `×${count}` : ""}`)
        .join(", ");
      parts.push(`Track: [${trackPositions}]`);
    }
    
    if (data.homeColumn.size > 0) {
      const homeColPositions = Array.from(data.homeColumn.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([step, count]) => `${step}${count > 1 ? `×${count}` : ""}`)
        .join(", ");
      parts.push(`HomeCol: [${homeColPositions}]`);
    }
    
    if (data.home > 0) {
      parts.push(`HOME: ${data.home}✓`);
    }
    
    console.log(`  ${colorSymbol} ${color.padEnd(6)}: ${parts.join(" | ")}`);
  }
  
  console.log("=".repeat(60));
}

/**
 * Print game events in a human-readable format
 */
function printEvents(events: Array<{ type: string; color: Color; tokenIndex?: number; capturedColor?: Color; capturedTokenIndex?: number }>): void {
  if (events.length === 0) return;
  
  console.log("\n📋 Events:");
  for (const event of events) {
    const colorStr = event.color.toUpperCase();
    const tokenStr = event.tokenIndex !== undefined ? `[${event.tokenIndex}]` : "";
    
    switch (event.type) {
      case "came_out":
        console.log(`  ➤ ${colorStr}${tokenStr} came out of yard`);
        break;
      case "moved":
        console.log(`  → ${colorStr}${tokenStr} moved`);
        break;
      case "captured":
        console.log(`  💥 ${colorStr}${tokenStr} captured ${event.capturedColor?.toUpperCase()}[${event.capturedTokenIndex}]`);
        break;
      case "blockade_formed":
        console.log(`  🛡️  ${colorStr} formed a blockade`);
        break;
      case "blockade_broken":
        console.log(`  🔓 ${colorStr} broke a blockade`);
        break;
      case "entered_home_column":
        console.log(`  🏠 ${colorStr}${tokenStr} entered home column`);
        break;
      case "got_home":
        console.log(`  🎯 ${colorStr}${tokenStr} reached HOME!`);
        break;
      case "extra_turn":
        console.log(`  🎲 ${colorStr} rolled a 6, gets another turn!`);
        break;
      case "turn_passed":
        console.log(`  ⏭️  Turn passed`);
        break;
      case "game_over":
        console.log(`  🏁 GAME OVER!`);
        break;
    }
  }
}

/**
 * Play a full game until completion
 */
function playGame(): void {
  console.log("🎮 LUDI - Demo Game");
  console.log("Playing a 4-player game with standard Jamaican rules...\n");

  const config: GameConfig = {
    playerColors: ["red", "green", "yellow", "blue"],
    houseRules: {
      maxConsecutiveSixes: 2,
      extraRollOnCapture: false,
      blockadeCanMoveTogether: false,
      exactFinishBonus: false,
      playForPlacements: true,
    },
  };

  let state = createGame(config);
  const rng = new SeededRandom();
  
  // Safety cap: max 1000 turns to prevent infinite loops
  const MAX_TURNS = 1000;
  let turnCount = 0;

  renderBoard(state);

  while (state.phase !== "finished" && turnCount < MAX_TURNS) {
    turnCount++;
    
    console.log(`\n--- Turn ${turnCount} ---`);

    if (state.phase === "awaiting_roll") {
      // Roll the dice
      const rollResult = rollDice(state, () => rng.next());
      state = rollResult.state;
      
      console.log(`🎲 ${state.turn.toUpperCase()} rolled a ${rollResult.value}`);
      
      // Check if we auto-passed (no legal moves)
      if (state.phase === "awaiting_roll") {
        console.log(`  ⚠️  No legal moves available, turn passed`);
        renderBoard(state);
        continue;
      }
    }

    if (state.phase === "awaiting_move") {
      // Get legal moves
      const moves = legalMoves(state);
      
      if (moves.length === 0) {
        console.log("  ⚠️  No legal moves (should not happen after roll)");
        break;
      }

      // Pick a random legal move
      const randomIndex = Math.floor(rng.next() * moves.length);
      const chosenMove = moves[randomIndex];
      
      const token = state.tokens[chosenMove.tokenIndex];
      console.log(`  ✓ ${state.turn.toUpperCase()} moves token [${chosenMove.tokenIndex}] from ${formatPos(token.pos)} to ${formatPos(chosenMove.resulting)}`);
      
      if (chosenMove.captures) {
        console.log(`    → Will capture ${chosenMove.captures.color.toUpperCase()}[${chosenMove.captures.index}]`);
      }

      // Apply the move
      const moveResult = applyMove(state, chosenMove.tokenIndex);
      state = moveResult.state;
      
      printEvents(moveResult.events);
      renderBoard(state);
    }

    // Safety check: detect stuck state
    if (state.phase === "awaiting_move" && legalMoves(state).length === 0) {
      console.log("\n⚠️  WARNING: Game stuck in awaiting_move with no legal moves");
      break;
    }
  }

  if (turnCount >= MAX_TURNS) {
    console.log(`\n⚠️  Game terminated after ${MAX_TURNS} turns (safety cap)`);
  }

  console.log("\n" + "=".repeat(60));
  console.log("🏁 GAME COMPLETE!");
  console.log(`Total turns: ${turnCount}`);
  
  if (state.winner) {
    console.log(`\n🏆 Winner: ${state.winner.toUpperCase()}`);
  }
  
  if (state.placements.length > 0) {
    console.log("\n📊 Final Placements:");
    state.placements.forEach((color, index) => {
      console.log(`  ${index + 1}. ${color.toUpperCase()}`);
    });
  }
  
  console.log("=".repeat(60));
}

/**
 * Format a token position for display
 */
function formatPos(pos: TokenPos): string {
  if (pos.zone === "yard") return "Yard";
  if (pos.zone === "track") return `Track[${pos.cell}]`;
  if (pos.zone === "homeColumn") return `HomeCol[${pos.step}]`;
  if (pos.zone === "home") return "HOME";
  return "Unknown";
}

// Run the demo
playGame();
