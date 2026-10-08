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

export interface DisconnectGrace {
  color: Color;
  startTime: number;
  timer: NodeJS.Timeout;
  turnTimerPaused: boolean;
}

export interface GameManager {
  state: GameState;
  startedAt: Date;
  moveTimer: NodeJS.Timeout | null;
  disconnectGraces: Map<Color, DisconnectGrace>;
  aiSubstitutes: Set<Color>;
}

export interface GameTimingConfig {
  gracePeriodMs: number;
  aiThinkDelayMs: number;
}

const DEFAULT_TIMING: GameTimingConfig = {
  gracePeriodMs: 60000,
  aiThinkDelayMs: 1000,
};

export class GameManagerRegistry {
  private games = new Map<string, GameManager>();
  private timingConfig: GameTimingConfig;

  constructor(timingConfig: GameTimingConfig = DEFAULT_TIMING) {
    this.timingConfig = timingConfig;
  }

  createGame(roomCode: string, config: GameConfig): GameState {
    const rulesState = createGame(config);
    
    const gameState = this.fromRulesState(rulesState);

    this.games.set(roomCode, {
      state: gameState,
      startedAt: new Date(),
      moveTimer: null,
      disconnectGraces: new Map(),
      aiSubstitutes: new Set(),
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
      this.clearAllGraceTimers(game);
      this.games.delete(roomCode);
    }
  }

  /** Throws both dice server-side; the engine ends the throw at once when neither die is playable. */
  rollDice(roomCode: string): { success: boolean; values?: [number, number]; error?: string } {
    const game = this.games.get(roomCode);
    if (!game) {
      return { success: false, error: 'Game not found' };
    }

    if (game.state.phase !== 'awaiting_roll') {
      return { success: false, error: 'Not in roll phase' };
    }

    this.clearTimers(game);

    const rng = () => randomInt(0, 6) / 6;
    const result = rollDice(this.toRulesState(game.state), rng);
    game.state = this.fromRulesState(result.state);

    return { success: true, values: result.values };
  }

  /** Plays one die of the current throw. */
  applyMove(
    roomCode: string, 
    tokenIndex: number,
    dieIndex: 0 | 1
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
    const move = moves.find(m => m.tokenIndex === tokenIndex && m.dieIndex === dieIndex);

    if (!move) {
      return { 
        success: false, 
        error: 'Illegal move', 
        hint: moves.length === 0 
          ? 'No legal moves available' 
          : `Valid moves (token/die): ${moves.map(m => `${m.tokenIndex}/${m.dieIndex}`).join(', ')}` 
      };
    }

    const from = game.state.tokens[tokenIndex].pos;
    const result = applyMove(rulesState, tokenIndex, dieIndex);
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

  setMoveTimer(roomCode: string, callback: () => void): void {
    const game = this.games.get(roomCode);
    if (!game) return;

    this.clearMoveTimer(game);
    game.moveTimer = setTimeout(callback, 30000);
  }

  startDisconnectGrace(roomCode: string, color: Color, onGraceExpired: () => void): void {
    const game = this.games.get(roomCode);
    if (!game) return;

    if (game.disconnectGraces.has(color)) {
      return;
    }

    const shouldPauseTurnTimer = game.state.turn === color && game.state.phase === 'awaiting_move';
    
    if (shouldPauseTurnTimer && game.moveTimer) {
      clearTimeout(game.moveTimer);
      game.moveTimer = null;
    }

    const timer = setTimeout(() => {
      game.disconnectGraces.delete(color);
      onGraceExpired();
    }, this.timingConfig.gracePeriodMs);

    game.disconnectGraces.set(color, {
      color,
      startTime: Date.now(),
      timer,
      turnTimerPaused: shouldPauseTurnTimer,
    });
  }

  cancelDisconnectGrace(roomCode: string, color: Color): { wasPaused: boolean } {
    const game = this.games.get(roomCode);
    if (!game) return { wasPaused: false };

    const grace = game.disconnectGraces.get(color);
    if (!grace) return { wasPaused: false };

    clearTimeout(grace.timer);
    game.disconnectGraces.delete(color);

    return { wasPaused: grace.turnTimerPaused };
  }

  markAsAISubstitute(roomCode: string, color: Color): void {
    const game = this.games.get(roomCode);
    if (!game) return;
    game.aiSubstitutes.add(color);
  }

  isAISubstitute(roomCode: string, color: Color): boolean {
    const game = this.games.get(roomCode);
    if (!game) return false;
    return game.aiSubstitutes.has(color);
  }

  getAIThinkDelay(): number {
    return this.timingConfig.aiThinkDelayMs;
  }

  clearTimers(game: GameManager): void {
    this.clearMoveTimer(game);
  }

  private clearAllGraceTimers(game: GameManager): void {
    for (const grace of game.disconnectGraces.values()) {
      clearTimeout(grace.timer);
    }
    game.disconnectGraces.clear();
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
