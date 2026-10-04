import { readBridge, readServer, resolveRunDir, resolveServerUrl, type RunDir } from './runDir.js';
import { isPidAlive } from './process.js';

export interface DoctorReport {
  worth_driving: boolean;
  run_dir: string;
  server_url: string;
  checks: Array<{ name: string; ok: boolean; detail: string }>;
}

export async function runDoctor(opts: {
  runDir?: string;
  url?: string;
}): Promise<DoctorReport> {
  const run = resolveRunDir(opts.runDir);
  const url = resolveServerUrl(run, opts.url);
  const checks: DoctorReport['checks'] = [];

  const serverMeta = readServer(run);
  if (serverMeta) {
    const alive = isPidAlive(serverMeta.pid);
    checks.push({
      name: 'server_process',
      ok: alive,
      detail: alive
        ? `pid ${serverMeta.pid} owns ${serverMeta.url}`
        : `server.json points at dead pid ${serverMeta.pid}; run ludi server start`,
    });
    if (serverMeta.url !== url) {
      checks.push({
        name: 'url_match',
        ok: false,
        detail: `resolved URL ${url} differs from recorded ${serverMeta.url}`,
      });
    }
  } else {
    checks.push({
      name: 'server_process',
      ok: true,
      detail: 'No server.json in run dir (external server allowed if /health answers)',
    });
  }

  let healthOk = false;
  let healthDetail = '';
  try {
    const res = await fetch(`${url}/health`);
    const body = (await res.json()) as { status?: string };
    healthOk = res.ok && body.status === 'ok';
    healthDetail = healthOk
      ? `${url}/health → ${JSON.stringify(body)}`
      : `${url}/health returned HTTP ${res.status}`;
  } catch (err) {
    healthOk = false;
    healthDetail = `Cannot reach ${url}/health (${(err as Error).message}). Start with: ludi server start --run-dir ${run.root}`;
  }
  checks.push({ name: 'health', ok: healthOk, detail: healthDetail });

  try {
    const res = await fetch(url);
    const body = (await res.json()) as { service?: string; version?: string };
    const ok = res.ok && body.service === 'Ludi Server';
    checks.push({
      name: 'identity',
      ok,
      detail: ok
        ? `service=${body.service} version=${body.version}`
        : `Unexpected root payload from ${url}`,
    });
  } catch (err) {
    checks.push({
      name: 'identity',
      ok: false,
      detail: (err as Error).message,
    });
  }

  const bridge = readBridge(run);
  if (bridge) {
    const alive = isPidAlive(bridge.pid);
    checks.push({
      name: 'session_bridge',
      ok: alive,
      detail: alive
        ? `bridge pid ${bridge.pid} on port ${bridge.port}`
        : `stale bridge.json (pid ${bridge.pid}); run ludi session close then session open`,
    });
  } else {
    checks.push({
      name: 'session_bridge',
      ok: true,
      detail: 'No bridge yet (open with ludi session open, or use ludi play …)',
    });
  }

  const worth = checks.filter((c) => c.name === 'health' || c.name === 'identity').every((c) => c.ok);

  return {
    worth_driving: worth,
    run_dir: run.root,
    server_url: url,
    checks,
  };
}

export function doctorFailureHint(run: RunDir): string {
  return `Fix the failing checks, then re-run: ludi doctor --run-dir ${run.root} --output json`;
}
