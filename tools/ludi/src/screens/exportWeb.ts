import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export async function exportWeb(opts: { mobile: string; dist: string; logPath: string }): Promise<void> {
  mkdirSync(opts.dist, { recursive: true });
  await new Promise<void>((resolve, reject) => {
    const child = spawn(
      'pnpm',
      ['exec', 'expo', 'export', '--platform', 'web', '--output-dir', opts.dist],
      {
        cwd: opts.mobile,
        env: {
          ...process.env,
          CI: '1',
          EXPO_NO_TELEMETRY: '1',
          EXPO_PUBLIC_DEV_ROUTES: '1',
        },
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    );
    const chunks: Buffer[] = [];
    child.stdout?.on('data', (d: Buffer) => chunks.push(d));
    child.stderr?.on('data', (d: Buffer) => chunks.push(d));
    const timer = setTimeout(() => {
      child.kill('SIGTERM');
      reject(new Error(`expo export timed out after 180s; see ${opts.logPath}`));
    }, 180_000);
    child.on('error', (e) => {
      clearTimeout(timer);
      reject(e);
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      writeFileSync(opts.logPath, Buffer.concat(chunks));
      if (code === 0) resolve();
      else reject(new Error(`expo export exited ${code}; see ${opts.logPath}`));
    });
  });
  if (!existsSync(join(opts.dist, 'index.html'))) {
    throw new Error(`expo export wrote no index.html under ${opts.dist}`);
  }
}
