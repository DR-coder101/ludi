import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const src = dirname(fileURLToPath(import.meta.url));

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      if (name === 'page') continue;
      out.push(...walk(path));
      continue;
    }
    if (path.endsWith('.ts')) out.push(path);
  }
  return out;
}

describe('library isolation', () => {
  it('imports tiktok-live-connector from tiktokWorker.ts only', () => {
    const hits = walk(src).filter((path) => {
      if (path.endsWith('tiktokWorker.ts') || path.endsWith('.test.ts')) return false;
      const text = readFileSync(path, 'utf8');
      return /from ['"]tiktok-live-connector['"]/.test(text);
    });
    expect(hits).toEqual([]);
  });
});
