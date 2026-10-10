import { describe, it, expect } from 'vitest';
import { mkdtempSync, writeFileSync, existsSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PNG } from 'pngjs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { ExitCode } from '../src/exit.js';
import { SCREENS, screensToRun, PHONE, findRepoRoot } from '../src/screens/catalog.js';
import { comparePng } from '../src/screens/compare.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function run(args: string[]) {
  return spawnSync('pnpm', ['exec', 'tsx', 'src/cli.ts', ...args], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, LUDI_RUN_DIR: join(root, '.tmp-test-run') },
  });
}

function pngBuffer(width: number, height: number, fill: [number, number, number, number]): Buffer {
  const img = new PNG({ width, height });
  for (let i = 0; i < img.data.length; i += 4) {
    img.data[i] = fill[0];
    img.data[i + 1] = fill[1];
    img.data[i + 2] = fill[2];
    img.data[i + 3] = fill[3];
  }
  return PNG.sync.write(img);
}

describe('screen catalog', () => {
  it('names the rebuilt screens and the phone viewport', () => {
    expect(SCREENS.map((s) => s.id)).toEqual(['home', 'lobby', 'board-start', 'board-video', 'win']);
    expect(screensToRun('all')).toHaveLength(5);
    expect(screensToRun('board-start')[0]?.path).toBe('/dev/board?state=start');
    expect(screensToRun('board-video')[0]?.path).toBe('/dev/board?state=video');
    expect(PHONE).toEqual({ width: 390, height: 844, deviceScaleFactor: 2 });
  });

  it('keeps iPhone 14 web insets on every /dev fixture the 390×844 capture assumes', () => {
    const dir = join(findRepoRoot(), 'apps', 'mobile', 'app', 'dev');
    for (const file of ['home.tsx', 'lobby.tsx', 'board.tsx', 'win.tsx'] as const) {
      const src = readFileSync(join(dir, file), 'utf8');
      expect(src).toContain('const PHONE_INSETS = { top: 47, bottom: 34 };');
      expect(src).toContain("insets={Platform.OS === 'web' ? PHONE_INSETS : undefined}");
    }
  });
});

describe('comparePng', () => {
  it('passes identical images and writes a diff when they drift', () => {
    const dir = mkdtempSync(join(tmpdir(), 'ludi-screens-'));
    const a = join(dir, 'a.png');
    const b = join(dir, 'b.png');
    const c = join(dir, 'c.png');
    const diff = join(dir, 'd.png');
    writeFileSync(a, pngBuffer(8, 8, [10, 20, 30, 255]));
    writeFileSync(b, pngBuffer(8, 8, [10, 20, 30, 255]));
    writeFileSync(c, pngBuffer(8, 8, [200, 0, 0, 255]));
    const same = comparePng({
      id: 'home',
      actualPath: a,
      baselinePath: b,
      diffPath: diff,
    });
    expect(same.ok).toBe(true);
    expect(same.diff).toBeNull();
    expect(existsSync(diff)).toBe(false);
    const drift = comparePng({
      id: 'home',
      actualPath: a,
      baselinePath: c,
      diffPath: diff,
    });
    expect(drift.ok).toBe(false);
    expect(drift.diff).toBe(diff);
    expect(existsSync(diff)).toBe(true);
    rmSync(dir, { recursive: true, force: true });
  });
});

describe('ludi screens CLI', () => {
  it('root help lists screens and not a second binary', () => {
    const res = run(['--help']);
    expect(res.status).toBe(0);
    expect(res.stdout).toContain('screens');
    expect(res.stdout).not.toContain('ludi-verify');
  });

  it('check dry-run exits 9 and plans expo export plus five captures', () => {
    const runDir = join(root, '.tmp-screens-dry');
    rmSync(runDir, { recursive: true, force: true });
    const res = run([
      'screens',
      'check',
      '--dry-run',
      '--output',
      'json',
      '--run-dir',
      runDir,
    ]);
    expect(res.status).toBe(ExitCode.DRY_RUN);
    const body = JSON.parse(res.stdout);
    expect(body.ok).toBe(true);
    expect(body.command).toBe('ludi.screens.check');
    const actions = body.planned_actions as Array<{ action: string; screen?: string }>;
    expect(actions[0]?.action).toBe('expo_export_web');
    expect(actions.filter((a) => a.action === 'screenshot').map((a) => a.screen)).toEqual([
      'home',
      'lobby',
      'board-start',
      'board-video',
      'win',
    ]);
    expect(existsSync(join(runDir, 'web-dist'))).toBe(false);
  });

  it('check --url dry-run skips export', () => {
    const res = run([
      'screens',
      'check',
      '--url',
      'http://127.0.0.1:4173',
      '--screen',
      'home',
      '--dry-run',
      '--output',
      'json',
    ]);
    expect(res.status).toBe(ExitCode.DRY_RUN);
    const body = JSON.parse(res.stdout);
    const actions = body.planned_actions as Array<{ action: string }>;
    expect(actions[0]?.action).toBe('reuse_url');
    expect(actions.some((a) => a.action === 'expo_export_web')).toBe(false);
  });
});
