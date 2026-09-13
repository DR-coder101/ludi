import { randomInt } from 'crypto';
import type { GameState, Color, TokenPos, LegalMove } from '@ludi/protocol';
import { 
  createGame, 
  rollDice, 
  legalMoves, 
  applyMove,
  type GameConfig,
  type GameState as RulesGameState,
} from '@ludi/rules';

export interface GameManager {
  state: GameState;
  autoPassTimer: NodeJS.Timeout | null;
  moveTimer: NodeJS.Timeout | null;
}

export class GameManagerRegistry {
  private games = new Map<string, GameManager>();

  createGame(roomCode: string, config: GameConfig): GameState {
    const rulesState = createGame(config);
    
    const gameState: GameState = {
      config: rulesState.config,
      tokens: rulesState.tokens,
      turn: rulesState.turn,
      phase: rulesState.phase,
      dice: rulesState.dice,
      consecutiveSixes: rulesState.consecutiveSixes,
      winner: rulesState.winner,
      placements: rulesState.placements,
    };

    this.games.set(roomCode, {
      state: gameState,
      autoPassTimer: null,
      moveTimer: null,
    });

    return gameState;
  }

  getGame(roomCode: string): GameManager | undefined {
    return this.games.get(roomCode);
  }

  deleteGame(roomCode: string): void {
    const game = this.games.get(roomCode);
    if (game) {
      this.clearTimers(game);
      this.games.delete(roomCode);
    }
  }

  rollDice(roomCode: string): { success: boolean; value?: number; error?: string; autoPass?: boolean } {
    const game = this.games.get(roomCode);
    if (!game) {
      return { success: false, error: 'Game not found' };
    }

    if (game.state.phase !== 'awaiting_roll') {
      return { success: false, error: 'Not in roll phase' };
    }

    this.clearTimers(game);

    const rng = () => randomInt(0, 6) / 6;
    const rulesState = this.toRulesState(game.state);
    const result = rollDice(rulesState, rng);
    
    game.state = this.fromRulesState(result.state);

    const moves = legalMoves(this.toRulesState(game.state));
    
    if (moves.length === 0 && game.state.phase === 'awaiting_move') {
      return { success: true, value: result.value, autoPass: true };
    }

    return { success: true, value: result.value };
  }

  applyMove(
    roomCode: string, 
    tokenIndex: number
  ): { 
    success: boolean; 
    error?: string; 
    hint?: string;
    from?: TokenPos;
    to?: TokenPos;
    captured?: { color: Color; index: 0 | 1 | 2 | 3 };
  } {
    const game = this.games.get(roomCode);
    if (!game) {
      return { success: false, error: 'Game not found' };
    }

    if (game.state.phase !== 'awaiting_move') {
      return { success: false, error: 'Not in move phase', hint: 'Must roll dice first' };
    }

    this.clearTimers(game);

    const rulesState = this.toRulesState(game.state);
    const moves = legalMoves(rulesState);
    const move = moves.find(m => m.tokenIndex === tokenIndex);

    if (!move) {
      return { 
        success: false, 
        error: 'Illegal move', 
        hint: moves.length === 0 
          ? 'No legal moves available' 
          : `Valid token indices: ${moves.map(m => m.tokenIndex).join(', ')}` 
      };
    }

    const from = game.state.tokens[tokenIndex].pos;
    const result = applyMove(rulesState, tokenIndex);
    game.state = this.fromRulesState(result.state);
    
    return {
      success: true,
      from,
      to: move.resulting,
      captured: move.captures,
    };
  }

  getLegalMoves(roomCode: string): LegalMove[] {
    const game = this.games.get(roomCode);
    if (!game || game.state.phase !== 'awaiting_move') {
      return [];
    }

    const rulesState = this.toRulesState(game.state);
    return legalMoves(rulesState);
  }

  setAutoPassTimer(roomCode: string, callback: () => void): void {
    const game = this.games.get(roomCode);
    if (!game) return;

    this.clearAutoPassTimer(game);
    game.autoPassTimer = setTimeout(callback, 3000);
  }

  setMoveTimer(roomCode: string, callback: () => void): void {
    const game = this.games.get(roomCode);
    if (!game) return;

    this.clearMoveTimer(game);
    game.moveTimer = setTimeout(callback, 30000);
  }

  clearTimers(game: GameManager): void {
    this.clearAutoPassTimer(game);
    this.clearMoveTimer(game);
  }

  private clearAutoPassTimer(game: GameManager): void {
    if (game.autoPassTimer) {
      clearTimeout(game.autoPassTimer);
      game.autoPassTimer = null;
    }
  }

  private clearMoveTimer(game: GameManager): void {
    if (game.moveTimer) {
      clearTimeout(game.moveTimer);
      game.moveTimer = null;
    }
  }

  private toRulesState(state: GameState): RulesGameState {
    return state as unknown as RulesGameState;
  }

  private fromRulesState(rulesState: RulesGameState): GameState {
    return rulesState as unknown as GameState;
  }
}
