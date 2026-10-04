import { ExitCode, type ExitCodeValue } from './exit.js';

export type OutputFormat = 'json' | 'text';

export type Ctx = {
  runDir: string;
  url?: string;
  output: OutputFormat;
};

/** Agent-facing failure. `hint` names the next command to run. */
export type CliError = {
  code: string;
  message: string;
  hint: string;
};

export type Result =
  | { ok: true; data: unknown }
  | { ok: true; dry_run: true; planned_actions: unknown[] }
  | { ok: false; error: CliError };

export type ArgDef = {
  name: string;
  type: 'string' | 'int' | 'bool' | 'enum';
  summary: string;
  required?: boolean;
  default?: string | number | boolean;
  values?: readonly string[];
};

/**
 * One CLI command. Parents disclose children; leaves own run/dryRun.
 * Mutating leaves must define dryRun.
 */
export type Command = {
  name: string;
  summary: string;
  args: readonly ArgDef[];
  mutates: boolean;
  children?: readonly Command[];
  run?: (args: Readonly<Record<string, unknown>>, ctx: Ctx) => Promise<Result>;
  dryRun?: (args: Readonly<Record<string, unknown>>, ctx: Ctx) => Result;
};

export function ok(data: unknown): Result {
  return { ok: true, data };
}

export function planned(actions: unknown[]): Result {
  return { ok: true, dry_run: true, planned_actions: actions };
}

export function err(code: string, message: string, hint: string): Result {
  return { ok: false, error: { code, message, hint } };
}

export function exitFor(code: string): ExitCodeValue {
  if (code in ExitCode) return ExitCode[code as keyof typeof ExitCode];
  return ExitCode.GENERAL_ERROR;
}

export function findChild(parent: Command, name: string): Command | undefined {
  return parent.children?.find((c) => c.name === name);
}

export function isLeaf(cmd: Command): boolean {
  return !cmd.children || cmd.children.length === 0;
}
