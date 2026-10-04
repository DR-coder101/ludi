import { ExitCode, type ExitCodeValue } from './exit.js';

export const CLI_VERSION = '0.1.0';
export const ACLI_VERSION = '0.1.0';

export type OutputFormat = 'json' | 'text';

export interface ErrorBody {
  code: string;
  message: string;
  hint?: string;
  hints?: string[];
  docs?: string;
}

export interface EnvelopeOk {
  ok: true;
  command: string;
  dry_run?: boolean;
  planned_actions?: unknown[];
  data?: unknown;
  meta: { duration_ms: number; version: string };
}

export interface EnvelopeErr {
  ok: false;
  command: string;
  error: ErrorBody;
  meta: { duration_ms: number; version: string };
}

export type Envelope = EnvelopeOk | EnvelopeErr;

export interface Io {
  stdout: (s: string) => void;
  stderr: (s: string) => void;
  exit: (code: ExitCodeValue) => void;
}

export function defaultIo(): Io {
  return {
    stdout: (s) => process.stdout.write(s),
    stderr: (s) => process.stderr.write(s),
    exit: (code) => process.exit(code),
  };
}

export function emitOk(
  io: Io,
  format: OutputFormat,
  command: string,
  started: number,
  data: unknown,
  extras?: { dry_run?: boolean; planned_actions?: unknown[] },
): void {
  const envelope: EnvelopeOk = {
    ok: true,
    command,
    ...(extras?.dry_run ? { dry_run: true, planned_actions: extras.planned_actions ?? [] } : {}),
    data: extras?.dry_run ? undefined : data,
    meta: { duration_ms: Date.now() - started, version: CLI_VERSION },
  };
  if (format === 'json') {
    io.stdout(JSON.stringify(envelope, null, 2) + '\n');
  } else if (extras?.dry_run) {
    io.stdout(`dry-run ${command}\n${JSON.stringify(extras.planned_actions ?? [], null, 2)}\n`);
  } else {
    io.stdout(typeof data === 'string' ? data + '\n' : JSON.stringify(data, null, 2) + '\n');
  }
}

export function emitErr(
  io: Io,
  format: OutputFormat,
  command: string,
  started: number,
  error: ErrorBody,
  code: ExitCodeValue = ExitCode.GENERAL_ERROR,
): never {
  const envelope: EnvelopeErr = {
    ok: false,
    command,
    error,
    meta: { duration_ms: Date.now() - started, version: CLI_VERSION },
  };
  if (format === 'json') {
    io.stdout(JSON.stringify(envelope, null, 2) + '\n');
  } else {
    const lines = [`Error [${error.code}]: ${error.message}`];
    if (error.hint) lines.push(`  Hint: ${error.hint}`);
    for (const h of error.hints ?? []) lines.push(`  - ${h}`);
    if (error.docs) lines.push(`  Docs: ${error.docs}`);
    io.stderr(lines.join('\n') + '\n');
  }
  io.exit(code);
  throw new Error('unreachable');
}
