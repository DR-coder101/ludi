import { createInterface } from 'node:readline';
import { ControlEvent, TikTokLiveConnection, WebcastEvent } from 'tiktok-live-connector';
import { classifyConnectError } from './connectError.js';
import { STATUS_REASON } from './types.js';
import { decodeParentLine, encodeLine, type ParentToWorker } from './workerProtocol.js';

type ChatLike = {
  comment?: unknown;
  createTime?: unknown;
  timestamp?: unknown;
  user?: {
    uniqueId?: unknown;
    userId?: unknown;
    nickname?: unknown;
    nickName?: unknown;
  };
};

type GiftLike = {
  giftId?: unknown;
  repeatCount?: unknown;
  giftName?: unknown;
  giftDetails?: { giftName?: unknown };
  extendedGiftInfo?: { name?: unknown };
  user?: ChatLike['user'];
};

let connection: TikTokLiveConnection | undefined;

function send(message: Parameters<typeof encodeLine>[0]): void {
  process.stdout.write(encodeLine(message));
}

function asString(value: unknown): string | undefined {
  if (typeof value === 'string' && value.length > 0) return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return undefined;
}

function asTimeMs(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value < 1e12 ? value * 1000 : value;
  }
  if (typeof value === 'string' && value.trim()) {
    const n = Number(value);
    if (Number.isFinite(n)) return n < 1e12 ? n * 1000 : n;
  }
  return undefined;
}

async function connect(cmd: Extract<ParentToWorker, { type: 'connect' }>): Promise<void> {
  await disconnect();
  send({ type: 'status', phase: 'connecting' });

  const options: Record<string, unknown> = {
    processInitialData: false,
    fetchRoomInfoOnConnect: true,
    enableExtendedGiftInfo: true,
  };
  if (cmd.signApiKey) options.signApiKey = cmd.signApiKey;
  if (cmd.sessionCookie) {
    options.session = {
      cookie: cmd.sessionCookie,
      ...(cmd.sessionIdc ? { ttTargetIdc: cmd.sessionIdc } : {}),
    };
  }

  const next = new TikTokLiveConnection(cmd.uniqueId, options);
  connection = next;

  next.on(WebcastEvent.CHAT, (data: ChatLike) => {
    const text = asString(data.comment);
    if (!text) return;
    const userId = asString(data.user?.userId) ?? asString(data.user?.uniqueId) ?? 'unknown';
    const displayName =
      asString(data.user?.nickname) ??
      asString(data.user?.nickName) ??
      asString(data.user?.uniqueId) ??
      userId;
    send({
      type: 'chat',
      userId,
      displayName,
      text,
      platformTimestamp: asTimeMs(data.createTime) ?? asTimeMs(data.timestamp),
    });
  });

  next.on(WebcastEvent.GIFT, (data: GiftLike) => {
    const userId = asString(data.user?.userId) ?? asString(data.user?.uniqueId) ?? 'unknown';
    const displayName =
      asString(data.user?.nickname) ??
      asString(data.user?.nickName) ??
      asString(data.user?.uniqueId) ??
      userId;
    const giftName =
      asString(data.giftDetails?.giftName) ??
      asString(data.extendedGiftInfo?.name) ??
      asString(data.giftName) ??
      asString(data.giftId) ??
      'gift';
    const repeatCount = Number(data.repeatCount);
    send({
      type: 'gift',
      userId,
      displayName,
      giftName,
      repeatCount: Number.isFinite(repeatCount) && repeatCount > 0 ? repeatCount : 1,
    });
  });

  next.on(ControlEvent.DISCONNECTED, () => {
    send({ type: 'status', phase: 'disconnected', reason: STATUS_REASON.DROPPED });
  });

  next.on(ControlEvent.ERROR, (payload: { info?: unknown; exception?: unknown }) => {
    const message =
      asString((payload?.exception as { message?: unknown })?.message) ??
      asString(payload?.info) ??
      STATUS_REASON.CONNECT_FAILED;
    send({ type: 'status', phase: 'error', reason: message });
  });

  try {
    await next.connect();
    send({ type: 'status', phase: 'connected' });
  } catch (err) {
    const classified = classifyConnectError(err);
    send({
      type: 'status',
      phase: 'error',
      reason: classified.reason,
    });
    process.exitCode = classified.terminal ? 8 : 7;
  }
}

async function disconnect(): Promise<void> {
  const current = connection;
  connection = undefined;
  if (!current) return;
  await current.disconnect().catch(() => undefined);
}

async function handle(line: string): Promise<void> {
  const message = decodeParentLine(line);
  if (!message) return;
  switch (message.type) {
    case 'connect':
      await connect(message);
      return;
    case 'disconnect':
      await disconnect();
      send({ type: 'status', phase: 'disconnected', reason: STATUS_REASON.DISCONNECT });
      process.exit(0);
      return;
    default: {
      const _never: never = message;
      return _never;
    }
  }
}

process.on('uncaughtException', (err) => {
  send({ type: 'fatal', message: err.message });
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  const message = err instanceof Error ? err.message : String(err);
  send({ type: 'fatal', message });
  process.exit(1);
});

const rl = createInterface({ input: process.stdin, crlfDelay: Infinity });
rl.on('line', (line) => {
  void handle(line);
});
