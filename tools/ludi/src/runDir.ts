import { mkdirSync, readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { homedir, tmpdir } from 'node:os';

export interface ServerMeta {
  pid: number;
  port: number;
  url: string;
  grace_ms: number;
  ai_delay_ms: number;
  started_at: string;
  log_path: string;
}

export interface SessionMeta {
  room_code?: string;
  session_token?: string;
  player_id?: string;
  display_name?: string;
  color?: string;
  bridge_port?: number;
  bridge_pid?: number;
}

export interface RunDir {
  root: string;
  evidence: string;
  serverPath: string;
  sessionPath: string;
  bridgeSockHint: string;
}

export function defaultRunDir(explicit?: string): string {
  if (explicit) return explicit;
  if (process.env.LUDI_RUN_DIR) return process.env.LUDI_RUN_DIR;
  return join(tmpdir(), 'ludi-run-default');
}

export function resolveRunDir(explicit?: string): RunDir {
  const root = defaultRunDir(explicit);
  return {
    root,
    evidence: join(root, 'evidence'),
    serverPath: join(root, 'server.json'),
    sessionPath: join(root, 'session.json'),
    bridgeSockHint: join(root, 'bridge.json'),
  };
}

export function ensureRunDir(run: RunDir): void {
  mkdirSync(run.evidence, { recursive: true });
}

export function readServer(run: RunDir): ServerMeta | null {
  if (!existsSync(run.serverPath)) return null;
  return JSON.parse(readFileSync(run.serverPath, 'utf8')) as ServerMeta;
}

export function writeServer(run: RunDir, meta: ServerMeta): void {
  ensureRunDir(run);
  writeFileSync(run.serverPath, JSON.stringify(meta, null, 2) + '\n');
}

export function clearServer(run: RunDir): void {
  if (existsSync(run.serverPath)) rmSync(run.serverPath);
}

export function readSession(run: RunDir): SessionMeta {
  if (!existsSync(run.sessionPath)) return {};
  return JSON.parse(readFileSync(run.sessionPath, 'utf8')) as SessionMeta;
}

export function writeSession(run: RunDir, patch: SessionMeta): SessionMeta {
  ensureRunDir(run);
  const next = { ...readSession(run), ...patch };
  writeFileSync(run.sessionPath, JSON.stringify(next, null, 2) + '\n');
  return next;
}

export function clearSession(run: RunDir): void {
  if (existsSync(run.sessionPath)) rmSync(run.sessionPath);
}

export function readBridge(run: RunDir): { port: number; pid: number } | null {
  if (!existsSync(run.bridgeSockHint)) return null;
  return JSON.parse(readFileSync(run.bridgeSockHint, 'utf8')) as { port: number; pid: number };
}

export function writeBridge(run: RunDir, meta: { port: number; pid: number }): void {
  ensureRunDir(run);
  writeFileSync(run.bridgeSockHint, JSON.stringify(meta, null, 2) + '\n');
}

export function clearBridge(run: RunDir): void {
  if (existsSync(run.bridgeSockHint)) rmSync(run.bridgeSockHint);
}

/** Prefer run-dir URL, else LUDI_URL, else localhost:3000. */
export function resolveServerUrl(run: RunDir, override?: string): string {
  if (override) return override.replace(/\/$/, '');
  if (process.env.LUDI_URL) return process.env.LUDI_URL.replace(/\/$/, '');
  const server = readServer(run);
  if (server?.url) return server.url;
  return 'http://127.0.0.1:3000';
}

export function evidencePath(run: RunDir, name: string): string {
  return join(run.evidence, name);
}

export function homeCacheDir(): string {
  return join(homedir(), '.cache', 'ludi-cli');
}
