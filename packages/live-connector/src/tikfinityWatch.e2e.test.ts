import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { startFakeTikfinity } from './fakeTikfinityServer.js';
import { runWatch } from './harness.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const tsxCli = require.resolve('tsx/cli');

describe('tiktok-watch against a fake TikFinity socket', () => {
  it('records gifts without turning them into commands or lag samples', async () => {
    const server = await startFakeTikfinity();
    const gifts: string[] = [];
    const watch = runWatch({
      source: 'tikfinity',
      url: server.url,
      servePage: false,
      durationMs: 400,
      onEvent: (event) => {
        if (event.kind === 'gift') gifts.push(event.giftName);
      },
    });
    await new Promise((resolve) => setTimeout(resolve, 80));
    server.send({
      event: 'gift',
      data: { giftName: 'Rose', uniqueId: 'fan', nickname: 'Fan', repeatCount: 3, repeatEnd: true },
    });
    const result = await watch;
    expect(gifts).toEqual(['Rose']);
    expect(result.commands).toEqual([]);
    expect(result.verdict.line).toBe('FAIL p95=n/a threshold=2000ms samples=0');
    await server.stop();
  });

  it('prints PASS when the fake LIVE sends !join with createTime', async () => {
    const server = await startFakeTikfinity();
    const started = Date.now();
    const watch = runWatch({
      source: 'tikfinity',
      url: server.url,
      servePage: false,
      durationMs: 800,
    });
    await new Promise((resolve) => setTimeout(resolve, 80));
    for (const offset of [40, 80, 120, 160]) {
      server.send({
        event: 'chat',
        data: {
          comment: '!join',
          userId: `u${offset}`,
          uniqueId: `user${offset}`,
          nickname: `Viewer${offset}`,
          createTime: String(started + offset),
        },
      });
    }
    const result = await watch;
    expect(result.verdict.pass).toBe(true);
    expect(result.verdict.lagKind).toBe('platform');
    expect(result.verdict.line).toMatch(/^PASS p95=\d+ms threshold=2000ms samples=4$/);
    expect(result.commands).toHaveLength(4);
    await server.stop();
  });

  it('runs the tiktok-watch CLI against the fake socket and exits 0', async () => {
    const server = await startFakeTikfinity();
    const started = Date.now();
    const child = spawn(
      process.execPath,
      [
        tsxCli,
        'src/cli.ts',
        'tiktok-watch',
        '--source',
        'tikfinity',
        '--url',
        server.url,
        '--duration-s',
        '3',
        '--page',
        'false',
        '--json',
      ],
      { cwd: root, env: { ...process.env } },
    );
    let stdout = '';
    let sent = false;
    const sendJoins = () => {
      if (sent) return;
      sent = true;
      for (const offset of [20, 40, 60, 80]) {
        server.send({
          event: 'chat',
          data: {
            comment: '!join',
            uniqueId: `cli${offset}`,
            nickname: `Cli${offset}`,
            createTime: String(started + offset),
          },
        });
      }
    };
    child.stdout.on('data', (chunk) => {
      stdout += String(chunk);
      if (stdout.includes('TikFinity running but not connected')) sendJoins();
    });
    const code = await new Promise<number>((resolve, reject) => {
      child.on('error', reject);
      child.on('exit', (value) => resolve(value ?? 1));
    });
    await server.stop();
    expect(code).toBe(0);
    expect(stdout).toMatch(/PASS p95=\d+ms threshold=2000ms samples=4/);
  });
});
