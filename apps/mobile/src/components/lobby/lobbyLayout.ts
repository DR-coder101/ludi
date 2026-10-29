export type LobbyChrome = { top: number; bottom: number };
export type LobbyArrangement = 'stack' | 'split';

export const LOBBY_SIDE = 16;
export const LOBBY_MAX_COLUMN = 440;
export const LOBBY_GAP = 10;
export const LOBBY_TOP_GAP = 7;
export const LOBBY_BOTTOM_GAP = 12;

const CODE_CARD_HEIGHT = 148;
const SEAT_HEIGHT = 150;
const START_HEIGHT = 60;
const HOUSE_RULE_ROWS = 4;
const HEADER = 48;
const TABS = 44;
const TABS_GAP = 12;
const CODE_GAP = 12;
const SECTION_GAP = 14;
const SECTION = 30;
const HOUSE_ROW = 38;
const HOUSE_GAP = 8;
const SPRING_MIN = 12;
const OPTIONS = 38;
const START_GAP = 16;

export const PANE_INNER = LOBBY_MAX_COLUMN - LOBBY_SIDE * 2;
export const SPLIT_COLUMN_WIDTH = LOBBY_SIDE * 2 + PANE_INNER * 2 + LOBBY_GAP;

const PICK_BLOCK = SECTION_GAP + SECTION + SEAT_HEIGHT * 2 + LOBBY_GAP;
const HOUSE_BLOCK = HOUSE_RULE_ROWS * HOUSE_ROW + (HOUSE_RULE_ROWS - 1) * HOUSE_GAP;

export function stackedStartTop(chrome: LobbyChrome): number {
  return (
    chrome.top +
    LOBBY_TOP_GAP +
    HEADER +
    TABS_GAP +
    TABS +
    CODE_GAP +
    CODE_CARD_HEIGHT +
    PICK_BLOCK +
    SECTION_GAP +
    SECTION +
    HOUSE_BLOCK +
    SPRING_MIN +
    OPTIONS +
    START_GAP
  );
}

export function splitStartTop(chrome: LobbyChrome): number {
  return stackedStartTop(chrome) - PICK_BLOCK;
}

export function lobbyArrangement(
  viewport: { width: number; height: number },
  chrome: LobbyChrome,
): LobbyArrangement {
  const clips = stackedStartTop(chrome) + START_HEIGHT > viewport.height;
  if (!clips) return 'stack';
  if (viewport.width < SPLIT_COLUMN_WIDTH) return 'stack';
  return 'split';
}

export function lobbyColumnWidth(viewportWidth: number, arrangement: LobbyArrangement): number {
  switch (arrangement) {
    case 'split':
      return Math.min(viewportWidth, SPLIT_COLUMN_WIDTH);
    case 'stack':
      return Math.min(viewportWidth, LOBBY_MAX_COLUMN);
    default: {
      const unexpected: never = arrangement;
      throw new Error(`unknown lobby arrangement ${String(unexpected)}`);
    }
  }
}

export function lobbyPaneInner(columnWidth: number, arrangement: LobbyArrangement): number {
  switch (arrangement) {
    case 'split':
      return (columnWidth - LOBBY_SIDE * 2 - LOBBY_GAP) / 2;
    case 'stack':
      return columnWidth - LOBBY_SIDE * 2;
    default: {
      const unexpected: never = arrangement;
      throw new Error(`unknown lobby arrangement ${String(unexpected)}`);
    }
  }
}
