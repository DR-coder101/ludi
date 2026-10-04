import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { ExitCode } from '../src/exit.js';
import { buildIntrospectFromRegistry } from '../src/introspect.js';
import { registry } from '../src/registry.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function run(args: string[], env: Record<string, string> = {}) {
  return spawnSync('pnpm', ['exec', 'tsx', 'src/cli.ts', ...args], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, LUDI_RUN_DIR: join(root, '.tmp-test-run'), ...env },
  });
}

describe('ludi CLI', () => {
  it('root help lists modules and never names a second binary', () => {
    const res = run(['--help']);
    expect(res.status).toBe(0);
    expect(res.stdout).toMatch(/^Drive the Ludi server|^ludi |Agent|Drive/i);
    expect(res.stdout).toContain('doctor');
    expect(res.stdout).toContain('play');
    expect(res.stdout).not.toContain('solo-vs-bots');
    expect(res.stdout).not.toContain('ludi-verify');
    expect(res.stdout).not.toContain('verify-ludi');
  });

  it('introspect names the binary ludi', () => {
    const tree = buildIntrospectFromRegistry(registry);
    expect(tree.name).toBe('ludi');
    expect(tree.commands.some((c) => (c as { name: string }).name === 'play')).toBe(true);
  });

  it('mutating dry-run exits 9 and changes nothing', () => {
    const runDir = join(root, '.tmp-dry-run');
    rmSync(runDir, { recursive: true, force: true });
    const res = run(['play', 'solo-vs-bots', '--dry-run', '--output', 'json', '--run-dir', runDir]);
    expect(res.status).toBe(ExitCode.DRY_RUN);
    const body = JSON.parse(res.stdout);
    expect(body.ok).toBe(true);
    expect(body.dry_run).toBe(true);
    expect(body.command).toBe('ludi.play.solo-vs-bots');
    expect(Array.isArray(body.planned_actions)).toBe(true);
    expect(existsSync(join(runDir, 'server.json'))).toBe(false);
    expect(existsSync(join(runDir, 'evidence', 'solo-vs-bots.json'))).toBe(false);
  });

  it('JSON error names the next ludi command', () => {
    const res = run(['room', 'seat', '--output', 'json']);
    expect(res.status).toBe(ExitCode.INVALID_ARGS);
    const body = JSON.parse(res.stdout);
    expect(body.ok).toBe(false);
    expect(body.error.hint).toMatch(/^ludi /);
  });
});
