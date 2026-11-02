import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Browser, Page } from 'playwright';
import { err, ok, planned, type Ctx, type Result } from '../command.js';
import { ensureRunDir, resolveRunDir } from '../runDir.js';
import { sleep } from '../defaults.js';
import { comparePng, type CompareResult } from './compare.js';
import { exportWeb } from './exportWeb.js';
import { serveExport } from './serve.js';
import { evaluateLayout, verdictFailsCi, type Box, type CheckResult, type LayoutSample } from './layout.js';
import {
  BOARD_PROBE_FLOOR_PX,
  MIN_TAP_DP,
  RULES_CLOSE_NAME,
  RULES_HELP_NAME,
  RULES_HELP_PATH,
  SIZE_VIEWPORTS,
  SQUARE_TOLERANCE_PX,
  findRepoRoot,
  mobileDir,
  sizeBaselineDir,
  sizeShotsToRun,
  type ControlSpec,
  type SizeShot,
  type SizeViewport,
  type SizeViewportId,
} from './catalog.js';

type MeasuredControl = Box & { name: string; found: boolean };

const HUD_CONTROLS: readonly ControlSpec[] = [
  { role: 'button', name: 'Leave game', minTap: true },
  { role: 'button', name: 'Profile', minTap: true },
  { role: 'button', name: 'Roll the dice', minTap: true },
];

export type RulesHelpTapProof = {
  viewport: SizeViewportId;
  help: MeasuredControl;
  board: Box | null;
  tapOk: boolean;
  inside: boolean;
  overlaps: string[];
  opened: boolean;
  closed: boolean;
};

export function boxesOverlap(a: Box, b: Box): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

function helpInsideViewport(help: MeasuredControl, width: number, height: number): boolean {
  if (!help.found) return false;
  return (
    help.x >= -0.5 &&
    help.y >= -0.5 &&
    help.x + help.width <= width + 0.5 &&
    help.y + help.height <= height + 0.5
  );
}

function tapProofFails(proof: RulesHelpTapProof): string[] {
  const problems: string[] = [];
  if (!proof.help.found) problems.push('Game rules not found');
  if (!proof.tapOk) problems.push(`min side ${Math.min(proof.help.width, proof.help.height)} < ${MIN_TAP_DP}`);
  if (!proof.inside) problems.push('Game rules outside viewport');
  if (proof.overlaps.length) problems.push(`overlaps ${proof.overlaps.join(', ')}`);
  if (!proof.opened) problems.push('tap did not open the modal');
  if (!proof.closed) problems.push('close did not return to the board');
  return problems;
}

type CapturedShot = {
  shot: SizeShot;
  screenshot: string;
  sample: LayoutSample;
};

type LayoutReport = {
  screen: string;
  viewport: SizeViewportId;
  file: string;
  screenshot: string;
  checks: CheckResult[];
  ci_fail: CheckResult[];
};

async function measureControl(page: Page, control: ControlSpec): Promise<MeasuredControl> {
  const locator = page.getByRole('button', { name: control.name, exact: true });
  if ((await locator.count()) === 0) {
    return { name: control.name, found: false, x: 0, y: 0, width: 0, height: 0 };
  }
  const box = await locator.first().boundingBox();
  if (!box) return { name: control.name, found: false, x: 0, y: 0, width: 0, height: 0 };
  return { name: control.name, found: true, x: box.x, y: box.y, width: box.width, height: box.height };
}

async function measureFrame(page: Page): Promise<{
  scrollWidth: number;
  clientWidth: number;
  innerWidth: number;
  innerHeight: number;
  board: Box | null;
}> {
  return page.evaluate(
    ({ minSide, squareTol }) => {
      const doc = document.documentElement;
      const body = document.body;
      let board: { x: number; y: number; width: number; height: number } | null = null;
      let bestSide = 0;
      for (const el of document.querySelectorAll('div, svg, canvas')) {
        const rect = el.getBoundingClientRect();
        const side = Math.min(rect.width, rect.height);
        if (side < minSide) continue;
        if (Math.abs(rect.width - rect.height) > squareTol) continue;
        if (side <= bestSide) continue;
        bestSide = side;
        board = { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
      }
      return {
        scrollWidth: Math.max(doc.scrollWidth, body?.scrollWidth ?? 0),
        clientWidth: Math.max(doc.clientWidth, body?.clientWidth ?? 0),
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        board,
      };
    },
    { minSide: BOARD_PROBE_FLOOR_PX, squareTol: SQUARE_TOLERANCE_PX },
  );
}

async function captureSize(opts: { baseUrl: string; shots: SizeShot[]; outDir: string }): Promise<CapturedShot[]> {
  const { chromium } = await import('playwright');
  mkdirSync(opts.outDir, { recursive: true });
  const browser = await chromium.launch({
    args: ['--disable-dev-shm-usage', '--no-sandbox'],
  });
  const captured: CapturedShot[] = [];
  try {
    for (const shot of opts.shots) {
      const context = await browser.newContext({
        viewport: { width: shot.viewport.width, height: shot.viewport.height },
        deviceScaleFactor: shot.viewport.deviceScaleFactor,
        reducedMotion: 'reduce',
        colorScheme: 'dark',
      });
      const page = await context.newPage();
      page.setDefaultTimeout(30_000);
      await page.goto(`${opts.baseUrl}${shot.spec.path}`, { waitUntil: 'domcontentloaded' });
      await page
        .waitForFunction(() => document.fonts.status === 'loaded', null, { timeout: 10_000 })
        .catch(() => {});
      await page.getByRole(shot.spec.waitFor.role, { name: shot.spec.waitFor.name }).waitFor({ state: 'visible' });
      await page.evaluate(() => {
        const el = document.activeElement;
        if (el instanceof HTMLElement) el.blur();
      });
      await sleep(400);
      const screenshot = join(opts.outDir, shot.file);
      await page.screenshot({ path: screenshot, fullPage: false, animations: 'disabled' });
      const frame = await measureFrame(page);
      const controls: MeasuredControl[] = [];
      for (const control of shot.layout.controls) {
        controls.push(await measureControl(page, control));
      }
      captured.push({
        shot,
        screenshot,
        sample: {
          viewport: { width: frame.innerWidth, height: frame.innerHeight },
          scrollWidth: frame.scrollWidth,
          clientWidth: frame.clientWidth,
          board: frame.board,
          controls,
        },
      });
      await context.close();
    }
  } finally {
    await browser.close();
  }
  return captured;
}

function layoutReports(captured: CapturedShot[]): LayoutReport[] {
  return captured.map((item) => {
    const checks = evaluateLayout(item.sample, item.shot.layout, item.shot.viewport.id, []);
    return {
      screen: item.shot.spec.id,
      viewport: item.shot.viewport.id,
      file: item.shot.file,
      screenshot: item.screenshot,
      checks,
      ci_fail: verdictFailsCi(checks),
    };
  });
}

function ciLabel(shot: LayoutReport, check: CheckResult): string {
  const name = check.name ? ` ${check.name}` : '';
  return `${shot.viewport}/${shot.screen}/${check.check}${name}`;
}

export function planSizeCheck(args: {
  update: boolean;
  port: number;
  url?: string;
  runDir: string;
}): Result {
  const shots = sizeShotsToRun();
  const root = findRepoRoot();
  const actions: unknown[] = [];
  if (!args.url) {
    actions.push({
      action: 'expo_export_web',
      mobile: mobileDir(root),
      env: { EXPO_PUBLIC_DEV_ROUTES: '1' },
      output_dir: join(args.runDir, 'web-dist'),
    });
    actions.push({ action: 'serve', port: args.port, spa_fallback: true });
  } else {
    actions.push({ action: 'reuse_url', url: args.url });
  }
  for (const shot of shots) {
    actions.push({
      action: 'screenshot',
      screen: shot.spec.id,
      viewport: shot.viewport.id,
      file: shot.file,
      path: shot.spec.path,
      waitFor: shot.spec.waitFor,
      size: {
        width: shot.viewport.width,
        height: shot.viewport.height,
        deviceScaleFactor: shot.viewport.deviceScaleFactor,
      },
    });
    actions.push(
      args.update
        ? { action: 'write_baseline', file: join(sizeBaselineDir(root), shot.file) }
        : { action: 'compare', baseline: join(sizeBaselineDir(root), shot.file) },
    );
    actions.push({
      action: 'layout',
      screen: shot.spec.id,
      viewport: shot.viewport.id,
      control: RULES_CLOSE_NAME,
    });
  }
  for (const viewport of SIZE_VIEWPORTS) {
    actions.push({
      action: 'tap',
      control: RULES_HELP_NAME,
      path: RULES_HELP_PATH,
      viewport: viewport.id,
    });
  }
  return planned(actions);
}

async function proveRulesHelpTap(
  browser: Browser,
  opts: { baseUrl: string; viewport: SizeViewport },
): Promise<RulesHelpTapProof> {
  const context = await browser.newContext({
    viewport: { width: opts.viewport.width, height: opts.viewport.height },
    deviceScaleFactor: opts.viewport.deviceScaleFactor,
    reducedMotion: 'reduce',
    colorScheme: 'dark',
  });
  try {
    const page = await context.newPage();
    page.setDefaultTimeout(30_000);
    await page.goto(`${opts.baseUrl}${RULES_HELP_PATH}`, { waitUntil: 'domcontentloaded' });
    await page
      .waitForFunction(() => document.fonts.status === 'loaded', null, { timeout: 10_000 })
      .catch(() => {});
    await page.getByRole('button', { name: 'Roll the dice', exact: true }).waitFor({ state: 'visible' });
    await sleep(400);

    const help = await measureControl(page, { role: 'button', name: RULES_HELP_NAME, minTap: true });
    const frame = await measureFrame(page);
    const overlaps: string[] = [];
    if (help.found && frame.board && boxesOverlap(help, frame.board)) overlaps.push('board');
    for (const control of HUD_CONTROLS) {
      const measured = await measureControl(page, control);
      if (help.found && measured.found && boxesOverlap(help, measured)) overlaps.push(control.name);
    }

    const helpButton = page.getByRole('button', { name: RULES_HELP_NAME, exact: true });
    const closeButton = page.getByRole('button', { name: RULES_CLOSE_NAME, exact: true });
    let opened = false;
    let closed = false;
    if (help.found) {
      await helpButton.click();
      await closeButton.waitFor({ state: 'visible' });
      opened = (await closeButton.count()) > 0;
      await closeButton.click();
      await helpButton.waitFor({ state: 'visible' });
      await page.getByRole('button', { name: 'Roll the dice', exact: true }).waitFor({ state: 'visible' });
      closed = (await helpButton.count()) > 0 && (await closeButton.count()) === 0;
    }

    return {
      viewport: opts.viewport.id,
      help,
      board: frame.board,
      tapOk: help.found && Math.min(help.width, help.height) >= MIN_TAP_DP,
      inside: helpInsideViewport(help, frame.innerWidth, frame.innerHeight),
      overlaps,
      opened,
      closed,
    };
  } finally {
    await context.close();
  }
}

async function proveHelpOnViewports(baseUrl: string): Promise<RulesHelpTapProof[]> {
  const { chromium } = await import('playwright');
  const browser = await chromium.launch({
    args: ['--disable-dev-shm-usage', '--no-sandbox'],
  });
  try {
    const proofs: RulesHelpTapProof[] = [];
    for (const viewport of SIZE_VIEWPORTS) {
      proofs.push(await proveRulesHelpTap(browser, { baseUrl, viewport }));
    }
    return proofs;
  } finally {
    await browser.close();
  }
}

export async function runSizeCheck(args: Readonly<Record<string, unknown>>, ctx: Ctx): Promise<Result> {
  const update = Boolean(args['update-baselines']);
  const port = Number(args.port);
  const shots = sizeShotsToRun();

  let root: string;
  try {
    root = findRepoRoot();
  } catch (e) {
    return err(
      'PRECONDITION_FAILED',
      (e as Error).message,
      (e as Error & { hint?: string }).hint ?? 'Run from the ludi monorepo',
    );
  }

  const run = resolveRunDir(ctx.runDir);
  ensureRunDir(run);
  const evidenceDir = join(run.evidence, 'size');
  mkdirSync(evidenceDir, { recursive: true });
  const baseDir = sizeBaselineDir(root);

  let baseUrl = ctx.url?.replace(/\/$/, '');
  let closer: (() => Promise<void>) | undefined;
  try {
    if (!baseUrl) {
      const dist = join(run.root, 'web-dist');
      try {
        await exportWeb({
          mobile: mobileDir(root),
          dist,
          logPath: join(run.root, 'expo-export.log'),
        });
      } catch (e) {
        return err(
          'UPSTREAM_ERROR',
          (e as Error).message,
          `Inspect ${join(run.root, 'expo-export.log')}. Need EXPO_PUBLIC_DEV_ROUTES=1 on the web export.`,
        );
      }
      const server = await serveExport(dist, port);
      closer = server.close;
      baseUrl = server.url;
    }

    let captured: CapturedShot[];
    let tap: RulesHelpTapProof[];
    try {
      captured = await captureSize({ baseUrl, shots, outDir: evidenceDir });
      tap = await proveHelpOnViewports(baseUrl);
    } catch (e) {
      return err('UPSTREAM_ERROR', (e as Error).message, `ludi screens doctor --run-dir ${run.root} --output json`);
    }

    const layout = layoutReports(captured);
    const layoutCi = layout.flatMap((shot) => shot.ci_fail.map((check) => ({ shot, check })));
    const tapFailed = tap.flatMap((proof) =>
      tapProofFails(proof).map((detail) => `${proof.viewport}: ${detail}`),
    );

    if (update) {
      mkdirSync(baseDir, { recursive: true });
      const written = shots.map((shot) => {
        const dest = join(baseDir, shot.file);
        copyFileSync(join(evidenceDir, shot.file), dest);
        return dest;
      });
      const summary = {
        updated: written,
        viewports: SIZE_VIEWPORTS,
        results: [],
        layout,
        tap,
        evidence: evidenceDir,
      };
      writeFileSync(join(run.evidence, 'size.json'), JSON.stringify(summary, null, 2) + '\n');
      if (layoutCi.length || tapFailed.length) {
        const parts = [
          layoutCi.length
            ? `${layoutCi.length} size layout check(s) failed CI: ${layoutCi.map(({ shot, check }) => ciLabel(shot, check)).join(', ')}`
            : '',
          tapFailed.length ? `Game rules tap: ${tapFailed.join('; ')}` : '',
        ].filter(Boolean);
        return err('CONFLICT', parts.join('; '), `see ${join(run.evidence, 'size.json')}`);
      }
      return ok(summary);
    }

    const results: CompareResult[] = shots.map((shot) =>
      comparePng({
        id: `${shot.spec.id}-${shot.viewport.id}`,
        actualPath: join(evidenceDir, shot.file),
        baselinePath: join(baseDir, shot.file),
        diffPath: join(evidenceDir, shot.file.replace(/\.png$/, '.diff.png')),
      }),
    );
    const summary = {
      url: baseUrl,
      viewports: SIZE_VIEWPORTS,
      results,
      layout,
      tap,
      evidence: evidenceDir,
    };
    writeFileSync(join(run.evidence, 'size.json'), JSON.stringify(summary, null, 2) + '\n');
    const pixelFailed = results.filter((row) => !row.ok);
    const problems: string[] = [];
    if (pixelFailed.length) {
      problems.push(`pixel drift: ${pixelFailed.map((row) => row.id).join(', ')}`);
    }
    if (layoutCi.length) {
      problems.push(`layout: ${layoutCi.map(({ shot, check }) => ciLabel(shot, check)).join(', ')}`);
    }
    if (tapFailed.length) {
      problems.push(`Game rules tap: ${tapFailed.join('; ')}`);
    }
    if (problems.length) {
      const firstDiff = pixelFailed.find((row) => row.diff)?.diff;
      return err(
        'CONFLICT',
        `${problems.join('; ')}`,
        firstDiff
          ? `open ${firstDiff} and ${join(run.evidence, 'size.json')}. ludi screens check --target size --update-baselines if the pixels are intended`
          : `see ${join(run.evidence, 'size.json')}`,
      );
    }
    return ok(summary);
  } finally {
    if (closer) await closer().catch(() => {});
  }
}
