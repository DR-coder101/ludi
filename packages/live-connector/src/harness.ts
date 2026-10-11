import { createReadStream } from 'node:fs';
import { createServer, type Server } from 'node:http';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lagMs, verdict, type LagVerdict } from './lag.js';
import { createReplayAdapter, readReplayFile } from './replayAdapter.js';
import { createTikTokAdapter, readTikTokSecrets } from './tiktokAdapter.js';
import {
  P95_PASS_MS,
  type ChatCommand,
  type Clock,
  type CommandPrefixes,
  type ConnectionStatus,
  type GiftEvent,
  type PlatformAdapter,
  systemClock,
} from './types.js';

export type HarnessEvent =
  | { kind: 'command'; lagMs: number | null } & ChatCommand
  | { kind: 'gift' } & GiftEvent
  | { kind: 'status' } & ConnectionStatus
  | ({ kind: 'stats' } & LagVerdict)
  | ({ kind: 'verdict' } & LagVerdict);

export type WatchOptions = {
  user?: string;
  replay?: string;
  prefixes?: Partial<CommandPrefixes>;
  port?: number;
  servePage?: boolean;
  durationMs?: number;
  clock?: Clock;
  adapter?: PlatformAdapter;
  onEvent?: (event: HarnessEvent) => void;
  signal?: AbortSignal;
};

export type WatchResult = {
  verdict: LagVerdict;
  commands: Array<ChatCommand & { lagMs: number | null }>;
  pageUrl?: string;
  lastStatus?: ConnectionStatus;
};

const pagePath = join(dirname(fileURLToPath(import.meta.url)), 'page', 'index.html');

function writeSse(clients: Set<import('node:http').ServerResponse>, event: HarnessEvent): void {
  const payload = `data: ${JSON.stringify(event)}\n\n`;
  for (const client of clients) client.write(payload);
}

async function servePage(port: number): Promise<{ server: Server; pageUrl: string; clients: Set<import('node:http').ServerResponse> }> {
  const clients = new Set<import('node:http').ServerResponse>();
  const html = await new Promise<string>((resolve, reject) => {
    const chunks: Buffer[] = [];
    const stream = createReadStream(pagePath);
    stream.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    stream.on('error', reject);
  });

  const server = createServer((req, res) => {
    if (req.url === '/events') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      });
      clients.add(res);
      req.on('close', () => clients.delete(res));
      return;
    }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  });

  const pageUrl = await new Promise<string>((resolve, reject) => {
    server.listen(port, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        reject(new Error('latency page did not bind a TCP port'));
        return;
      }
      resolve(`http://127.0.0.1:${address.port}`);
    });
    server.on('error', reject);
  });

  return { server, pageUrl, clients };
}

export async function runWatch(options: WatchOptions): Promise<WatchResult> {
  const clock = options.clock ?? systemClock;
  const prefixes = options.prefixes;
  const adapter =
    options.adapter ??
    (options.replay
      ? createReplayAdapter({
          rows: await readReplayFile(options.replay),
          prefixes,
          clock,
        })
      : createTikTokAdapter({
          uniqueId: options.user ?? '',
          prefixes,
          secrets: readTikTokSecrets(),
          clock,
        }));

  const lags: number[] = [];
  const commands: Array<ChatCommand & { lagMs: number | null }> = [];
  let lastStatus: ConnectionStatus | undefined;
  let terminalStatus: ConnectionStatus | undefined;
  const servePageWanted = options.servePage !== false;
  const page = servePageWanted ? await servePage(options.port ?? 8787) : undefined;

  const emit = (event: HarnessEvent) => {
    options.onEvent?.(event);
    if (page) writeSse(page.clients, event);
  };

  const stop = async () => {
    await adapter.disconnect();
    if (page) {
      for (const client of page.clients) client.end();
      await new Promise<void>((resolve) => page.server.close(() => resolve()));
    }
  };

  adapter.onCommand((command) => {
    const lag = lagMs(command.receivedAt, command.platformTimestamp);
    if (lag !== null) lags.push(lag);
    const row = { ...command, lagMs: lag };
    commands.push(row);
    emit({ kind: 'command', ...row });
    emit({ kind: 'stats', ...verdict(lags) });
  });
  const controller = new AbortController();
  const onAbort = () => controller.abort();

  adapter.onGift((gift) => {
    emit({ kind: 'gift', ...gift });
  });
  adapter.onStatus((status) => {
    lastStatus = status;
    if (status.phase === 'error') terminalStatus = status;
    emit({ kind: 'status', ...status });
    if (status.phase === 'error') {
      controller.abort();
    }
  });

  await adapter.connect();
  options.signal?.addEventListener('abort', onAbort, { once: true });
  process.once('SIGINT', onAbort);
  process.once('SIGTERM', onAbort);

  if (options.replay) {
    await stop();
    const result = verdict(lags);
    emit({ kind: 'verdict', ...result });
    options.signal?.removeEventListener('abort', onAbort);
    process.removeListener('SIGINT', onAbort);
    process.removeListener('SIGTERM', onAbort);
    return { verdict: result, commands, pageUrl: page?.pageUrl, lastStatus: terminalStatus ?? lastStatus };
  }

  const duration = options.durationMs ?? 0;
  try {
    if (duration > 0) {
      await clock.sleep(duration, controller.signal).catch(() => undefined);
    } else {
      await new Promise<void>((resolve) => {
        if (controller.signal.aborted) {
          resolve();
          return;
        }
        controller.signal.addEventListener('abort', () => resolve(), { once: true });
      });
    }
  } finally {
    await stop();
    options.signal?.removeEventListener('abort', onAbort);
    process.removeListener('SIGINT', onAbort);
    process.removeListener('SIGTERM', onAbort);
  }

  const result = verdict(lags, P95_PASS_MS);
  emit({ kind: 'verdict', ...result });
  return { verdict: result, commands, pageUrl: page?.pageUrl, lastStatus: terminalStatus ?? lastStatus };
}
