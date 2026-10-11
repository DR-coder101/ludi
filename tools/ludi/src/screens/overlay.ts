import { spawn } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { err, ok, planned, type Ctx, type Result } from '../command.js';
import { ensureRunDir, resolveRunDir } from '../runDir.js';
import { sleep } from '../defaults.js';
import { comparePng, type CompareResult } from './compare.js';
import { serveExport } from './serve.js';
import {
  MAX_DIFF_RATIO,
  OVERLAY,
  OVERLAY_SCREEN_IDS,
  SAFE_ZONE,
  findRepoRoot,
  overlayBaselineDir,
  overlayDir,
  overlayScreensToRun,
  wonderDir,
  type OverlayScreenSpec,
} from './catalog.js';

export type SafeBox = {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  ok: boolean;
};

async function buildOverlay(opts: { app: string; dist: string; logPath: string }): Promise<void> {
  mkdirSync(opts.dist, { recursive: true });
  await new Promise<void>((resolve, reject) => {
    const child = spawn('pnpm', ['exec', 'vite', 'build', '--outDir', opts.dist], {
      cwd: opts.app,
      env: { ...process.env, CI: '1' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const chunks: Buffer[] = [];
    child.stdout?.on('data', (d: Buffer) => chunks.push(d));
    child.stderr?.on('data', (d: Buffer) => chunks.push(d));
    const timer = setTimeout(() => {
      child.kill('SIGTERM');
      reject(new Error(`vite build timed out after 180s; see ${opts.logPath}`));
    }, 180_000);
    child.on('error', (e) => {
      clearTimeout(timer);
      reject(e);
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      writeFileSync(opts.logPath, Buffer.concat(chunks));
      if (code === 0) resolve();
      else reject(new Error(`vite build exited ${code}; see ${opts.logPath}`));
    });
  });
  if (!existsSync(join(opts.dist, 'index.html'))) {
    throw new Error(`vite build wrote no index.html under ${opts.dist}`);
  }
}

async function captureOverlay(opts: {
  baseUrl: string;
  specs: OverlayScreenSpec[];
  outDir: string;
}): Promise<{ written: string[]; boxes: Record<string, SafeBox[]> }> {
  const { chromium } = await import('playwright');
  mkdirSync(opts.outDir, { recursive: true });
  const browser = await chromium.launch({
    args: ['--disable-dev-shm-usage', '--no-sandbox'],
  });
  const written: string[] = [];
  const boxes: Record<string, SafeBox[]> = {};
  try {
    const context = await browser.newContext({
      viewport: { width: OVERLAY.width, height: OVERLAY.height },
      deviceScaleFactor: OVERLAY.deviceScaleFactor,
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    page.setDefaultTimeout(30_000);
    for (const spec of opts.specs) {
      await page.goto(`${opts.baseUrl}${spec.path}`, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => document.fonts.status === 'loaded', null, { timeout: 10_000 }).catch(() => {});
      await page.getByRole(spec.waitFor.role, { name: spec.waitFor.name }).waitFor({ state: 'visible' });
      await sleep(400);
      const dest = join(opts.outDir, spec.file);
      await page.screenshot({ path: dest, fullPage: false, animations: 'disabled' });
      written.push(dest);
      boxes[spec.id] = await page.evaluate((zone) => {
        const canvas = document.querySelector('[data-overlay-root="1"]');
        const origin = canvas?.getBoundingClientRect();
        const ox = origin?.left ?? 0;
        const oy = origin?.top ?? 0;
        return [...document.querySelectorAll('[data-safe]')].map((el) => {
          const r = el.getBoundingClientRect();
          const x = r.x - ox;
          const y = r.y - oy;
          const width = r.width;
          const height = r.height;
          const ok =
            x >= zone.x0 &&
            y >= zone.y0 &&
            x + width <= zone.x1 &&
            y + height <= zone.y1;
          return { name: el.getAttribute('data-safe') ?? 'anon', x, y, width, height, ok };
        });
      }, SAFE_ZONE);
    }
    await context.close();
  } finally {
    await browser.close();
  }
  return { written, boxes };
}

export function planOverlayCheck(args: {
  screen: string;
  update: boolean;
  port: number;
  url?: string;
  runDir: string;
}): Result {
  const specs = overlayScreensToRun(args.screen);
  if (specs.length === 0) {
    return err(
      'INVALID_ARGS',
      `Unknown overlay --screen ${args.screen}`,
      `ludi screens check --help (known: overlay, ${OVERLAY_SCREEN_IDS.join(', ')})`,
    );
  }
  const root = findRepoRoot();
  const actions: unknown[] = [];
  if (!args.url) {
    actions.push({ action: 'vite_build_overlay', app: overlayDir(root), output_dir: join(args.runDir, 'overlay-dist') });
    actions.push({ action: 'serve', port: args.port, spa_fallback: true });
  } else {
    actions.push({ action: 'reuse_url', url: args.url });
  }
  for (const spec of specs) {
    actions.push({
      action: 'screenshot',
      screen: spec.id,
      path: spec.path,
      waitFor: spec.waitFor,
      viewport: OVERLAY,
    });
    actions.push(
      args.update
        ? { action: 'write_baseline', file: join(overlayBaselineDir(root), spec.file) }
        : { action: 'compare', baseline: join(overlayBaselineDir(root), spec.file) },
    );
    actions.push({ action: 'wonder_diff', wonder: join(wonderDir(root), spec.wonder, 'screenshot.png') });
  }
  return planned(actions);
}

export async function runOverlayCheck(
  args: Readonly<Record<string, unknown>>,
  ctx: Ctx,
): Promise<Result> {
  const screen = String(args.screen ?? 'overlay');
  const update = Boolean(args['update-baselines']);
  const port = Number(args.port);
  const specs = overlayScreensToRun(screen === 'all' ? 'overlay' : screen);
  if (specs.length === 0) {
    return err(
      'INVALID_ARGS',
      `Unknown overlay --screen ${screen}`,
      `ludi screens check --help (known: overlay, ${OVERLAY_SCREEN_IDS.join(', ')})`,
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
  const evidenceDir = join(run.evidence, 'overlay');
  mkdirSync(evidenceDir, { recursive: true });
  const baseDir = overlayBaselineDir(root);
  const wonderRoot = wonderDir(root);

  let baseUrl = ctx.url?.replace(/\/$/, '');
  let closer: (() => Promise<void>) | undefined;
  try {
    if (!baseUrl) {
      const dist = join(run.root, 'overlay-dist');
      try {
        await buildOverlay({
          app: overlayDir(root),
          dist,
          logPath: join(run.root, 'overlay-build.log'),
        });
      } catch (e) {
        return err(
          'UPSTREAM_ERROR',
          (e as Error).message,
          `Inspect ${join(run.root, 'overlay-build.log')}.`,
        );
      }
      const server = await serveExport(dist, port);
      closer = server.close;
      baseUrl = server.url;
    }

    let captured: { written: string[]; boxes: Record<string, SafeBox[]> };
    try {
      captured = await captureOverlay({ baseUrl, specs, outDir: evidenceDir });
    } catch (e) {
      return err(
        'UPSTREAM_ERROR',
        (e as Error).message,
        `ludi screens doctor --run-dir ${run.root} --output json`,
      );
    }

    if (update) {
      mkdirSync(baseDir, { recursive: true });
      const written = specs.map((spec) => {
        const dest = join(baseDir, spec.file);
        copyFileSync(join(evidenceDir, spec.file), dest);
        return dest;
      });
      const summary = {
        updated: written,
        viewport: OVERLAY,
        evidence: evidenceDir,
        safe_zone: captured.boxes,
      };
      writeFileSync(join(run.evidence, 'overlay.json'), JSON.stringify(summary, null, 2) + '\n');
      return ok(summary);
    }

    const results: CompareResult[] = specs.map((spec) =>
      comparePng({
        id: spec.id,
        actualPath: join(evidenceDir, spec.file),
        baselinePath: join(baseDir, spec.file),
        diffPath: join(evidenceDir, spec.file.replace(/\.png$/, '.diff.png')),
      }),
    );
    const wonder = specs.map((spec) =>
      comparePng({
        id: `${spec.id}-wonder`,
        actualPath: join(evidenceDir, spec.file),
        baselinePath: join(wonderRoot, spec.wonder, 'screenshot.png'),
        diffPath: join(evidenceDir, spec.file.replace(/\.png$/, '.wonder.diff.png')),
        maxDiffRatio: 1,
      }),
    );
    const safeFailed = Object.entries(captured.boxes).flatMap(([id, list]) =>
      list.filter((b) => !b.ok).map((b) => ({ id, ...b })),
    );
    const summary = {
      url: baseUrl,
      viewport: OVERLAY,
      results,
      wonder_diff: wonder.map((w) => ({
        id: w.id,
        pixels_differ: w.pixels_differ,
        diff_ratio: w.diff_ratio,
        percent: Number(((w.diff_ratio ?? 1) * 100).toFixed(2)),
        actual: w.actual,
        baseline: w.baseline,
      })),
      safe_zone: captured.boxes,
      evidence: evidenceDir,
      max_diff_ratio: MAX_DIFF_RATIO,
    };
    writeFileSync(join(run.evidence, 'overlay.json'), JSON.stringify(summary, null, 2) + '\n');
    const failed = results.filter((r) => !r.ok);
    if (failed.length) {
      const first = failed[0]!;
      return err(
        'CONFLICT',
        `${failed.length} overlay screen(s) drifted: ${failed.map((f) => f.id).join(', ')}`,
        first.diff
          ? `open ${first.diff} then ludi screens check --target overlay --update-baselines if the change is intended`
          : `ludi screens check --target overlay --update-baselines --run-dir ${run.root}`,
      );
    }
    if (safeFailed.length) {
      return err(
        'CONFLICT',
        `${safeFailed.length} overlay element(s) sit outside x 100-980 y 40-1380`,
        `see ${join(run.evidence, 'overlay.json')} safe_zone`,
      );
    }
    return ok(summary);
  } finally {
    if (closer) await closer().catch(() => {});
  }
}
