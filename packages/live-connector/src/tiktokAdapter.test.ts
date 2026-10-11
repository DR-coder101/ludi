import { spawn, type ChildProcess } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { createTikTokAdapter } from './tiktokAdapter.js';
import { STATUS_REASON, type ConnectionStatus } from './types.js';

function spawnScript(source: string): ChildProcess {
  return spawn(process.execPath, ['-e', source], { stdio: ['pipe', 'pipe', 'pipe'] });
}

async function waitFor(
  statuses: ConnectionStatus[],
  phase: ConnectionStatus['phase'],
  timeoutMs = 2000,
): Promise<ConnectionStatus> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const hit = statuses.find((row) => row.phase === phase);
    if (hit) return hit;
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  throw new Error(`timed out waiting for ${phase}: ${JSON.stringify(statuses)}`);
}

describe('tiktok adapter supervisor', () => {
  it('surfaces stream offline and does not keep reconnecting', async () => {
    const statuses: ConnectionStatus[] = [];
    const adapter = createTikTokAdapter({
      uniqueId: 'someone',
      spawnWorker: () =>
        spawnScript(`
          process.stdout.write(JSON.stringify({
            type: 'status',
            phase: 'error',
            reason: ${JSON.stringify(STATUS_REASON.STREAM_OFFLINE)}
          }) + '\\n');
          process.exit(8);
        `),
    });
    adapter.onStatus((status) => statuses.push(status));
    await adapter.connect();
    const error = await waitFor(statuses, 'error');
    expect(error.reason).toBe(STATUS_REASON.STREAM_OFFLINE);
    await new Promise((resolve) => setTimeout(resolve, 80));
    expect(statuses.filter((row) => row.phase === 'reconnecting')).toEqual([]);
    await adapter.disconnect();
  });

  it('reconnects after a worker crash using the fake clock', async () => {
    let now = 0;
    let sleeps = 0;
    const clock = {
      now: () => now,
      random: () => 0.5,
      async sleep(ms: number) {
        sleeps += 1;
        now += ms;
      },
    };
    let spawns = 0;
    const statuses: ConnectionStatus[] = [];
    const adapter = createTikTokAdapter({
      uniqueId: 'someone',
      clock,
      backoff: { initialMs: 100, maxMs: 100, jitter: 0 },
      spawnWorker: () => {
        spawns += 1;
        if (spawns === 1) {
          return spawnScript('process.exit(1)');
        }
        return spawnScript(`
          process.stdout.write(JSON.stringify({ type: 'status', phase: 'connected' }) + '\\n');
          setInterval(() => {}, 1000);
        `);
      },
    });
    adapter.onStatus((status) => statuses.push(status));
    await adapter.connect();
    const connected = await waitFor(statuses, 'connected', 4000);
    expect(connected.phase).toBe('connected');
    expect(spawns).toBeGreaterThanOrEqual(2);
    expect(sleeps).toBeGreaterThanOrEqual(1);
    expect(statuses.some((row) => row.phase === 'reconnecting')).toBe(true);
    await adapter.disconnect();
  });
});
