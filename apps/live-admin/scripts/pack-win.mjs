import { spawnSync } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const app = join(dirname(fileURLToPath(import.meta.url)), '..');
const repo = join(app, '../..');
const dist = join(app, 'dist');
const release = join(app, 'release');

function run(cmd, args, cwd) {
  const result = spawnSync(cmd, args, { cwd, stdio: 'inherit', env: process.env });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

rmSync(release, { recursive: true, force: true });
mkdirSync(join(dist, 'ui'), { recursive: true });
mkdirSync(join(dist, 'overlay'), { recursive: true });
mkdirSync(release, { recursive: true });

run('pnpm', ['exec', 'vite', 'build', '--outDir', join(dist, 'ui')], app);
run(
  'pnpm',
  ['exec', 'vite', 'build', '--base', '/overlay/', '--outDir', join(dist, 'overlay')],
  join(repo, 'apps/live-overlay'),
);
run(
  'pnpm',
  [
    'exec',
    'esbuild',
    'src/host/index.ts',
    '--bundle',
    '--platform=node',
    '--format=cjs',
    '--outfile=dist/host.cjs',
    '--packages=bundle',
  ],
  app,
);
run(
  'pnpm',
  [
    'exec',
    'pkg',
    'dist/host.cjs',
    '--targets',
    'node22-win-x64',
    '--output',
    join(release, 'LudiLive.exe'),
    '--assets',
    'dist/ui/**/*',
    '--assets',
    'dist/overlay/**/*',
  ],
  app,
);

process.stdout.write(`unsigned Windows build: ${join(release, 'LudiLive.exe')}\n`);
