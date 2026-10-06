#!/usr/bin/env node
import { ExitCode } from './exit.js';
import { exitFor, isLeaf, type Result } from './command.js';
import { ACLI_VERSION, CLI_VERSION, defaultIo } from './output.js';
import { parseArgv, type ParsedInvocation } from './parse.js';
import { registry } from './registry.js';
import { renderHelp } from './introspect.js';

function isParsed(x: ParsedInvocation | Result): x is ParsedInvocation {
  return 'command' in x && 'ctx' in x;
}

function emit(command: string, started: number, result: Result, output: 'json' | 'text'): number {
  const io = defaultIo();
  const meta = { duration_ms: Date.now() - started, version: CLI_VERSION };
  if (result.ok && 'dry_run' in result && result.dry_run) {
    const body = {
      ok: true,
      command,
      dry_run: true,
      planned_actions: result.planned_actions,
      meta,
    };
    io.stdout(JSON.stringify(body, null, 2) + '\n');
    return ExitCode.DRY_RUN;
  }
  if (result.ok) {
    const body = { ok: true, command, data: result.data, meta };
    if (output === 'json') io.stdout(JSON.stringify(body, null, 2) + '\n');
    else io.stdout(typeof result.data === 'string' ? result.data + '\n' : JSON.stringify(result.data, null, 2) + '\n');
    return ExitCode.SUCCESS;
  }
  const body = { ok: false, command, error: result.error, meta };
  if (output === 'json') {
    io.stdout(JSON.stringify(body, null, 2) + '\n');
  } else {
    io.stderr(
      `Error [${result.error.code}]: ${result.error.message}\n  Hint: ${result.error.hint}\n`,
    );
  }
  return exitFor(result.error.code);
}

async function main(argv: string[]): Promise<void> {
  const started = Date.now();
  const parsed = parseArgv(argv, registry);

  if (!isParsed(parsed)) {
    process.exit(emit('ludi', started, parsed, 'json'));
  }

  const path = parsed.path;
  const commandName = ['ludi', ...path].join('.');

  if (parsed.version) {
    defaultIo().stdout(`ludi ${CLI_VERSION}\nacli ${ACLI_VERSION}\n`);
    process.exit(0);
  }

  if (parsed.help) {
    const helpPath = path;
    defaultIo().stdout(renderHelp(parsed.command, helpPath));
    process.exit(0);
  }

  if (!isLeaf(parsed.command) || !parsed.command.run) {
    defaultIo().stdout(renderHelp(parsed.command, path));
    process.exit(0);
  }

  if (parsed.dryRun) {
    if (!parsed.command.dryRun) {
      process.exit(
        emit(
          commandName,
          started,
          {
            ok: false,
            error: {
              code: 'INVALID_ARGS',
              message: `${commandName} is mutating but has no dryRun`,
              hint: `ludi ${path.join(' ')} --help`,
            },
          },
          parsed.ctx.output,
        ),
      );
    }
    const result = parsed.command.dryRun(parsed.args, parsed.ctx);
    process.exit(emit(commandName, started, result, parsed.ctx.output));
  }

  const result = await parsed.command.run(parsed.args, parsed.ctx);
  process.exit(emit(commandName, started, result, parsed.ctx.output));
}

await main(process.argv);
