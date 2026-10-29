import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Locator, Page } from 'playwright';
import { err, ok, planned, type Ctx, type Result } from '../command.js';
import { ensureRunDir, resolveRunDir } from '../runDir.js';
import { sleep } from '../defaults.js';
import { comparePng, type CompareResult } from './compare.js';
import { exportWeb } from './exportWeb.js';
import { serveExport } from './serve.js';
import {
  androidOrientation,
  evaluateLayout,
  verdictFailsCi,
  type Box,
  type CheckResult,
  type ExpoAppJson,
  type LayoutSample,
} from './layout.js';
import {
  BOARD_PROBE_FLOOR_PX,
  SCREEN_IDS,
  SQUARE_TOLERANCE_PX,
  TABLET_KNOWN_FAILURES,
  TABLET_VIEWPORTS,
  findRepoRoot,
  mobileDir,
  tabletBaselineDir,
  tabletShotsToRun,
  type ControlSpec,
  type TabletShot,
  type TabletViewportId,
} from './catalog.js';

type MeasuredControl = Box & { name: string; found: boolean };

type FrameMeasure = {
  scrollWidth: number;
  clientWidth: number;
  innerWidth: number;
  innerHeight: number;
  board: Box | null;
};

type CapturedShot = {
  shot: TabletShot;
  screenshot: string;
  sample: LayoutSample;
};

type LayoutReport = {
  screen: TabletShot['spec']['id'];
  viewport: TabletViewportId;
  file: string;
  screenshot: string;
  checks: CheckResult[];
  ci_fail: CheckResult[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readExpoAppJson(root: string): ExpoAppJson {
  const parsed: unknown = JSON.parse(readFileSync(join(mobileDir(root), 'app.json'), 'utf8'));
  if (!isRecord(parsed) || !isRecord(parsed.expo)) {
    throw new Error('apps/mobile/app.json has no expo object');
  }
  const expo = parsed.expo;
  const orientation = typeof expo.orientation === 'string' ? expo.orientation : undefined;
  const ios =
    isRecord(expo.ios) && typeof expo.ios.supportsTablet === 'boolean'
      ? { supportsTablet: expo.ios.supportsTablet }
      : undefined;
  const android = isRecord(expo.android) ? expo.android : undefined;
  return { expo: { orientation, ios, android } };
}

function controlLocator(page: Page, control: ControlSpec): Locator {
  switch (control.role) {
    case 'button':
      return page.getByRole('button', { name: control.name, exact: true });
    case 'label':
      return page.getByLabel(control.name, { exact: true });
    default: {
      const unexpected: never = control.role;
      throw new Error(`unknown control role ${String(unexpected)}`);
    }
  }
}

async function measureControl(page: Page, control: ControlSpec): Promise<MeasuredControl> {
  const locator = controlLocator(page, control);
  if ((await locator.count()) === 0) {
    return { name: control.name, found: false, x: 0, y: 0, width: 0, height: 0 };
  }
  const box = await locator.first().boundingBox();
  if (!box) return { name: control.name, found: false, x: 0, y: 0, width: 0, height: 0 };
  return { name: control.name, found: true, x: box.x, y: box.y, width: box.width, height: box.height };
}

async function measureFrame(page: Page): Promise<FrameMeasure> {
  return page.evaluate(
    ({ minSide, squareTol }) => {
      const doc = document.documentElement;
      const body = document.body;
      const scrollWidth = Math.max(doc.scrollWidth, body?.scrollWidth ?? 0);
      const clientWidth = Math.max(doc.clientWidth, body?.clientWidth ?? 0);
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
        scrollWidth,
        clientWidth,
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        board,
      };
    },
    { minSide: BOARD_PROBE_FLOOR_PX, squareTol: SQUARE_TOLERANCE_PX },
  );
}

async function captureTablet(opts: { baseUrl: string; shots: TabletShot[]; outDir: string }): Promise<CapturedShot[]> {
  const { chromium } = await import('playwright');
  mkdirSync(opts.outDir, { recursive: true });
  const browser = await chromium.launch({
    args: ['--disable-dev-shm-usage', '--no-sandbox'],
  });
  const captured: CapturedShot[] = [];
  try {
    const viewportIds: TabletViewportId[] = [];
    for (const shot of opts.shots) {
      if (!viewportIds.includes(shot.viewport.id)) viewportIds.push(shot.viewport.id);
    }
    for (const viewportId of viewportIds) {
      const group = opts.shots.filter((shot) => shot.viewport.id === viewportId);
      const viewport = group[0]!.viewport;
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        deviceScaleFactor: viewport.deviceScaleFactor,
        reducedMotion: 'reduce',
        colorScheme: 'dark',
      });
      const page = await context.newPage();
      page.setDefaultTimeout(30_000);
      for (const shot of group) {
        await page.goto(`${opts.baseUrl}${shot.spec.path}`, { waitUntil: 'domcontentloaded' });
        await page
          .waitForFunction(() => document.fonts.status === 'loaded', null, { timeout: 10_000 })
          .catch(() => {});
        await page.getByRole(shot.spec.waitFor.role, { name: shot.spec.waitFor.name }).waitFor({ state: 'visible' });
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
      }
      await context.close();
    }
  } finally {
    await browser.close();
  }
  return captured;
}

function layoutReports(captured: readonly CapturedShot[]): LayoutReport[] {
  return captured.map((item) => {
    const checks = evaluateLayout(item.sample, item.shot.layout, item.shot.viewport.id, TABLET_KNOWN_FAILURES);
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

export function planTabletCheck(args: {
  screen: string;
  update: boolean;
  port: number;
  url?: string;
  runDir: string;
}): Result {
  const shots = tabletShotsToRun(args.screen);
  if (shots.length === 0) {
    return err(
      'INVALID_ARGS',
      `Unknown --screen ${args.screen}`,
      `ludi screens check --target tablet --help (known: all, ${SCREEN_IDS.join(', ')})`,
    );
  }
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
        ? { action: 'write_baseline', file: join(tabletBaselineDir(root), shot.file) }
        : { action: 'compare', baseline: join(tabletBaselineDir(root), shot.file) },
    );
    actions.push({
      action: 'layout',
      screen: shot.spec.id,
      viewport: shot.viewport.id,
      board: shot.layout.board,
      controls: shot.layout.controls.map((control) => control.name),
    });
  }
  return planned(actions);
}

export async function runTabletCheck(args: Readonly<Record<string, unknown>>, ctx: Ctx): Promise<Result> {
  const screen = String(args.screen ?? 'all');
  const update = Boolean(args['update-baselines']);
  const port = Number(args.port);
  const shots = tabletShotsToRun(screen);
  if (shots.length === 0) {
    return err(
      'INVALID_ARGS',
      `Unknown --screen ${screen}`,
      `ludi screens check --target tablet --help (known: all, ${SCREEN_IDS.join(', ')})`,
    );
  }

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
  const evidenceDir = join(run.evidence, 'tablet');
  mkdirSync(evidenceDir, { recursive: true });
  const baseDir = tabletBaselineDir(root);

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
    try {
      captured = await captureTablet({ baseUrl, shots, outDir: evidenceDir });
    } catch (e) {
      return err('UPSTREAM_ERROR', (e as Error).message, `ludi screens doctor --run-dir ${run.root} --output json`);
    }

    const orientation = androidOrientation(readExpoAppJson(root));
    const layout = layoutReports(captured);
    const layoutCi = layout.flatMap((shot) => shot.ci_fail.map((check) => ({ shot, check })));

    if (update) {
      mkdirSync(baseDir, { recursive: true });
      const written = shots.map((shot) => {
        const dest = join(baseDir, shot.file);
        copyFileSync(join(evidenceDir, shot.file), dest);
        return dest;
      });
      const summary = {
        updated: written,
        orientation: { ...orientation, android_locked: orientation.locked },
        viewports: TABLET_VIEWPORTS,
        known: TABLET_KNOWN_FAILURES,
        results: [],
        layout,
        evidence: evidenceDir,
      };
      writeFileSync(join(run.evidence, 'tablet.json'), JSON.stringify(summary, null, 2) + '\n');
      if (layoutCi.length) {
        return err(
          'CONFLICT',
          `${layoutCi.length} tablet layout check(s) failed CI: ${layoutCi.map(({ shot, check }) => ciLabel(shot, check)).join(', ')}`,
          `see ${join(run.evidence, 'tablet.json')}`,
        );
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
      orientation: { ...orientation, android_locked: orientation.locked },
      viewports: TABLET_VIEWPORTS,
      known: TABLET_KNOWN_FAILURES,
      results,
      layout,
      evidence: evidenceDir,
    };
    writeFileSync(join(run.evidence, 'tablet.json'), JSON.stringify(summary, null, 2) + '\n');
    const pixelFailed = results.filter((row) => !row.ok);
    const problems: string[] = [];
    if (pixelFailed.length) {
      problems.push(`pixel drift: ${pixelFailed.map((row) => row.id).join(', ')}`);
    }
    if (layoutCi.length) {
      problems.push(`layout: ${layoutCi.map(({ shot, check }) => ciLabel(shot, check)).join(', ')}`);
    }
    if (problems.length) {
      const firstDiff = pixelFailed.find((row) => row.diff)?.diff;
      return err(
        'CONFLICT',
        `${problems.join('; ')}`,
        firstDiff
          ? `open ${firstDiff} and ${join(run.evidence, 'tablet.json')}. ludi screens check --target tablet --update-baselines if the pixels are intended`
          : `see ${join(run.evidence, 'tablet.json')}`,
      );
    }
    return ok(summary);
  } finally {
    if (closer) await closer().catch(() => {});
  }
}
