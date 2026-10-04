import { spawn } from 'node:child_process';
import { writeFileSync, openSync, closeSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  clearBridge,
  clearServer,
  readBridge,
  readServer,
  resolveRunDir,
  writeBridge,
  writeServer,
  type RunDir,
} from './runDir.js';
import { sleep } from './defaults.js';

const here = dirname(fileURLToPath(import.meta.url));
const packageRoot = join(here, '..');

export async function startServerProcess(opts: {
  runDir?: string;
  port: number;
  graceMs: number;
  aiDelayMs: number;
}): Promise<{ run: RunDir; meta: ReturnType<typeof readServer> }> {
  const run = resolveRunDir(opts.runDir);
  const existing = readServer(run);
  if (existing && isPidAlive(existing.pid)) {
    throw Object.assign(
      new Error(`A Ludi verification server is already running (pid ${existing.pid} on ${existing.url})`),
      {
        code: 'CONFLICT',
        hint: `Run \`ludi server stop --run-dir ${run.root}\` first, or use a fresh --run-dir.`,
      },
    );
  }

  const logPath = join(run.root, 'server.log');
  const logFd = openSync(logPath, 'a');
  const entry = join(packageRoot, 'src', 'server', 'entry.ts');
  const tsxCli = join(packageRoot, 'node_modules', 'tsx', 'dist', 'cli.mjs');
  const child = spawn(
    process.execPath,
    [
      tsxCli,
      entry,
      String(opts.port),
      String(opts.graceMs),
      String(opts.aiDelayMs),
    ],
    {
      detached: true,
      stdio: ['ignore', logFd, logFd],
      env: { ...process.env, PORT: String(opts.port) },
      cwd: packageRoot,
    },
  );
  closeSync(logFd);
  child.unref();

  if (!child.pid) {
    throw Object.assign(new Error('Failed to spawn Ludi server process'), {
      code: 'GENERAL_ERROR',
      hint: 'Check that tsx is installed in tools/ludi (pnpm install from repo root).',
    });
  }

  const url = `http://127.0.0.1:${opts.port}`;
  const meta = {
    pid: child.pid,
    port: opts.port,
    url,
    grace_ms: opts.graceMs,
    ai_delay_ms: opts.aiDelayMs,
    started_at: new Date().toISOString(),
    log_path: logPath,
  };
  writeServer(run, meta);

  const ready = await waitForHttp(`${url}/health`, 15000);
  if (!ready) {
    throw Object.assign(
      new Error(`Server did not become healthy at ${url}/health within 15s`),
      {
        code: 'UPSTREAM_ERROR',
        hint: `Inspect ${logPath}. Try \`ludi server stop --run-dir ${run.root}\` then start again.`,
      },
    );
  }

  return { run, meta };
}

export async function stopServerProcess(runDir?: string, dryRun = false): Promise<{
  planned?: unknown[];
  stopped?: { pid: number; url: string };
  already_stopped?: boolean;
}> {
  const run = resolveRunDir(runDir);
  const meta = readServer(run);
  if (!meta) {
    return { already_stopped: true };
  }
  if (dryRun) {
    return {
      planned: [
        { action: 'signal', target: 'SIGTERM', pid: meta.pid, url: meta.url },
        { action: 'remove', path: run.serverPath },
      ],
    };
  }
  if (isPidAlive(meta.pid)) {
    try {
      process.kill(meta.pid, 'SIGTERM');
    } catch {
      /* already gone */
    }
    const deadline = Date.now() + 5000;
    while (Date.now() < deadline && isPidAlive(meta.pid)) {
      await sleep(50);
    }
    if (isPidAlive(meta.pid)) {
      try {
        process.kill(meta.pid, 'SIGKILL');
      } catch {
        /* ignore */
      }
    }
  }
  clearServer(run);
  return { stopped: { pid: meta.pid, url: meta.url } };
}

export function serverStatus(runDir?: string) {
  const run = resolveRunDir(runDir);
  const meta = readServer(run);
  if (!meta) {
    return { running: false, run_dir: run.root };
  }
  return {
    running: isPidAlive(meta.pid),
    run_dir: run.root,
    ...meta,
    pid_alive: isPidAlive(meta.pid),
  };
}

export async function startBridgeProcess(opts: {
  runDir?: string;
  url: string;
}): Promise<{ port: number; pid: number; run: RunDir }> {
  const run = resolveRunDir(opts.runDir);
  const existing = readBridge(run);
  if (existing && isPidAlive(existing.pid)) {
    throw Object.assign(
      new Error(`A session bridge is already running (pid ${existing.pid} on port ${existing.port})`),
      {
        code: 'CONFLICT',
        hint: `Run \`ludi session close --run-dir ${run.root}\` first.`,
      },
    );
  }

  const logPath = join(run.root, 'bridge.log');
  const logFd = openSync(logPath, 'a');
  const entry = join(packageRoot, 'src', 'bridge', 'entry.ts');
  const tsxCli = join(packageRoot, 'node_modules', 'tsx', 'dist', 'cli.mjs');
  const child = spawn(
    process.execPath,
    [tsxCli, entry, run.root, opts.url],
    {
      detached: true,
      stdio: ['ignore', logFd, logFd],
      cwd: packageRoot,
    },
  );
  closeSync(logFd);
  child.unref();
  if (!child.pid) {
    throw new Error('Failed to spawn session bridge');
  }

  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    const bridge = readBridge(run);
    if (bridge && isPidAlive(bridge.pid)) {
      const healthy = await waitForHttp(`http://127.0.0.1:${bridge.port}/health`, 500);
      if (healthy) return { port: bridge.port, pid: bridge.pid, run };
    }
    await sleep(50);
  }
  // Best-effort cleanup so a failed open does not strand the bridge.
  await stopBridgeProcess(run.root).catch(() => undefined);
  throw Object.assign(new Error('Session bridge failed to become healthy'), {
    code: 'UPSTREAM_ERROR',
    hint: `Inspect ${logPath}.`,
  });
}

export async function stopBridgeProcess(runDir?: string, dryRun = false) {
  const run = resolveRunDir(runDir);
  const meta = readBridge(run);
  if (!meta) return { already_stopped: true };
  if (dryRun) {
    return {
      planned: [
        { action: 'signal', target: 'SIGTERM', pid: meta.pid },
        { action: 'remove', path: run.bridgeSockHint },
      ],
    };
  }
  if (isPidAlive(meta.pid)) {
    try {
      process.kill(meta.pid, 'SIGTERM');
    } catch {
      /* ignore */
    }
    const deadline = Date.now() + 3000;
    while (Date.now() < deadline && isPidAlive(meta.pid)) await sleep(40);
    if (isPidAlive(meta.pid)) {
      try {
        process.kill(meta.pid, 'SIGKILL');
      } catch {
        /* ignore */
      }
    }
  }
  clearBridge(run);
  return { stopped: meta };
}

export async function bridgeRpc(
  runDir: string | undefined,
  method: string,
  args: Record<string, unknown> = {},
): Promise<{ ok: true; data: unknown } | { ok: false; error: string; code?: string }> {
  const run = resolveRunDir(runDir);
  const bridge = readBridge(run);
  if (!bridge || !isPidAlive(bridge.pid)) {
    return {
      ok: false,
      error: 'No live session bridge',
      code: 'PRECONDITION_FAILED',
    };
  }
  const res = await fetch(`http://127.0.0.1:${bridge.port}/rpc`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ method, args }),
  });
  const body = (await res.json()) as { ok: true; data: unknown } | { ok: false; error: string; code?: string };
  return body;
}

export function isPidAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

async function waitForHttp(url: string, timeoutMs: number): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch {
      /* retry */
    }
    await sleep(100);
  }
  return false;
}

/** Used by tests / dry-run inspection only. */
export function writeServerMetaForTest(run: RunDir, meta: Parameters<typeof writeServer>[1]): void {
  writeServer(run, meta);
  writeFileSync(join(run.root, '.touch'), '');
}

export function ensureDirExists(path: string): boolean {
  return existsSync(path);
}
