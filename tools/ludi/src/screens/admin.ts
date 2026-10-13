import { spawn } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { err, ok, planned, type Ctx, type Result } from '../command.js';
import { ensureRunDir, resolveRunDir } from '../runDir.js';
import { sleep } from '../defaults.js';
import { comparePng, type CompareResult } from './compare.js';
import { serveExport } from './serve.js';
import {
  ADMIN_SCREEN_IDS,
  adminBaselineDir,
  adminDir,
  adminMockupDir,
  adminScreensToRun,
  findRepoRoot,
  MAX_DIFF_RATIO,
  type AdminScreenSpec,
} from './catalog.js';

async function buildAdmin(opts: { app: string; dist: string; logPath: string }): Promise<void> {
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

async function captureAdmin(opts: {
  baseUrl: string;
  specs: AdminScreenSpec[];
  outDir: string;
}): Promise<string[]> {
  const { chromium } = await import('playwright');
  mkdirSync(opts.outDir, { recursive: true });
  const browser = await chromium.launch({
    args: ['--disable-dev-shm-usage', '--no-sandbox'],
  });
  const written: string[] = [];
  try {
    const context = await browser.newContext({
      viewport: opts.specs[0]?.viewport ?? { width: 1024, height: 640 },
      deviceScaleFactor: 1,
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    page.setDefaultTimeout(30_000);
    for (const spec of opts.specs) {
      await page.setViewportSize(spec.viewport);
      await page.goto(`${opts.baseUrl}${spec.path}`, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => document.fonts.status === 'loaded', null, { timeout: 10_000 }).catch(() => {});
      await page.locator(`[data-screen="${spec.id}"]`).waitFor({ state: 'visible' });
      await page.getByRole(spec.waitFor.role, { name: spec.waitFor.name }).waitFor({ state: 'visible' });
      await sleep(400);
      const dest = join(opts.outDir, spec.file);
      await page.screenshot({ path: dest, fullPage: false, animations: 'disabled' });
      written.push(dest);
    }
    await context.close();
  } finally {
    await browser.close();
  }
  return written;
}

export function planAdminCheck(args: {
  screen: string;
  update: boolean;
  port: number;
  url?: string;
  runDir: string;
}): Result {
  const specs = adminScreensToRun(args.screen);
  if (specs.length === 0) {
    return err(
      'INVALID_ARGS',
      `Unknown admin --screen ${args.screen}`,
      `ludi screens check --help (known: admin, ${ADMIN_SCREEN_IDS.join(', ')})`,
    );
  }
  const root = findRepoRoot();
  const actions: unknown[] = [];
  if (!args.url) {
    actions.push({ action: 'vite_build_admin', app: adminDir(root), output_dir: join(args.runDir, 'admin-dist') });
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
      viewport: spec.viewport,
    });
    actions.push(
      args.update
        ? { action: 'write_baseline', file: join(adminBaselineDir(root), spec.file) }
        : { action: 'compare', baseline: join(adminBaselineDir(root), spec.file) },
    );
    actions.push({ action: 'mockup_diff', mockup: join(adminMockupDir(root), spec.mockup) });
  }
  return planned(actions);
}

export async function runAdminCheck(
  args: Readonly<Record<string, unknown>>,
  ctx: Ctx,
): Promise<Result> {
  const screen = String(args.screen ?? 'admin');
  const update = Boolean(args['update-baselines']);
  const port = Number(args.port);
  const specs = adminScreensToRun(screen === 'all' ? 'admin' : screen);
  if (specs.length === 0) {
    return err(
      'INVALID_ARGS',
      `Unknown admin --screen ${screen}`,
      `ludi screens check --help (known: admin, ${ADMIN_SCREEN_IDS.join(', ')})`,
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
  const evidenceDir = join(run.evidence, 'admin');
  mkdirSync(evidenceDir, { recursive: true });
  const baseDir = adminBaselineDir(root);
  const mockupRoot = adminMockupDir(root);

  let baseUrl = ctx.url?.replace(/\/$/, '');
  let closer: (() => Promise<void>) | undefined;
  try {
    if (!baseUrl) {
      const dist = join(run.root, 'admin-dist');
      try {
        await buildAdmin({
          app: adminDir(root),
          dist,
          logPath: join(run.root, 'admin-build.log'),
        });
      } catch (e) {
        return err(
          'UPSTREAM_ERROR',
          (e as Error).message,
          `Inspect ${join(run.root, 'admin-build.log')}.`,
        );
      }
      const server = await serveExport(dist, port);
      closer = server.close;
      baseUrl = server.url;
    }

    try {
      await captureAdmin({ baseUrl, specs, outDir: evidenceDir });
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
        evidence: evidenceDir,
      };
      writeFileSync(join(run.evidence, 'admin.json'), JSON.stringify(summary, null, 2) + '\n');
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
    const mockup = specs.map((spec) =>
      comparePng({
        id: `${spec.id}-mockup`,
        actualPath: join(evidenceDir, spec.file),
        baselinePath: join(mockupRoot, spec.mockup),
        diffPath: join(evidenceDir, spec.file.replace(/\.png$/, '.mockup.diff.png')),
        maxDiffRatio: 1,
        writeDiff: true,
      }),
    );
    const summary = {
      url: baseUrl,
      results,
      mockup_diff: mockup.map((w) => ({
        id: w.id,
        pixels_differ: w.pixels_differ,
        diff_ratio: w.diff_ratio,
        percent: Number(((w.diff_ratio ?? 1) * 100).toFixed(2)),
        actual: w.actual,
        baseline: w.baseline,
        reason: w.reason,
      })),
      evidence: evidenceDir,
      max_diff_ratio: MAX_DIFF_RATIO,
    };
    writeFileSync(join(run.evidence, 'admin.json'), JSON.stringify(summary, null, 2) + '\n');
    const failed = results.filter((r) => !r.ok);
    if (failed.length) {
      const first = failed[0]!;
      return err(
        'CONFLICT',
        `${failed.length} admin screen(s) drifted: ${failed.map((f) => f.id).join(', ')}`,
        first.diff
          ? `open ${first.diff} then ludi screens check --target admin --update-baselines if the change is intended`
          : `ludi screens check --target admin --update-baselines --run-dir ${run.root}`,
      );
    }
    return ok(summary);
  } finally {
    if (closer) await closer().catch(() => {});
  }
}
