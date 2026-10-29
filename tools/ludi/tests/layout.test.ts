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
        detail: '48x48 inside',
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

  it('fails a control that crosses the viewport edge', () => {
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
        ok: false,
        known: false,
        detail: 'outside viewport',
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
          check: 'control',
          name: 'Roll the dice',
          reason: 'roll sits past the right edge',
        },
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
        ok: false,
        known: true,
        detail: 'outside viewport',
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
