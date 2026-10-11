import { type ChildProcess, spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { nextBackoff, type BackoffOptions, DEFAULT_BACKOFF } from './reconnect.js';
import { initialStatus, reduceStatus } from './status.js';
import {
  STATUS_REASON,
  createEmitter,
  systemClock,
  type ChatCommand,
  type Clock,
  type CommandPrefixes,
  type ConnectionStatus,
  type GiftEvent,
  type PlatformAdapter,
} from './types.js';
import { classifyConnectError, isTerminalReason } from './connectError.js';
import { isConfiguredCommand } from './parseCommand.js';
import { decodeWorkerLine, encodeLine, type ParentToWorker } from './workerProtocol.js';

const require = createRequire(import.meta.url);

export type TikTokSecrets = {
  signApiKey?: string;
  sessionCookie?: string;
  sessionIdc?: string;
};

export type TikTokAdapterOptions = {
  uniqueId: string;
  prefixes?: Partial<CommandPrefixes>;
  secrets?: TikTokSecrets;
  clock?: Clock;
  backoff?: BackoffOptions;
  spawnWorker?: () => ChildProcess;
};

function defaultSpawnWorker(): ChildProcess {
  const tsxCli = require.resolve('tsx/cli');
  const worker = fileURLToPath(new URL('./tiktokWorker.ts', import.meta.url));
  return spawn(process.execPath, [tsxCli, worker], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: process.env,
  });
}

export function readTikTokSecrets(env: NodeJS.ProcessEnv = process.env): TikTokSecrets {
  return {
    signApiKey: env.TIKTOK_SIGN_API_KEY || env.EULER_API_KEY || undefined,
    sessionCookie: env.TIKTOK_SESSION_COOKIE || undefined,
    sessionIdc: env.TIKTOK_SESSION_IDC || undefined,
  };
}

export function createTikTokAdapter(options: TikTokAdapterOptions): PlatformAdapter {
  const clock = options.clock ?? systemClock;
  const backoff = options.backoff ?? DEFAULT_BACKOFF;
  const commands = createEmitter<ChatCommand>();
  const gifts = createEmitter<GiftEvent>();
  const statuses = createEmitter<ConnectionStatus>();
  const spawnWorker = options.spawnWorker ?? defaultSpawnWorker;

  let status = initialStatus(clock.now());
  let child: ChildProcess | undefined;
  let attempt = 0;
  let loop: Promise<void> | undefined;
  let stop: AbortController | undefined;
  let wantConnected = false;

  const setStatus = (event: Parameters<typeof reduceStatus>[1]) => {
    const next = reduceStatus(status, event, clock.now());
    if (next === status) return;
    status = next;
    statuses.emit(next);
  };

  const send = (message: ParentToWorker) => {
    child?.stdin?.write(encodeLine(message));
  };

  const killChild = () => {
    const current = child;
    child = undefined;
    if (!current) return;
    current.stdout?.removeAllListeners();
    current.stderr?.removeAllListeners();
    current.removeAllListeners();
    if (!current.killed) current.kill('SIGTERM');
  };

  const attachChild = (next: ChildProcess) => {
    child = next;
    if (next.stdout) {
      const rl = createInterface({ input: next.stdout, crlfDelay: Infinity });
      rl.on('line', (line) => {
        const message = decodeWorkerLine(line);
        if (!message) return;
        switch (message.type) {
          case 'status':
            if (message.phase === 'connected') {
              attempt = 0;
              setStatus({ type: 'connected' });
              return;
            }
            if (message.phase === 'connecting') {
              setStatus({ type: 'connect_requested' });
              return;
            }
            if (isTerminalReason(message.reason)) {
              wantConnected = false;
              setStatus({
                type: 'fatal',
                reason: classifyConnectError({ message: message.reason }).reason,
              });
              return;
            }
            if (message.phase === 'error') {
              setStatus({
                type: 'connect_failed',
                reason: message.reason ?? STATUS_REASON.CONNECT_FAILED,
              });
              return;
            }
            if (message.phase === 'disconnected' && wantConnected) {
              setStatus({ type: 'dropped', reason: message.reason ?? STATUS_REASON.DROPPED });
            }
            return;
          case 'chat':
            if (!isConfiguredCommand(message.text, options.prefixes)) return;
            commands.emit({
              platform: 'tiktok',
              userId: message.userId,
              displayName: message.displayName,
              text: message.text.trim().replace(/\s+/g, ' '),
              receivedAt: clock.now(),
              platformTimestamp: message.platformTimestamp,
            });
            return;
          case 'gift':
            gifts.emit({
              platform: 'tiktok',
              userId: message.userId,
              displayName: message.displayName,
              giftName: message.giftName,
              repeatCount: message.repeatCount,
              receivedAt: clock.now(),
            });
            return;
          case 'fatal':
            setStatus({ type: 'connect_failed', reason: message.message });
            return;
          default: {
            const _never: never = message;
            return _never;
          }
        }
      });
    }
    next.on('exit', () => {
      child = undefined;
      if (!wantConnected) return;
      if (status.phase === 'error') return;
      setStatus({ type: 'dropped', reason: STATUS_REASON.WORKER_CRASH });
    });
  };

  const runLoop = async (signal: AbortSignal) => {
    while (wantConnected && !signal.aborted) {
      if (status.phase === 'error') {
        return;
      }
      if (status.phase === 'reconnecting') {
        const wait = nextBackoff(attempt, clock, backoff);
        attempt = wait.attempt;
        try {
          await clock.sleep(wait.delayMs, signal);
        } catch {
          return;
        }
      }
      if (!wantConnected || signal.aborted) return;
      setStatus({ type: 'connect_requested' });
      attachChild(spawnWorker());
      send({
        type: 'connect',
        uniqueId: options.uniqueId,
        signApiKey: options.secrets?.signApiKey,
        sessionCookie: options.secrets?.sessionCookie,
        sessionIdc: options.secrets?.sessionIdc,
      });
      await new Promise<void>((resolve) => {
        const next = child;
        if (!next) {
          resolve();
          return;
        }
        const done = () => {
          next.removeListener('exit', done);
          resolve();
        };
        next.once('exit', done);
        signal.addEventListener('abort', done, { once: true });
      });
      killChild();
    }
  };

  return {
    async connect() {
      if (wantConnected) return;
      wantConnected = true;
      attempt = 0;
      stop = new AbortController();
      loop = runLoop(stop.signal);
      await Promise.resolve();
    },
    async disconnect() {
      wantConnected = false;
      stop?.abort();
      send({ type: 'disconnect' });
      killChild();
      setStatus({ type: 'disconnect_requested', reason: STATUS_REASON.DISCONNECT });
      await loop?.catch(() => undefined);
      loop = undefined;
    },
    onCommand: commands.on,
    onStatus: statuses.on,
    onGift: gifts.on,
  };
}
