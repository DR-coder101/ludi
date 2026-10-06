import { spawn } from 'node:child_process';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { err, ok, planned, type Ctx, type Result } from '../command.js';
import { ensureRunDir, resolveRunDir } from '../runDir.js';
import { sleep } from '../defaults.js';
import {
  findRepoRoot,
  mobileDir,
  PHONE,
  SCREEN_IDS,
  screensToRun,
  webBaselineDir,
  type ScreenSpec,
} from './catalog.js';
import { comparePng, type CompareResult } from './compare.js';
import { serveExport } from './serve.js';

function fail(code: string, message: string, hint: string): Result {
  return err(code, message, hint);
}

async function exportWeb(opts: {
  mobile: string;
  dist: string;
  logPath: string;
}): Promise<void> {
  mkdirSync(opts.dist, { recursive: true });
  await new Promise<void>((resolve, reject) => {
    const child = spawn(
      'pnpm',
      ['exec', 'expo', 'export', '--platform', 'web', '--output-dir', opts.dist],
      {
        cwd: opts.mobile,
        env: {
          ...process.env,
          CI: '1',
          EXPO_NO_TELEMETRY: '1',
          EXPO_PUBLIC_DEV_ROUTES: '1',
        },
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    );
    const chunks: Buffer[] = [];
    child.stdout?.on('data', (d: Buffer) => chunks.push(d));
    child.stderr?.on('data', (d: Buffer) => chunks.push(d));
    const timer = setTimeout(() => {
      child.kill('SIGTERM');
      reject(new Error(`expo export timed out after 180s; see ${opts.logPath}`));
    }, 180_000);
    child.on('error', (e) => {
      clearTimeout(timer);
      reject(e);
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      writeFileSync(opts.logPath, Buffer.concat(chunks));
      if (code === 0) resolve();
      else reject(new Error(`expo export exited ${code}; see ${opts.logPath}`));
    });
  });
  if (!existsSync(join(opts.dist, 'index.html'))) {
    throw new Error(`expo export wrote no index.html under ${opts.dist}`);
  }
}

async function captureScreens(opts: {
  baseUrl: string;
  specs: ScreenSpec[];
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
      viewport: { width: PHONE.width, height: PHONE.height },
      deviceScaleFactor: PHONE.deviceScaleFactor,
      reducedMotion: 'reduce',
      colorScheme: 'dark',
    });
    const page = await context.newPage();
    page.setDefaultTimeout(30_000);
    for (const spec of opts.specs) {
      const url = `${opts.baseUrl}${spec.path}`;
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => document.fonts.status === 'loaded', null, { timeout: 10_000 }).catch(() => {});
      await page.getByRole(spec.waitFor.role, { name: spec.waitFor.name }).waitFor({
        state: 'visible',
      });
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

export function planScreensCheck(args: {
  screen: string;
  update: boolean;
  port: number;
  url?: string;
  runDir: string;
}): Result {
  const specs = screensToRun(args.screen);
  if (specs.length === 0) {
    return fail(
      'INVALID_ARGS',
      `Unknown --screen ${args.screen}`,
      `ludi screens check --help (known: all, ${SCREEN_IDS.join(', ')})`,
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
  for (const spec of specs) {
    actions.push({
      action: 'screenshot',
      screen: spec.id,
      path: spec.path,
      waitFor: spec.waitFor,
      viewport: PHONE,
    });
    actions.push(
      args.update
        ? { action: 'write_baseline', file: join(webBaselineDir(root), spec.file) }
        : { action: 'compare', baseline: join(webBaselineDir(root), spec.file) },
    );
  }
  return planned(actions);
}

export async function runScreensDoctor(ctx: Ctx): Promise<Result> {
  const checks: Array<{ name: string; ok: boolean; detail: string }> = [];
  let root: string;
  try {
    root = findRepoRoot();
    checks.push({ name: 'repo_root', ok: true, detail: root });
  } catch (e) {
    return fail(
      'PRECONDITION_FAILED',
      (e as Error).message,
      (e as Error & { hint?: string }).hint ?? 'pnpm install from the monorepo root',
    );
  }
  const mobile = mobileDir(root);
  checks.push({
    name: 'mobile_app',
    ok: existsSync(join(mobile, 'package.json')),
    detail: existsSync(join(mobile, 'app', 'dev', 'board.tsx'))
      ? `${mobile} has /dev fixture routes`
      : `${mobile} is missing app/dev fixture routes`,
  });
  const webDir = webBaselineDir(root);
  const baselineCount = screensToRun('all').filter((s) => existsSync(join(webDir, s.file))).length;
  checks.push({
    name: 'web_baselines',
    ok: baselineCount === SCREEN_IDS.length,
    detail: `${baselineCount}/${SCREEN_IDS.length} under ${webDir}`,
  });
  let chromiumOk = false;
  let chromiumDetail = 'playwright not loaded';
  try {
    const { chromium } = await import('playwright');
    const exe = chromium.executablePath();
    chromiumOk = existsSync(exe);
    chromiumDetail = chromiumOk
      ? exe
      : `Chromium missing at ${exe}. Run: pnpm --dir tools/ludi exec playwright install chromium`;
  } catch (e) {
    chromiumOk = false;
    chromiumDetail = `Cannot import playwright (${(e as Error).message}). Run pnpm install.`;
  }
  checks.push({ name: 'chromium', ok: chromiumOk, detail: chromiumDetail });
  const worthDriving = checks.filter((c) => c.name !== 'web_baselines').every((c) => c.ok);
  if (!worthDriving) {
    return fail(
      'PRECONDITION_FAILED',
      'Screens doctor refused to drive this instance',
      chromiumOk
        ? `ls ${mobile}/app/dev`
        : 'pnpm --dir tools/ludi exec playwright install chromium',
    );
  }
  return ok({
    worth_driving: worthDriving,
    baselines_complete: baselineCount === SCREEN_IDS.length,
    run_dir: ctx.runDir,
    checks,
  });
}

export async function runScreensCheck(
  args: Readonly<Record<string, unknown>>,
  ctx: Ctx,
): Promise<Result> {
  const screen = String(args.screen ?? 'all');
  const update = Boolean(args['update-baselines']);
  const port = Number(args.port);
  const specs = screensToRun(screen);
  if (specs.length === 0) {
    return fail(
      'INVALID_ARGS',
      `Unknown --screen ${screen}`,
      `ludi screens check --help (known: all, ${SCREEN_IDS.join(', ')})`,
    );
  }

  let root: string;
  try {
    root = findRepoRoot();
  } catch (e) {
    return fail(
      'PRECONDITION_FAILED',
      (e as Error).message,
      (e as Error & { hint?: string }).hint ?? 'Run from the ludi monorepo',
    );
  }

  const run = resolveRunDir(ctx.runDir);
  ensureRunDir(run);
  const evidenceDir = join(run.evidence, 'screens');
  mkdirSync(evidenceDir, { recursive: true });
  const webDir = webBaselineDir(root);

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
        return fail(
          'UPSTREAM_ERROR',
          (e as Error).message,
          `Inspect ${join(run.root, 'expo-export.log')}. Need EXPO_PUBLIC_DEV_ROUTES=1 on the web export.`,
        );
      }
      const server = await serveExport(dist, port);
      closer = server.close;
      baseUrl = server.url;
    }

    try {
      await captureScreens({ baseUrl, specs, outDir: evidenceDir });
    } catch (e) {
      return fail(
        'UPSTREAM_ERROR',
        (e as Error).message,
        `ludi screens doctor --run-dir ${run.root} --output json`,
      );
    }

    if (update) {
      mkdirSync(webDir, { recursive: true });
      const written = specs.map((spec) => {
        const dest = join(webDir, spec.file);
        copyFileSync(join(evidenceDir, spec.file), dest);
        return dest;
      });
      const summary = {
        updated: written,
        note: 'Machine baselines are Chromium + Expo web at 390×844 @2x. They are not the emulator PNGs under baselines/emulator/.',
        evidence: evidenceDir,
      };
      writeFileSync(join(run.evidence, 'screens.json'), JSON.stringify(summary, null, 2) + '\n');
      return ok(summary);
    }

    const results: CompareResult[] = specs.map((spec) =>
      comparePng({
        id: spec.id,
        actualPath: join(evidenceDir, spec.file),
        baselinePath: join(webDir, spec.file),
        diffPath: join(evidenceDir, spec.file.replace(/\.png$/, '.diff.png')),
      }),
    );
    const summary = {
      url: baseUrl,
      viewport: PHONE,
      results,
      evidence: evidenceDir,
      note: 'Compare against baselines/web (Expo web / Chromium). baselines/emulator is human context only.',
    };
    writeFileSync(join(run.evidence, 'screens.json'), JSON.stringify(summary, null, 2) + '\n');
    const failed = results.filter((r) => !r.ok);
    if (failed.length) {
      const first = failed[0]!;
      return fail(
        'CONFLICT',
        `${failed.length} screen(s) drifted: ${failed.map((f) => f.id).join(', ')}`,
        first.diff
          ? `open ${first.diff} then ludi screens check --update-baselines if the change is intended`
          : `ludi screens check --update-baselines --run-dir ${run.root}`,
      );
    }
    return ok(summary);
  } finally {
    if (closer) await closer().catch(() => {});
  }
}
