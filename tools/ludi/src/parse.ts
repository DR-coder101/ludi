import type { ArgDef, Command, Ctx, OutputFormat, Result } from './command.js';
import { err, findChild, isLeaf } from './command.js';
import { resolveRunDir } from './runDir.js';

export type ParsedInvocation = {
  path: string[];
  command: Command;
  args: Record<string, unknown>;
  ctx: Ctx;
  dryRun: boolean;
  help: boolean;
  version: boolean;
};

function flagName(token: string): string | null {
  if (token === '-h') return 'help';
  if (token === '-V') return 'version';
  if (token.startsWith('--')) return token.slice(2);
  return null;
}

function coerce(def: ArgDef, raw: string): unknown {
  if (def.type === 'int') {
    const n = Number(raw);
    if (!Number.isFinite(n) || !Number.isInteger(n)) {
      throw new Error(`--${def.name} must be an integer (got ${raw})`);
    }
    return n;
  }
  if (def.type === 'bool') return raw !== 'false' && raw !== '0';
  if (def.type === 'enum' && def.values && !def.values.includes(raw)) {
    throw new Error(`--${def.name} must be one of ${def.values.join('|')} (got ${raw})`);
  }
  return raw;
}

/**
 * Parse argv once at the edge into a command record's args + context.
 */
export function parseArgv(argv: string[], root: Command): ParsedInvocation | Result {
  const tokens = argv.slice(2);
  let output: OutputFormat = 'json';
  let runDir: string | undefined;
  let url: string | undefined;
  let dryRun = false;
  let help = false;
  let version = false;

  const path: string[] = [];
  const rawFlags = new Map<string, string | boolean>();

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i]!;
    // pnpm run forwards args after a lone "--"; ignore that separator.
    if (t === '--') continue;
    const name = flagName(t);
    if (name === null) {
      path.push(t);
      continue;
    }
    if (name === 'help') {
      help = true;
      continue;
    }
    if (name === 'version') {
      version = true;
      continue;
    }
    if (name === 'dry-run') {
      dryRun = true;
      continue;
    }
    if (name === 'json') {
      output = 'json';
      continue;
    }
    const next = tokens[i + 1];
    const takesValue = next !== undefined && !next.startsWith('-');
    if (name === 'output' && takesValue) {
      output = next === 'text' ? 'text' : 'json';
      i++;
      continue;
    }
    if (name === 'run-dir' && takesValue) {
      runDir = next;
      i++;
      continue;
    }
    if (name === 'url' && takesValue) {
      url = next;
      i++;
      continue;
    }
    if (takesValue) {
      rawFlags.set(name, next!);
      i++;
    } else {
      rawFlags.set(name, true);
    }
  }

  let command = root;
  for (const segment of path) {
    const child = findChild(command, segment);
    if (!child) {
      const known = command.children?.map((c) => c.name).join(', ') ?? '(none)';
      return err(
        'INVALID_ARGS',
        `Unknown command "${segment}" under ${command.name}`,
        `ludi ${[command.name === 'ludi' ? '' : path.slice(0, -1).join(' '), '--help'].filter(Boolean).join(' ').trim()} (known: ${known})`,
      );
    }
    command = child;
  }

  const ctx: Ctx = {
    runDir: resolveRunDir(runDir).root,
    url,
    output,
  };

  if (version) {
    return { path, command: root, args: {}, ctx, dryRun: false, help: false, version: true };
  }

  // Parents disclose children via help; bare `ludi play` is help, not an error.
  if (help || !isLeaf(command)) {
    return { path, command, args: {}, ctx, dryRun: false, help: true, version: false };
  }

  const args: Record<string, unknown> = {};
  for (const def of command.args) {
    if (rawFlags.has(def.name)) {
      try {
        const raw = rawFlags.get(def.name)!;
        args[def.name] = typeof raw === 'boolean' ? raw : coerce(def, String(raw));
      } catch (e) {
        return err('INVALID_ARGS', (e as Error).message, `ludi ${path.join(' ')} --help`);
      }
      rawFlags.delete(def.name);
    } else if (def.required) {
      return err(
        'INVALID_ARGS',
        `Missing required option --${def.name}`,
        `ludi ${path.join(' ')} --help`,
      );
    } else if (def.default !== undefined) {
      args[def.name] = def.default;
    }
  }

  for (const unknown of rawFlags.keys()) {
    return err(
      'INVALID_ARGS',
      `Unknown option --${unknown}`,
      `ludi ${path.join(' ')} --help`,
    );
  }

  if (dryRun && !command.mutates) {
    return err(
      'INVALID_ARGS',
      `\`${path.join(' ')}\` does not change state and does not accept --dry-run`,
      `ludi ${path.join(' ')} --help`,
    );
  }

  return { path, command, args, ctx, dryRun, help: false, version: false };
}
