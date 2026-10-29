import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  SCREEN_LAYOUT,
  SCREENS,
  TABLET_KNOWN_FAILURES,
  TABLET_VIEWPORTS,
  findRepoRoot,
  type ScreenLayoutSpec,
} from '../src/screens/catalog.js';
import {
  androidOrientation,
  evaluateLayout,
  verdictFailsCi,
  type CheckResult,
  type LayoutSample,
} from '../src/screens/layout.js';

const boardSpec: ScreenLayoutSpec = {
  screenId: 'board-start',
  board: true,
  controls: [{ role: 'button', name: 'Roll the dice', minTap: true }],
};

const passingBoard = { x: 20, y: 20, width: 400, height: 400 };
const passingControl = { name: 'Roll the dice', found: true, x: 10, y: 10, width: 48, height: 48 };

function sample(over: Partial<LayoutSample> = {}): LayoutSample {
  return {
    viewport: { width: 800, height: 1280 },
    scrollWidth: 800,
    clientWidth: 800,
    board: passingBoard,
    controls: [passingControl],
    ...over,
  };
}

function observed(results: CheckResult[]) {
  return results.map((row) => ({
    check: row.check,
    name: row.name ?? null,
    ok: row.ok,
    known: row.known,
    detail: row.detail,
  }));
}

describe('evaluateLayout', () => {
  it('flags horizontal overflow past one pixel and accepts the slack', () => {
    const over = evaluateLayout(sample({ scrollWidth: 802, clientWidth: 800 }), boardSpec, 'portrait', []);
    const slack = evaluateLayout(sample({ scrollWidth: 801, clientWidth: 800 }), boardSpec, 'portrait', []);
    expect(observed(over).find((row) => row.check === 'overflow-x')).toEqual({
      check: 'overflow-x',
      name: null,
      ok: false,
      known: false,
      detail: 'scrollWidth 802 > clientWidth 800 + 1',
    });
    expect(observed(slack).find((row) => row.check === 'overflow-x')).toEqual({
      check: 'overflow-x',
      name: null,
      ok: true,
      known: false,
      detail: 'scrollWidth 801 <= clientWidth 800 + 1',
    });
  });

  it('fails a board that is not square', () => {
    const results = evaluateLayout(
      sample({ board: { x: 20, y: 20, width: 400, height: 300 } }),
      boardSpec,
      'portrait',
      [],
    );
    expect(observed(results)).toEqual([
      {
        check: 'overflow-x',
        name: null,
        ok: true,
        known: false,
        detail: 'scrollWidth 800 <= clientWidth 800 + 1',
      },
      {
        check: 'board-square',
        name: null,
        ok: false,
        known: false,
        detail: 'not square |w-h|=100',
      },
      {
        check: 'control',
        name: 'Roll the dice',
        ok: true,
        known: false,
        detail: '48x48',
      },
      {
        check: 'clip',
        name: 'Roll the dice',
        ok: true,
        known: false,
        detail: 'inside',
      },
    ]);
  });

  it('fails a control whose min side is under 44', () => {
    const results = evaluateLayout(
      sample({
        controls: [{ name: 'Roll the dice', found: true, x: 10, y: 10, width: 40, height: 48 }],
      }),
      boardSpec,
      'portrait',
      [],
    );
    expect(observed(results).filter((row) => row.check === 'control' || row.check === 'clip')).toEqual([
      {
        check: 'control',
        name: 'Roll the dice',
        ok: false,
        known: false,
        detail: 'min side 40 < 44',
      },
      {
        check: 'clip',
        name: 'Roll the dice',
        ok: true,
        known: false,
        detail: 'inside',
      },
    ]);
  });

  it('fails a control that crosses the viewport edge on clip only', () => {
    const results = evaluateLayout(
      sample({
        controls: [{ name: 'Roll the dice', found: true, x: 780, y: 10, width: 48, height: 48 }],
      }),
      boardSpec,
      'portrait',
      [],
    );
    expect(observed(results).filter((row) => row.check === 'control' || row.check === 'clip')).toEqual([
      {
        check: 'control',
        name: 'Roll the dice',
        ok: true,
        known: false,
        detail: '48x48',
      },
      {
        check: 'clip',
        name: 'Roll the dice',
        ok: false,
        known: false,
        detail: 'outside viewport',
      },
    ]);
  });

  it('does not emit clip when the control is missing', () => {
    const results = evaluateLayout(
      sample({
        controls: [{ name: 'Roll the dice', found: false, x: 0, y: 0, width: 0, height: 0 }],
      }),
      boardSpec,
      'portrait',
      [],
    );
    expect(observed(results).filter((row) => row.check === 'control' || row.check === 'clip')).toEqual([
      {
        check: 'control',
        name: 'Roll the dice',
        ok: false,
        known: false,
        detail: 'not found',
      },
    ]);
  });

  it('keeps a listed layout failure out of the CI fail set', () => {
    const results = evaluateLayout(
      sample({
        controls: [{ name: 'Roll the dice', found: true, x: 780, y: 10, width: 48, height: 48 }],
      }),
      boardSpec,
      'landscape',
      [
        {
          viewport: 'landscape',
          screenId: 'board-start',
          check: 'clip',
          name: 'Roll the dice',
          reason: 'roll sits past the right edge',
        },
      ],
    );
    expect(observed(results).filter((row) => row.check === 'control' || row.check === 'clip')).toEqual([
      {
        check: 'control',
        name: 'Roll the dice',
        ok: true,
        known: false,
        detail: '48x48',
      },
      {
        check: 'clip',
        name: 'Roll the dice',
        ok: false,
        known: true,
        detail: 'outside viewport',
      },
    ]);
    expect(verdictFailsCi(results)).toEqual([]);
  });

  it('fails CI when a listed layout failure now passes', () => {
    const results = evaluateLayout(sample(), boardSpec, 'portrait', [
      {
        viewport: 'portrait',
        screenId: 'board-start',
        check: 'overflow-x',
        reason: 'home used to scroll sideways',
      },
    ]);
    expect(verdictFailsCi(results).map((row) => ({ check: row.check, ok: row.ok, known: row.known }))).toEqual([
      { check: 'overflow-x', ok: true, known: true },
    ]);
  });
});

describe('tablet catalog', () => {
  it('fails a 42-tall Create room when nothing is waived', () => {
    const home = SCREEN_LAYOUT.find((layout) => layout.screenId === 'home');
    if (!home) throw new Error('missing home layout');
    const results = evaluateLayout(
      {
        viewport: { width: 800, height: 1280 },
        scrollWidth: 800,
        clientWidth: 800,
        board: null,
        controls: [
          { name: 'Create room', found: true, x: 34, y: 455, width: 361, height: 42 },
          { name: 'Join code', found: true, x: 405, y: 455, width: 361, height: 44 },
          { name: 'Quick match', found: true, x: 16, y: 531, width: 768, height: 85 },
          { name: 'VS BOTS', found: true, x: 16, y: 626, width: 379, height: 112 },
          { name: 'PASS & PLAY', found: true, x: 405, y: 626, width: 379, height: 112 },
        ],
      },
      home,
      'portrait',
      TABLET_KNOWN_FAILURES,
    );
    expect(observed(results).find((row) => row.name === 'Create room' && row.check === 'control')).toEqual({
      check: 'control',
      name: 'Create room',
      ok: false,
      known: false,
      detail: 'min side 42 < 44',
    });
    expect(verdictFailsCi(results).some((row) => row.name === 'Create room' && row.check === 'control')).toBe(true);
  });

  it('fails START GAME at y 958 on the 800px landscape viewport when nothing is waived', () => {
    const lobby = SCREEN_LAYOUT.find((layout) => layout.screenId === 'lobby');
    if (!lobby) throw new Error('missing lobby layout');
    const results = evaluateLayout(
      {
        viewport: { width: 1280, height: 800 },
        scrollWidth: 1280,
        clientWidth: 1280,
        board: null,
        controls: [
          { name: 'START GAME · 3 players', found: true, x: 645, y: 958, width: 408, height: 60 },
          { name: 'Montego Bay, open seat. Invite a friend', found: true, x: 227, y: 362, width: 199, height: 150 },
          { name: 'Ocho Rios: Shanice, Ready', found: true, x: 436, y: 362, width: 199, height: 150 },
          { name: 'Negril: Andre, Joined', found: true, x: 227, y: 522, width: 199, height: 150 },
          { name: 'Kingston: Dean (You), Host · Ready', found: true, x: 436, y: 522, width: 199, height: 150 },
        ],
      },
      lobby,
      'landscape',
      TABLET_KNOWN_FAILURES,
    );
    expect(observed(results).find((row) => row.name === 'START GAME · 3 players' && row.check === 'clip')).toEqual({
      check: 'clip',
      name: 'START GAME · 3 players',
      ok: false,
      known: false,
      detail: 'outside viewport',
    });
    expect(verdictFailsCi(results).some((row) => row.name === 'START GAME · 3 players' && row.check === 'clip')).toBe(
      true,
    );
  });

  it('passes 44dp home and board controls and an on-screen START GAME', () => {
    const home = SCREEN_LAYOUT.find((layout) => layout.screenId === 'home');
    const lobby = SCREEN_LAYOUT.find((layout) => layout.screenId === 'lobby');
    const board = SCREEN_LAYOUT.find((layout) => layout.screenId === 'board-start');
    if (!home || !lobby || !board) throw new Error('missing screen layout');

    const portraitHome = evaluateLayout(
      {
        viewport: { width: 800, height: 1280 },
        scrollWidth: 800,
        clientWidth: 800,
        board: null,
        controls: [
          { name: 'Create room', found: true, x: 34, y: 455, width: 361, height: 44 },
          { name: 'Join code', found: true, x: 405, y: 455, width: 361, height: 44 },
          { name: 'Quick match', found: true, x: 16, y: 531, width: 768, height: 85 },
          { name: 'VS BOTS', found: true, x: 16, y: 626, width: 379, height: 112 },
          { name: 'PASS & PLAY', found: true, x: 405, y: 626, width: 379, height: 112 },
        ],
      },
      home,
      'portrait',
      TABLET_KNOWN_FAILURES,
    );
    const landscapeLobby = evaluateLayout(
      {
        viewport: { width: 1280, height: 800 },
        scrollWidth: 1280,
        clientWidth: 1280,
        board: null,
        controls: [
          { name: 'START GAME · 3 players', found: true, x: 645, y: 604, width: 408, height: 60 },
          { name: 'Montego Bay, open seat. Invite a friend', found: true, x: 227, y: 362, width: 199, height: 150 },
          { name: 'Ocho Rios: Shanice, Ready', found: true, x: 436, y: 362, width: 199, height: 150 },
          { name: 'Negril: Andre, Joined', found: true, x: 227, y: 522, width: 199, height: 150 },
          { name: 'Kingston: Dean (You), Host · Ready', found: true, x: 436, y: 522, width: 199, height: 150 },
        ],
      },
      lobby,
      'landscape',
      TABLET_KNOWN_FAILURES,
    );
    const portraitBoard = evaluateLayout(
      {
        viewport: { width: 800, height: 1280 },
        scrollWidth: 800,
        clientWidth: 800,
        board: { x: 152, y: 118, width: 496, height: 496 },
        controls: [{ name: 'Roll the dice', found: true, x: 394, y: 1117, width: 120, height: 44 }],
      },
      board,
      'portrait',
      TABLET_KNOWN_FAILURES,
    );

    expect(verdictFailsCi(portraitHome)).toEqual([]);
    expect(verdictFailsCi(landscapeLobby)).toEqual([]);
    expect(verdictFailsCi(portraitBoard)).toEqual([]);
    expect(observed(landscapeLobby).filter((row) => row.name === 'START GAME · 3 players')).toEqual([
      {
        check: 'control',
        name: 'START GAME · 3 players',
        ok: true,
        known: false,
        detail: '408x60',
      },
      {
        check: 'clip',
        name: 'START GAME · 3 players',
        ok: true,
        known: false,
        detail: 'inside',
      },
    ]);
  });

  it('names a known failure only when the viewport, screen, and check exist', () => {
    const viewports = TABLET_VIEWPORTS.map((viewport) => viewport.id);
    const checks = ['overflow-x', 'board-square', 'control', 'clip'] as const;
    for (const row of TABLET_KNOWN_FAILURES) {
      expect(viewports).toContain(row.viewport);
      expect(SCREENS.map((screen) => screen.id)).toContain(row.screenId);
      expect(checks).toContain(row.check);
      expect(row.reason.length).toBeGreaterThan(0);
      if (row.name !== undefined) {
        const spec = SCREEN_LAYOUT.find((layout) => layout.screenId === row.screenId);
        expect(spec?.controls.map((control) => control.name)).toContain(row.name);
      }
    }
  });
});

describe('android orientation', () => {
  it('Android locks to portrait via expo.orientation', () => {
    const appJson = JSON.parse(readFileSync(join(findRepoRoot(), 'apps', 'mobile', 'app.json'), 'utf8'));
    expect(appJson.expo.orientation).toBe('portrait');
    expect(appJson.expo.ios.supportsTablet).toBe(true);
    expect(appJson.expo.android.orientation).toBeUndefined();
    expect(appJson.expo.android.screenOrientation).toBeUndefined();
    expect(androidOrientation(appJson)).toEqual({
      locked: true,
      expo: 'portrait',
      iosSupportsTablet: true,
    });
    expect(
      androidOrientation({
        expo: {
          orientation: 'portrait',
          ios: { supportsTablet: true },
          android: { screenOrientation: 'fullSensor' },
        },
      }).locked,
    ).toBe(false);
  });
});
