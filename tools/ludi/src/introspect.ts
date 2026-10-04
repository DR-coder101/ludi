import { ACLI_VERSION, CLI_VERSION } from './output.js';
import type { Command } from './command.js';
import { isLeaf } from './command.js';

export function buildIntrospectFromRegistry(root: Command): {
  name: string;
  version: string;
  acli_version: string;
  surface: string;
  commands: unknown[];
} {
  return {
    name: root.name,
    version: CLI_VERSION,
    acli_version: ACLI_VERSION,
    surface:
      'Ludi server over HTTP + Socket.IO (guest room, lobby, match, solo vs bots). Not the Expo mobile UI.',
    commands: (root.children ?? []).map(serialize),
  };
}

function serialize(cmd: Command): unknown {
  return {
    name: cmd.name,
    description: cmd.summary,
    mutating: cmd.mutates,
    idempotent: !cmd.mutates,
    arguments: cmd.args.map((a) => ({
      name: a.name,
      type: a.type === 'enum' && a.values ? `enum[${a.values.join('|')}]` : a.type,
      required: !!a.required,
      description: a.summary,
      default: a.default,
    })),
    subcommands: (cmd.children ?? []).map(serialize),
  };
}

export function renderHelp(cmd: Command, path: string[]): string {
  const full = ['ludi', ...path.filter((p) => p !== 'ludi')].join(' ');
  const lines: string[] = [];
  lines.push(cmd.summary);
  lines.push('');
  lines.push('USAGE:');
  if (!isLeaf(cmd)) {
    lines.push(`  ${full} <subcommand> [options]`);
    lines.push('');
    lines.push('SUBCOMMANDS:');
    for (const child of cmd.children ?? []) {
      lines.push(`  ${child.name.padEnd(16)} ${child.summary}`);
    }
  } else {
    const argBits = cmd.args
      .map((a) => (a.required ? `--${a.name} <${a.type}>` : `[--${a.name} <${a.type}>]`))
      .join(' ');
    lines.push(`  ${full}${argBits ? ` ${argBits}` : ''}${cmd.mutates ? ' [--dry-run]' : ''}`);
    if (cmd.args.length) {
      lines.push('');
      lines.push('OPTIONS:');
      for (const a of cmd.args) {
        const type = a.type === 'enum' && a.values ? `enum[${a.values.join('|')}]` : a.type;
        const req = a.required ? 'required' : `optional${a.default !== undefined ? `, default ${a.default}` : ''}`;
        lines.push(`  --${a.name.padEnd(14)} ${type}  ${req}  ${a.summary}`);
      }
      if (cmd.mutates) {
        lines.push(`  --${'dry-run'.padEnd(14)} bool  optional  Plan only; exit 9; change nothing`);
      }
    } else if (cmd.mutates) {
      lines.push('');
      lines.push('OPTIONS:');
      lines.push(`  --${'dry-run'.padEnd(14)} bool  optional  Plan only; exit 9; change nothing`);
    }
  }
  lines.push('');
  lines.push('GLOBAL:');
  lines.push('  --output json|text   Output format (default json)');
  lines.push('  --run-dir <path>     Isolated run directory');
  lines.push('  --url <url>          Server URL override');
  lines.push('');
  lines.push('EXAMPLES:');
  if (cmd.name === 'ludi') {
    lines.push('  ludi --help');
    lines.push('  ludi play --help');
    lines.push('  ludi doctor --output json');
    lines.push('  ludi introspect');
  } else if (path[0] === 'play' || cmd.name === 'solo-vs-bots') {
    lines.push('  ludi play solo-vs-bots --run-dir /tmp/ludi-v1 --turns 1');
    lines.push('  ludi play solo-vs-bots --dry-run --output json');
  } else {
    lines.push(`  ${full} --help`);
    lines.push(`  ${full}${cmd.mutates ? ' --dry-run' : ''} --output json`);
  }
  lines.push('');
  lines.push('SEE ALSO: ludi introspect, tools/ludi/.cli/README.md');
  return lines.join('\n') + '\n';
}
