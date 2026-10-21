import { createServer as createHttpServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Server } from 'socket.io';
import { LiveAdminActionSchema, LiveChatInboundSchema, LiveGiftInboundSchema } from '@ludi/protocol';
import { DEFAULT_TIKTOK_SOURCE, type TikTokSource } from '@ludi/live-connector';
import { OVERLAY_FALLBACK_PORT, OVERLAY_PORT } from '../view/types.js';
import { createDefaultAdapter, createRuntime, toGiftInbound } from './runtime.js';
import { gateKick } from './kick.js';

const here = fileURLToPath(new URL('.', import.meta.url));
const uiDir = firstExisting([
  join(here, 'ui'),
  join(here, '../../dist/ui'),
  join(process.cwd(), 'dist/ui'),
]);
const overlayDir = firstExisting([
  join(here, 'overlay'),
  join(here, '../../dist/overlay'),
  join(process.cwd(), 'dist/overlay'),
  join(process.cwd(), '../live-overlay/dist'),
]);

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
};

function firstExisting(paths: string[]): string | null {
  return paths.find((p) => existsSync(p)) ?? null;
}

function json(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify(body));
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function serveFile(root: string, urlPath: string, res: ServerResponse, fallback = 'index.html'): boolean {
  const raw = decodeURIComponent(urlPath.split('?')[0] ?? '/');
  const rel = raw === '/' ? fallback : raw.replace(/^\//, '');
  const target = normalize(join(root, rel));
  if (!target.startsWith(normalize(root))) return false;
  const file = existsSync(target) && statSync(target).isFile() ? target : join(root, fallback);
  if (!existsSync(file) || !statSync(file).isFile()) return false;
  const type = MIME[extname(file)] ?? 'application/octet-stream';
  res.writeHead(200, { 'content-type': type });
  createReadStream(file).pipe(res);
  return true;
}

function sourceFromEnv(env: NodeJS.ProcessEnv): TikTokSource {
  return env.LUDI_LIVE_TIKTOK_SOURCE === 'connector' ? 'connector' : DEFAULT_TIKTOK_SOURCE;
}

export async function startAdminHost(opts: {
  username?: string;
  source?: TikTokSource;
} = {}): Promise<{ url: string; stop: () => Promise<void>; runtime: ReturnType<typeof createRuntime> }> {
  const username = opts.username ?? process.env.LUDI_LIVE_USERNAME ?? '';
  const source = opts.source ?? sourceFromEnv(process.env);
  const runtime = createRuntime({ username, source });
  if (username) runtime.setUsername(username);

  let emitLive: (events: unknown[]) => void = () => {};
  // LOCAL: pause info for the overlay (reason + frozen turn time)
  let lastStatusPhase = '';
  let pausedAt: number | null = null;
  let pauseReason: 'manual' | 'tiktok' = 'manual';
  const pauseInfo = () => {
    const snap = runtime.live.snapshot();
    if (!snap.paused) { pausedAt = null; return { paused: false, reason: null, turnLeftMs: null }; }
    if (pausedAt === null) pausedAt = Date.now();
    const reason = pauseReason;
    return { paused: true, reason, turnLeftMs: snap.turnEndsAt === null ? null : Math.max(0, snap.turnEndsAt - pausedAt) };
  };

  const adapter = createDefaultAdapter({ source, username: username || 'streamer' });
  adapter.onStatus((status) => {
    lastStatusPhase = status.phase;
    const wasPaused = runtime.live.snapshot().paused;
    runtime.setStatus(status);
    if (!wasPaused && runtime.live.snapshot().paused) pauseReason = 'tiktok';
    emitLive([]);
  });
  adapter.onCommand((command) => {
    const events = runtime.live.handleChat({
      platform: command.platform,
      userId: command.userId,
      displayName: command.displayName,
      text: command.text,
      receivedAt: command.receivedAt,
    });
    emitLive(events);
  });
  adapter.onGift((gift) => {
    emitLive(runtime.ingestGift(toGiftInbound(gift)).events);
  });

  const http = createHttpServer(async (req, res) => {
    const url = new URL(req.url ?? '/', 'http://127.0.0.1');
    if (req.method === 'GET' && url.pathname === '/health') {
      json(res, 200, { ok: true, overlay: runtime.snapshot().setup.overlayUrl });
      return;
    }
    if (req.method === 'GET' && url.pathname === '/api/state') {
      json(res, 200, runtime.snapshot());
      return;
    }
    if (req.method === 'POST' && url.pathname === '/api/use-fallback') {
      runtime.acceptFallback();
      json(res, 200, { ok: true, overlay: runtime.snapshot().setup.overlayUrl });
      return;
    }
    if (req.method === 'POST' && url.pathname === '/api/kick') {
      const raw = JSON.parse((await readBody(req)) || '{}') as { userId?: string; confirm?: unknown };
      const gated = gateKick({ type: 'kick', userId: raw.userId ?? '', confirm: raw.confirm });
      if (!gated.ok) {
        json(res, 400, { ok: false, error: gated.error });
        return;
      }
      runtime.requestKick(gated.userId);
      const kicked = runtime.confirmKick();
      emitLive([]);
      json(res, 200, kicked);
      return;
    }
    if (req.method === 'POST' && url.pathname === '/admin') {
      const raw = JSON.parse((await readBody(req)) || '{}') as unknown;
      const parsed = LiveAdminActionSchema.safeParse(raw);
      if (!parsed.success) {
        json(res, 400, { ok: false, error: 'invalid admin action' });
        return;
      }
      if (parsed.data.type === 'kick') {
        json(res, 400, { ok: false, error: 'confirm required' });
        return;
      }
      if (parsed.data.type === 'pause' && !runtime.live.snapshot().paused) pauseReason = 'manual';
      runtime.handleAdmin(parsed.data);
      emitLive([]);
      json(res, 200, { ok: true, snapshot: runtime.live.snapshot() });
      return;
    }
    if (req.method === 'POST' && url.pathname === '/dev/chat') {
      const chat = LiveChatInboundSchema.safeParse(JSON.parse((await readBody(req)) || '{}'));
      if (!chat.success) {
        json(res, 400, { ok: false, error: 'invalid chat' });
        return;
      }
      const events = runtime.live.handleChat(chat.data);
      emitLive(events);
      json(res, 200, { ok: true, events });
      return;
    }
    if (req.method === 'POST' && url.pathname === '/dev/gift') {
      const gift = LiveGiftInboundSchema.safeParse(JSON.parse((await readBody(req)) || '{}'));
      if (!gift.success) {
        json(res, 400, { ok: false, error: 'invalid gift' });
        return;
      }
      const result = runtime.ingestGift(gift.data);
      emitLive(result.events);
      json(res, 200, { ok: true, events: result.events, snapshot: result.after });
      return;
    }
    if (url.pathname === '/overlay' || url.pathname.startsWith('/overlay/')) {
      runtime.noteOverlayHit();
      if (!overlayDir) {
        json(res, 404, { ok: false, error: 'overlay dist missing' });
        return;
      }
      const rel = url.pathname === '/overlay' || url.pathname === '/overlay/'
        ? '/'
        : url.pathname.slice('/overlay'.length);
      if (serveFile(overlayDir, rel, res)) return;
      json(res, 404, { ok: false, error: 'overlay file missing' });
      return;
    }
    if (uiDir && serveFile(uiDir, url.pathname, res)) return;
    json(res, 404, { ok: false, error: 'not found' });
  });

  const io = new Server(http, { cors: { origin: '*' } });
  emitLive = (events) => {
    io.emit('live', { snapshot: runtime.live.snapshot(), events, pause: pauseInfo() });
  };
  io.on('connection', (socket) => {
    socket.emit('live', { snapshot: runtime.live.snapshot(), events: [], pause: pauseInfo() });
  });
  let lastPaused = runtime.live.snapshot().paused;
  const timer = setInterval(() => {
    const events = runtime.live.tick();
    const nowPaused = runtime.live.snapshot().paused;
    if (events.length > 0 || nowPaused !== lastPaused) emitLive(events);
    lastPaused = nowPaused;
  }, 100);

  const listenOn = (port: number) =>
    new Promise<void>((resolve, reject) => {
      const onErr = (err: Error) => reject(err);
      http.once('error', onErr);
      http.listen(port, '127.0.0.1', () => {
        http.off('error', onErr);
        resolve();
      });
    });

  const preferred = await runtime.bindPreferred(listenOn);
  if (preferred.status === 'port-in-use') {
    const fallback = await runtime.useFallbackPort(listenOn);
    if (fallback.status === 'port-in-use') {
      throw Object.assign(
        new Error(`ports ${OVERLAY_PORT} and ${OVERLAY_FALLBACK_PORT} are in use`),
        { code: 'EADDRINUSE' },
      );
    }
  }

  void adapter.connect();

  const bound = preferred.status === 'bound' ? OVERLAY_PORT : OVERLAY_FALLBACK_PORT;
  return {
    url: `http://127.0.0.1:${bound}`,
    runtime,
    async stop() {
      clearInterval(timer);
      await adapter.disconnect().catch(() => {});
      await new Promise<void>((resolve) => {
        io.close();
        http.close(() => resolve());
      });
    },
  };
}

const invoked = process.argv[1] ? pathToFileURL(process.argv[1]).href : '';
if (invoked === import.meta.url) {
  const started = await startAdminHost();
  process.stdout.write(JSON.stringify({ ok: true, url: started.url }) + '\n');
  const halt = () => {
    void started.stop().then(() => process.exit(0));
  };
  process.on('SIGINT', halt);
  process.on('SIGTERM', halt);
}
