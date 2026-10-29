import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const appRoot = path.resolve(__dirname, '..');

function resolveFromAppRoot(id: string): string | undefined {
  let dir = appRoot;
  while (true) {
    const candidate = path.join(dir, 'node_modules', id);
    if (fs.existsSync(candidate)) {
      return candidate;
    }
    const parent = path.dirname(dir);
    if (parent === dir) {
      return undefined;
    }
    dir = parent;
  }
}

describe('Expo Metro asset plugin', () => {
  it('resolves expo-asset hashAssetFiles from the app root without NODE_PATH', () => {
    expect(
      resolveFromAppRoot('expo-asset/tools/hashAssetFiles.js'),
    ).toBeTruthy();
  });
});
