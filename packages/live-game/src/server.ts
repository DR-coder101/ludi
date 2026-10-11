import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { createInterface } from 'node:readline';
import {
  LiveAdminActionSchema,
  LiveChatInboundSchema,
  LiveGiftInboundSchema,
} from '@ludi/protocol';
import { Server } from 'socket.io';
import { createLiveGame } from './liveGame.js';
import type { LiveGame } from './types.js';

export type LiveServerOptions = {
  live?: LiveGame;
  port?: number;
  adminToken: string;
  stdin?: boolean;
};

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function json(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify(body));
}

function tokenOf(req: IncomingMessage, url: URL): string | null {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice('Bearer '.length);
  return url.searchParams.get('token');
}


function parseJson(raw: string): unknown {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

export function createLiveServer(options: LiveServerOptions): {
  start: () => Promise<string>;
  stop: () => Promise<void>;
  url: () => string;
} {
  const introRaw = process.env.LUDI_LIVE_INTRO_MS;
  const live =
    options.live ??
    createLiveGame(
      introRaw === undefined || introRaw === ''
        ? {}
        : { introMs: Number(introRaw) },
    );
  const adminToken = options.adminToken;
  let port = options.port ?? 0;
  let base = `http://127.0.0.1:${port}`;

  const broadcast = (events: unknown[]) => {
    io.emit('live', { snapshot: live.snapshot(), events });
  };

  const http = createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', `http://127.0.0.1`);
    if (req.method === 'GET' && url.pathname === '/health') {
      json(res, 200, { ok: true });
      return;
    }
    if (req.method === 'GET' && url.pathname === '/state') {
      json(res, 200, live.snapshot());
      return;
    }
    if (req.method === 'POST' && url.pathname === '/dev/chat') {
      const raw = parseJson(await readBody(req));
      const chat = LiveChatInboundSchema.safeParse(raw);
      if (!chat.success) {
        json(res, 400, { ok: false, error: 'invalid chat' });
        return;
      }
      const events = live.handleChat(chat.data);
      broadcast(events);
      json(res, 200, { ok: true, events, snapshot: live.snapshot() });
      return;
    }
    if (req.method === 'POST' && url.pathname === '/dev/gift') {
      const raw = parseJson(await readBody(req));
      const gift = LiveGiftInboundSchema.safeParse(raw);
      if (!gift.success) {
        json(res, 400, { ok: false, error: 'invalid gift' });
        return;
      }
      const events = live.handleGift(gift.data);
      broadcast(events);
      json(res, 200, { ok: true, events, snapshot: live.snapshot() });
      return;
    }
    if (req.method === 'POST' && url.pathname === '/admin') {
      if (!adminToken || tokenOf(req, url) !== adminToken) {
        json(res, 401, { ok: false, error: 'unauthorized' });
        return;
      }
      const raw = parseJson(await readBody(req));
      const action = LiveAdminActionSchema.safeParse(raw);
      if (!action.success) {
        json(res, 400, { ok: false, error: 'invalid admin action' });
        return;
      }
      const events = live.handleAdmin(action.data);
      broadcast(events);
      json(res, 200, { ok: true, events, snapshot: live.snapshot() });
      return;
    }
    json(res, 404, { ok: false, error: 'not found' });
  });

  const io = new Server(http, { cors: { origin: '*' } });
  io.on('connection', (socket) => {
    socket.emit('live', { snapshot: live.snapshot(), events: [] });
    socket.on('admin', (action: unknown, ack?: (r: unknown) => void) => {
      const auth = socket.handshake.auth;
      const queryToken = socket.handshake.query.token;
      const presented =
        auth && typeof auth === 'object' && 'token' in auth && typeof auth.token === 'string'
          ? auth.token
          : typeof queryToken === 'string'
            ? queryToken
            : undefined;
      if (!adminToken || presented !== adminToken) {
        ack?.({ ok: false, error: 'unauthorized' });
        return;
      }
      const parsed = LiveAdminActionSchema.safeParse(action);
      if (!parsed.success) {
        ack?.({ ok: false, error: 'invalid admin action' });
        return;
      }
      const events = live.handleAdmin(parsed.data);
      broadcast(events);
      ack?.({ ok: true, events, snapshot: live.snapshot() });
    });
  });

  let timer: ReturnType<typeof setInterval> | null = null;

  const start = async (): Promise<string> => {
    await new Promise<void>((resolve) => {
      http.listen(port, '127.0.0.1', () => {
        const addr = http.address();
        if (addr && typeof addr === 'object') {
          port = addr.port;
          base = `http://127.0.0.1:${port}`;
        }
        resolve();
      });
    });
    timer = setInterval(() => {
      const events = live.tick();
      if (events.length > 0) broadcast(events);
    }, 100);
    if (options.stdin !== false && process.stdin.isTTY !== true) {
      const rl = createInterface({ input: process.stdin });
      rl.on('line', (line) => {
        const trimmed = line.trim();
        if (!trimmed) return;
        const chat = LiveChatInboundSchema.safeParse(parseJson(trimmed));
        if (!chat.success) return;
        const events = live.handleChat(chat.data);
        broadcast(events);
      });
    }
    return base;
  };

  const stop = async (): Promise<void> => {
    if (timer) clearInterval(timer);
    timer = null;
    await new Promise<void>((resolve) => {
      io.close();
      http.close(() => resolve());
    });
  };

  return {
    start,
    stop,
    url: () => base,
  };
}
