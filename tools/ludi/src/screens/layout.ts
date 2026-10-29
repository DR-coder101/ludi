import {
  BOARD_MIN_PX,
  MIN_TAP_DP,
  SQUARE_TOLERANCE_PX,
  type KnownFailure,
  type LayoutCheckId,
  type ScreenLayoutSpec,
  type TabletViewportId,
} from './catalog.js';

const OVERFLOW_SLACK_PX = 1;
const VIEWPORT_EDGE_PX = 0.5;

export type Box = { x: number; y: number; width: number; height: number };

export type LayoutSample = {
  viewport: { width: number; height: number };
  scrollWidth: number;
  clientWidth: number;
  board: Box | null;
  controls: Array<Box & { name: string; found: boolean }>;
};

export type CheckResult = {
  check: LayoutCheckId;
  name?: string;
  ok: boolean;
  known: boolean;
  detail: string;
  box?: Box;
};

export type ExpoAppJson = {
  expo: {
    orientation?: string;
    ios?: { supportsTablet?: boolean };
    android?: Record<string, unknown>;
  };
};

function fullyInside(box: Box, width: number, height: number): boolean {
  return (
    box.x >= -VIEWPORT_EDGE_PX &&
    box.y >= -VIEWPORT_EDGE_PX &&
    box.x + box.width <= width + VIEWPORT_EDGE_PX &&
    box.y + box.height <= height + VIEWPORT_EDGE_PX
  );
}

function findKnown(
  known: readonly KnownFailure[],
  viewport: TabletViewportId,
  screenId: ScreenLayoutSpec['screenId'],
  check: LayoutCheckId,
  name: string | undefined,
): KnownFailure | undefined {
  const rows = known.filter((row) => row.viewport === viewport && row.screenId === screenId && row.check === check);
  if (name !== undefined) {
    const named = rows.find((row) => row.name === name);
    if (named) return named;
  }
  return rows.find((row) => row.name === undefined);
}

function result(opts: {
  check: LayoutCheckId;
  name?: string;
  ok: boolean;
  known: boolean;
  detail: string;
  box?: Box;
}): CheckResult {
  const row: CheckResult = {
    check: opts.check,
    ok: opts.ok,
    known: opts.known,
    detail: opts.detail,
  };
  if (opts.name !== undefined) row.name = opts.name;
  if (opts.box !== undefined) row.box = opts.box;
  return row;
}

function marked(
  known: readonly KnownFailure[],
  viewport: TabletViewportId,
  spec: ScreenLayoutSpec,
  check: LayoutCheckId,
  ok: boolean,
  detail: string,
  name?: string,
  box?: Box,
): CheckResult {
  return result({
    check,
    name,
    ok,
    known: findKnown(known, viewport, spec.screenId, check, name) !== undefined,
    detail,
    box,
  });
}

export function evaluateLayout(
  sample: LayoutSample,
  spec: ScreenLayoutSpec,
  viewportId: TabletViewportId,
  known: readonly KnownFailure[],
): CheckResult[] {
  const vw = sample.viewport.width;
  const vh = sample.viewport.height;
  const overflow = sample.scrollWidth > sample.clientWidth + OVERFLOW_SLACK_PX;
  const checks: CheckResult[] = [
    marked(
      known,
      viewportId,
      spec,
      'overflow-x',
      !overflow,
      overflow
        ? `scrollWidth ${sample.scrollWidth} > clientWidth ${sample.clientWidth} + 1`
        : `scrollWidth ${sample.scrollWidth} <= clientWidth ${sample.clientWidth} + 1`,
    ),
  ];

  if (spec.board) {
    checks.push(boardCheck(sample, spec, viewportId, known, vw, vh));
  }

  for (const control of spec.controls) {
    checks.push(...controlChecks(sample, spec, viewportId, known, control.name, control.minTap, vw, vh));
  }

  return checks;
}

function boardCheck(
  sample: LayoutSample,
  spec: ScreenLayoutSpec,
  viewportId: TabletViewportId,
  known: readonly KnownFailure[],
  vw: number,
  vh: number,
): CheckResult {
  const board = sample.board;
  if (!board) {
    return marked(known, viewportId, spec, 'board-square', false, 'board missing');
  }
  const delta = Math.abs(board.width - board.height);
  const side = Math.min(board.width, board.height);
  const problems: string[] = [];
  if (delta > SQUARE_TOLERANCE_PX) problems.push(`not square |w-h|=${delta}`);
  if (side < BOARD_MIN_PX) problems.push(`side ${side} < ${BOARD_MIN_PX}`);
  if (!fullyInside(board, vw, vh)) problems.push('outside viewport');
  const ok = problems.length === 0;
  return marked(
    known,
    viewportId,
    spec,
    'board-square',
    ok,
    ok ? `${board.width}x${board.height} inside` : problems.join('; '),
    undefined,
    board,
  );
}

function controlChecks(
  sample: LayoutSample,
  spec: ScreenLayoutSpec,
  viewportId: TabletViewportId,
  known: readonly KnownFailure[],
  name: string,
  minTap: boolean,
  vw: number,
  vh: number,
): CheckResult[] {
  const measured = sample.controls.find((control) => control.name === name);
  if (!measured?.found) {
    return [marked(known, viewportId, spec, 'control', false, 'not found', name)];
  }
  const box: Box = { x: measured.x, y: measured.y, width: measured.width, height: measured.height };
  const inside = fullyInside(box, vw, vh);
  const side = Math.min(box.width, box.height);
  const tapOk = !minTap || side >= MIN_TAP_DP;
  return [
    marked(
      known,
      viewportId,
      spec,
      'control',
      tapOk,
      tapOk ? `${box.width}x${box.height}` : `min side ${side} < ${MIN_TAP_DP}`,
      name,
      box,
    ),
    marked(known, viewportId, spec, 'clip', inside, inside ? 'inside' : 'outside viewport', name, box),
  ];
}

export function verdictFailsCi(results: readonly CheckResult[]): CheckResult[] {
  return results.filter((row) => (row.ok && row.known) || (!row.ok && !row.known));
}

export function androidOrientation(appJson: ExpoAppJson): {
  locked: boolean;
  expo: string;
  iosSupportsTablet: boolean;
} {
  const expo = appJson.expo.orientation ?? '';
  const iosSupportsTablet = appJson.expo.ios?.supportsTablet === true;
  const android = appJson.expo.android ?? {};
  const overridesOrientation =
    Object.prototype.hasOwnProperty.call(android, 'orientation') ||
    Object.prototype.hasOwnProperty.call(android, 'screenOrientation');
  return {
    locked: expo === 'portrait' && !overridesOrientation,
    expo,
    iosSupportsTablet,
  };
}
