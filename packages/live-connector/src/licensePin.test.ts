import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = dirname(fileURLToPath(new URL('../package.json', import.meta.url)));
const require = createRequire(import.meta.url);

describe('tiktok-live-connector licence pin', () => {
  it('pins exactly 2.4.0 in package.json, the last MIT release', () => {
    const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as {
      dependencies: Record<string, string>;
    };
    expect(pkg.dependencies['tiktok-live-connector']).toBe('2.4.0');
  });

  it('resolves the installed package as MIT 2.4.0', () => {
    const resolved = require.resolve('tiktok-live-connector/package.json');
    const installed = JSON.parse(readFileSync(resolved, 'utf8')) as {
      version: string;
      license: string;
    };
    expect(installed.version).toBe('2.4.0');
    expect(installed.license).toBe('MIT');
  });
});
