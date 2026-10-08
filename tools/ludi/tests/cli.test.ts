import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
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
    expect(tree.commands.some((c) => (c as { name: string }).name === 'screens')).toBe(true);
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

  it('introspect JSON includes house-rules and matches', () => {
    const res = run(['introspect', '--output', 'json']);
    expect(res.status).toBe(0);
    const body = JSON.parse(res.stdout);
    expect(body.ok).toBe(true);
    expect(body.command).toBe('ludi.introspect');
    const room = body.data.commands.find((c: { name: string }) => c.name === 'room');
    const http = body.data.commands.find((c: { name: string }) => c.name === 'http');
    const roomNames = room.subcommands.map((c: { name: string }) => c.name);
    const httpNames = http.subcommands.map((c: { name: string }) => c.name);
    expect(roomNames).toContain('house-rules');
    expect(httpNames).toContain('matches');
    expect(res.stdout).toContain('"name": "house-rules"');
    expect(res.stdout).toContain('"name": "matches"');
  });

  it('house-rules dry-run exits 9 and plans updateHouseRules', () => {
    const runDir = join(root, '.tmp-house-rules-dry');
    rmSync(runDir, { recursive: true, force: true });
    const res = run([
      'room',
      'house-rules',
      '--extra-roll-on-capture',
      'true',
      '--dry-run',
      '--output',
      'json',
      '--run-dir',
      runDir,
    ]);
    expect(res.status).toBe(ExitCode.DRY_RUN);
    const body = JSON.parse(res.stdout);
    expect(body.ok).toBe(true);
    expect(body.dry_run).toBe(true);
    expect(body.command).toBe('ludi.room.house-rules');
    expect(body.planned_actions).toEqual([
      {
        action: 'room.updateHouseRules',
        args: { extraRollOnCapture: true, blockadeCanMoveTogether: false },
      },
    ]);
    expect(existsSync(runDir)).toBe(false);
  });

  it('house-rules with no toggle flags is INVALID_ARGS', () => {
    const res = run(['room', 'house-rules', '--output', 'json']);
    expect(res.status).toBe(ExitCode.INVALID_ARGS);
    const body = JSON.parse(res.stdout);
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('INVALID_ARGS');
    expect(body.error.hint).toMatch(/^ludi /);
  });

  it('rejects blockadeCanMoveTogether as an unknown house-rules flag', () => {
    const res = run([
      'room',
      'house-rules',
      '--blockade-can-move-together',
      'true',
      '--output',
      'json',
    ]);
    expect(res.status).toBe(ExitCode.INVALID_ARGS);
    const body = JSON.parse(res.stdout);
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('INVALID_ARGS');
    expect(body.error.message).toBe('Unknown option --blockade-can-move-together');
    expect(body.error.hint).toMatch(/^ludi /);
  });

  it('http matches requires --user-id', () => {
    const res = run(['http', 'matches', '--output', 'json']);
    expect(res.status).toBe(ExitCode.INVALID_ARGS);
    const body = JSON.parse(res.stdout);
    expect(body.ok).toBe(false);
    expect(body.error.message).toBe('Missing required option --user-id');
    expect(body.error.hint).toMatch(/^ludi /);
  });

  it('room join help names --session-token', () => {
    const res = run(['room', 'join', '--help']);
    expect(res.status).toBe(0);
    expect(res.stdout).toContain('session-token');
  });

  it('auth guest help says to run before session open', () => {
    const res = run(['auth', 'guest', '--help']);
    expect(res.status).toBe(0);
    expect(res.stdout).toContain('guest');
    expect(res.stdout).toContain('access');
    expect(res.stdout).toContain('Run before session open');
    expect(res.stdout).toContain('Verifier');
  });

  it('auth guest dry-run exits 9 and does not write session.json', () => {
    const runDir = join(root, '.tmp-auth-guest-dry');
    rmSync(runDir, { recursive: true, force: true });
    const res = run([
      'auth',
      'guest',
      '--dry-run',
      '--output',
      'json',
      '--run-dir',
      runDir,
      '--url',
      'http://127.0.0.1:9',
    ]);
    expect(res.status).toBe(ExitCode.DRY_RUN);
    const body = JSON.parse(res.stdout);
    expect(body.ok).toBe(true);
    expect(body.dry_run).toBe(true);
    expect(body.command).toBe('ludi.auth.guest');
    expect(body.planned_actions).toEqual([
      {
        action: 'POST',
        url: 'http://127.0.0.1:9/auth/guest',
        body: { displayName: 'Verifier' },
      },
      {
        action: 'write',
        path: join(runDir, 'session.json'),
        fields: ['auth_user_id', 'access_token'],
      },
    ]);
    expect(existsSync(join(runDir, 'session.json'))).toBe(false);
  });

  it('auth guest fails when the run-dir bridge is alive', () => {
    const runDir = join(root, '.tmp-auth-guest-bridge');
    rmSync(runDir, { recursive: true, force: true });
    mkdirSync(runDir, { recursive: true });
    writeFileSync(
      join(runDir, 'bridge.json'),
      JSON.stringify({ port: 1, pid: process.pid }) + '\n',
    );
    const res = run([
      'auth',
      'guest',
      '--output',
      'json',
      '--run-dir',
      runDir,
      '--url',
      'http://127.0.0.1:9',
    ]);
    expect(res.status).toBe(ExitCode.PRECONDITION_FAILED);
    const body = JSON.parse(res.stdout);
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('PRECONDITION_FAILED');
    expect(body.error.hint).toBe(`ludi session close --run-dir ${runDir}`);
    rmSync(runDir, { recursive: true, force: true });
  });

  it('introspect JSON includes auth.guest', () => {
    const res = run(['introspect', '--output', 'json']);
    expect(res.status).toBe(0);
    const body = JSON.parse(res.stdout);
    const auth = body.data.commands.find((c: { name: string }) => c.name === 'auth');
    const names = auth.subcommands.map((c: { name: string }) => c.name);
    expect(names).toContain('guest');
    expect(res.stdout).toContain('"name": "guest"');
  });
});
