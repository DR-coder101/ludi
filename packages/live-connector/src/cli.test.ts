import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { parseLiveWatchArgs, validateLiveWatchArgs } from './cli.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function run(args: string[]) {
  return spawnSync('pnpm', ['exec', 'tsx', 'src/cli.ts', ...args], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env },
  });
}

describe('tiktok-watch CLI', () => {
  it('prints rich help', () => {
    const res = run(['tiktok-watch', '--help']);
    expect(res.status).toBe(0);
    expect(res.stdout).toContain('ludi live tiktok-watch --user');
    expect(res.stdout).toContain('user is not live: start a TikTok LIVE then rerun');
    expect(res.stdout).toContain('TIKTOK_SIGN_API_KEY');
  });

  it('tells the caller what to do when --user and --replay are missing', () => {
    const valid = validateLiveWatchArgs(parseLiveWatchArgs({}));
    expect(valid.ok).toBe(false);
    if (valid.ok) throw new Error('expected invalid args');
    expect(valid.message).toContain('Missing --user');
    expect(valid.hint).toBe('ludi live tiktok-watch --help');
  });

  it('replays pass.jsonl and prints the PASS line', () => {
    const res = run([
      'tiktok-watch',
      '--replay',
      join(root, 'testdata', 'pass.jsonl'),
      '--page',
      'false',
      '--json',
    ]);
    expect(res.status).toBe(0);
    expect(res.stdout).toContain('PASS p95=100ms threshold=2000ms samples=4');
    const verdict = res.stdout
      .trim()
      .split('\n')
      .map((line) => JSON.parse(line) as { kind?: string; pass?: boolean })
      .find((row) => row.kind === 'verdict');
    expect(verdict?.pass).toBe(true);
  });

  it('replays fail.jsonl and prints the FAIL line', () => {
    const res = run([
      'tiktok-watch',
      '--replay',
      join(root, 'testdata', 'fail.jsonl'),
      '--page',
      'false',
      '--json',
    ]);
    expect(res.status).toBe(5);
    expect(res.stdout).toContain('FAIL p95=3760ms threshold=2000ms samples=3');
  });
});
