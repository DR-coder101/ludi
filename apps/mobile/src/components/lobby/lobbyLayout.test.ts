import { describe, expect, it } from 'vitest';
import { lobbyArrangement, lobbyColumnWidth, lobbyPaneInner, splitStartTop, stackedStartTop } from './lobbyLayout';

const PHONE_CHROME = { top: 47, bottom: 34 };
const START_HEIGHT = 60;

describe('lobbyLayout', () => {
  it('places START GAME at y 958 in the phone-inset stack', () => {
    expect(stackedStartTop(PHONE_CHROME)).toBe(958);
    expect(stackedStartTop(PHONE_CHROME) + START_HEIGHT).toBe(1018);
  });

  it('splits only when the stack would clip and the viewport is wide enough', () => {
    expect(lobbyArrangement({ width: 1280, height: 800 }, PHONE_CHROME)).toBe('split');
    expect(lobbyArrangement({ width: 800, height: 1280 }, PHONE_CHROME)).toBe('stack');
    expect(lobbyArrangement({ width: 390, height: 844 }, PHONE_CHROME)).toBe('stack');
    expect(lobbyArrangement({ width: 1280, height: 1018 }, PHONE_CHROME)).toBe('stack');
    expect(lobbyArrangement({ width: 1280, height: 1017 }, PHONE_CHROME)).toBe('split');
    expect(lobbyArrangement({ width: 858, height: 800 }, PHONE_CHROME)).toBe('split');
    expect(lobbyArrangement({ width: 857, height: 800 }, PHONE_CHROME)).toBe('stack');
  });

  it('keeps split START GAME inside a 800px landscape viewport', () => {
    expect(splitStartTop(PHONE_CHROME)).toBe(604);
    expect(splitStartTop(PHONE_CHROME) + START_HEIGHT).toBe(664);
    expect(splitStartTop(PHONE_CHROME) + START_HEIGHT).toBeLessThanOrEqual(800);
  });

  it('keeps each split pane at the stacked inner width', () => {
    expect(lobbyColumnWidth(1280, 'split')).toBe(858);
    expect(lobbyPaneInner(858, 'split')).toBe(408);
    expect(lobbyColumnWidth(390, 'stack')).toBe(390);
    expect(lobbyPaneInner(390, 'stack')).toBe(358);
    expect(lobbyColumnWidth(800, 'stack')).toBe(440);
    expect(lobbyPaneInner(440, 'stack')).toBe(408);
  });
});
