import {
  applyMove,
  createGame,
  legalMoves,
  rollDice,
  type Color,
  type GameState,
} from '@ludi/rules';

export const LOCAL_HOUSE_RULES = {
  maxConsecutiveSixes: 2 as const,
  extraRollOnCapture: false,
  blockadeCanMoveTogether: false,
  exactFinishBonus: false,
  playForPlacements: false,
};

export type LocalGame = {
  colors: Color[];
  state: GameState;
  lastRoll: [number, number] | null;
  rollKey: number;
};

export type LocalGameAction =
  | { type: 'roll'; random: () => number }
  | { type: 'move'; tokenIndex: number; dieIndex: 0 | 1 }
  | { type: 'rematch' };

export const LOCAL_GAME_KEY = 'ludi_local_game';

export function createLocalGame(colors: Color[]): LocalGame {
  return {
    colors,
    state: createGame({
      playerColors: colors,
      houseRules: LOCAL_HOUSE_RULES,
    }),
    lastRoll: null,
    rollKey: 0,
  };
}

export function reduceLocalGame(game: LocalGame, action: LocalGameAction): LocalGame {
  switch (action.type) {
    case 'roll': {
      if (game.state.phase !== 'awaiting_roll') return game;
      const result = rollDice(game.state, action.random);
      return {
        ...game,
        state: result.state,
        lastRoll: result.values,
        rollKey: game.rollKey + 1,
      };
    }
    case 'move': {
      if (game.state.phase !== 'awaiting_move') return game;
      const legal = legalMoves(game.state);
      const move = legal.find(
        (item) => item.tokenIndex === action.tokenIndex && item.dieIndex === action.dieIndex,
      );
      if (!move) return game;
      return {
        ...game,
        state: applyMove(game.state, action.tokenIndex, action.dieIndex).state,
      };
    }
    case 'rematch':
      return createLocalGame(game.colors);
    default: {
      const _never: never = action;
      return _never;
    }
  }
}

export function serializeLocalGame(game: LocalGame): string {
  return JSON.stringify({
    colors: game.colors,
    state: game.state,
    lastRoll: game.lastRoll,
    rollKey: game.rollKey,
  });
}

function isColor(value: unknown): value is Color {
  return value === 'red' || value === 'green' || value === 'yellow' || value === 'blue';
}

export function parseLocalGame(raw: string | null): LocalGame | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<LocalGame>;
    if (!Array.isArray(parsed.colors) || parsed.colors.length < 2 || !parsed.colors.every(isColor)) {
      return null;
    }
    if (!parsed.state || typeof parsed.state !== 'object') return null;
    const phase = parsed.state.phase;
    if (phase !== 'awaiting_roll' && phase !== 'awaiting_move' && phase !== 'finished') {
      return null;
    }
    if (!Array.isArray(parsed.state.tokens)) return null;
    return {
      colors: parsed.colors,
      state: parsed.state,
      lastRoll: Array.isArray(parsed.lastRoll)
        ? [Number(parsed.lastRoll[0]), Number(parsed.lastRoll[1])]
        : null,
      rollKey: typeof parsed.rollKey === 'number' ? parsed.rollKey : 0,
    };
  } catch {
    return null;
  }
}

export async function loadLocalGame(store: {
  getItem(key: string): Promise<string | null>;
}): Promise<LocalGame | null> {
  return parseLocalGame(await store.getItem(LOCAL_GAME_KEY));
}

export async function saveLocalGame(
  store: { setItem(key: string, value: string): Promise<void> },
  game: LocalGame,
): Promise<void> {
  await store.setItem(LOCAL_GAME_KEY, serializeLocalGame(game));
}

export async function clearLocalGame(store: {
  deleteItem(key: string): Promise<void>;
}): Promise<void> {
  await store.deleteItem(LOCAL_GAME_KEY);
}
