import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Page } from 'playwright';
import { err, ok, planned, type Ctx, type Result } from '../command.js';
import { ensureRunDir, resolveRunDir } from '../runDir.js';
import { sleep } from '../defaults.js';
import { comparePng, type CompareResult } from './compare.js';
import { exportWeb } from './exportWeb.js';
import { serveExport } from './serve.js';
import { evaluateLayout, verdictFailsCi, type Box, type CheckResult, type LayoutSample } from './layout.js';
import {
  RULES_CLOSE_NAME,
  SIZE_VIEWPORTS,
  findRepoRoot,
  mobileDir,
  sizeBaselineDir,
  sizeShotsToRun,
  type ControlSpec,
  type SizeShot,
  type SizeViewportId,
} from './catalog.js';

type MeasuredControl = Box & { name: string; found: boolean };

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
}> {
  return page.evaluate(() => {
    const doc = document.documentElement;
    const body = document.body;
    return {
      scrollWidth: Math.max(doc.scrollWidth, body?.scrollWidth ?? 0),
      clientWidth: Math.max(doc.clientWidth, body?.clientWidth ?? 0),
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
    };
  });
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
          board: null,
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
  return planned(actions);
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
    try {
      captured = await captureSize({ baseUrl, shots, outDir: evidenceDir });
    } catch (e) {
      return err('UPSTREAM_ERROR', (e as Error).message, `ludi screens doctor --run-dir ${run.root} --output json`);
    }

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
        viewports: SIZE_VIEWPORTS,
        results: [],
        layout,
        evidence: evidenceDir,
      };
      writeFileSync(join(run.evidence, 'size.json'), JSON.stringify(summary, null, 2) + '\n');
      if (layoutCi.length) {
        return err(
          'CONFLICT',
          `${layoutCi.length} size layout check(s) failed CI: ${layoutCi.map(({ shot, check }) => ciLabel(shot, check)).join(', ')}`,
          `see ${join(run.evidence, 'size.json')}`,
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
      viewports: SIZE_VIEWPORTS,
      results,
      layout,
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
