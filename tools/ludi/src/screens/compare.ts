import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import { MAX_DIFF_RATIO, PIXEL_THRESHOLD } from './catalog.js';

export type CompareResult = {
  id: string;
  ok: boolean;
  width: number;
  height: number;
  baseline_width: number;
  baseline_height: number;
  pixels_differ: number;
  diff_ratio: number;
  max_diff_ratio: number;
  actual: string;
  baseline: string;
  diff: string | null;
  reason?: string;
};

export function comparePng(opts: {
  id: string;
  actualPath: string;
  baselinePath: string;
  diffPath: string;
  maxDiffRatio?: number;
  threshold?: number;
}): CompareResult {
  const maxDiffRatio = opts.maxDiffRatio ?? MAX_DIFF_RATIO;
  const threshold = opts.threshold ?? PIXEL_THRESHOLD;
  const base: Omit<CompareResult, 'ok' | 'pixels_differ' | 'diff_ratio' | 'diff' | 'reason'> = {
    id: opts.id,
    width: 0,
    height: 0,
    baseline_width: 0,
    baseline_height: 0,
    max_diff_ratio: maxDiffRatio,
    actual: opts.actualPath,
    baseline: opts.baselinePath,
  };

  if (!existsSync(opts.actualPath)) {
    return {
      ...base,
      ok: false,
      pixels_differ: -1,
      diff_ratio: 1,
      diff: null,
      reason: `missing actual ${opts.actualPath}`,
    };
  }
  if (!existsSync(opts.baselinePath)) {
    return {
      ...base,
      ok: false,
      pixels_differ: -1,
      diff_ratio: 1,
      diff: null,
      reason: `missing web baseline ${opts.baselinePath}`,
    };
  }

  const actual = PNG.sync.read(readFileSync(opts.actualPath));
  const baseline = PNG.sync.read(readFileSync(opts.baselinePath));
  base.width = actual.width;
  base.height = actual.height;
  base.baseline_width = baseline.width;
  base.baseline_height = baseline.height;

  if (actual.width !== baseline.width || actual.height !== baseline.height) {
    return {
      ...base,
      ok: false,
      pixels_differ: -1,
      diff_ratio: 1,
      diff: null,
      reason: `size ${actual.width}x${actual.height} vs baseline ${baseline.width}x${baseline.height}`,
    };
  }

  const diff = new PNG({ width: actual.width, height: actual.height });
  const pixels = pixelmatch(
    actual.data,
    baseline.data,
    diff.data,
    actual.width,
    actual.height,
    { threshold },
  );
  const diffRatio = pixels / (actual.width * actual.height);
  const ok = diffRatio <= maxDiffRatio;
  if (!ok) writeFileSync(opts.diffPath, PNG.sync.write(diff));
  return {
    ...base,
    ok,
    pixels_differ: pixels,
    diff_ratio: Number(diffRatio.toFixed(6)),
    diff: ok ? null : opts.diffPath,
    reason: ok ? undefined : `${pixels} pixels differ (${(diffRatio * 100).toFixed(3)}% > ${(maxDiffRatio * 100).toFixed(2)}%)`,
  };
}
