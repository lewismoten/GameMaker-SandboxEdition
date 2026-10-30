// Temporary frame caches retain float samples exactly and isolate later drawing from stored pixels.
import { afterEach, expect, it } from 'vitest';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { cachedFrame } from '../../games/depth/src/render/frameCache';
let dir: string | undefined;
const originalCache = process.env.DEPTH_FRAME_CACHE;
const originalShard = process.env.DEPTH_FRAME_SHARD;
afterEach(() => {
  if (dir) rmSync(dir, { recursive: true, force: true });
  dir = undefined;
  if (originalCache === undefined) delete process.env.DEPTH_FRAME_CACHE;
  else process.env.DEPTH_FRAME_CACHE = originalCache;
  if (originalShard === undefined) delete process.env.DEPTH_FRAME_SHARD;
  else process.env.DEPTH_FRAME_SHARD = originalShard;
});
it('reuses exact floating samples without retaining subsequent overlays', () => {
  dir = mkdtempSync(join(tmpdir(), 'frame-cache-'));
  process.env.DEPTH_FRAME_CACHE = dir;
  delete process.env.DEPTH_FRAME_SHARD;
  const rgb = Float32Array.of(0.1, 0.2, 0.3);
  const image = { w: 1, h: 1, rgb };
  cachedFrame('image', () => image).rgb[0] = 1;
  const cached = cachedFrame('image', () => {
    throw new Error('must use cache');
  });
  expect(cached.rgb).toEqual(Float32Array.of(0.1, 0.2, 0.3));
});
it('only renders frames owned by the selected worker', () => {
  dir = mkdtempSync(join(tmpdir(), 'frame-shard-'));
  process.env.DEPTH_FRAME_CACHE = dir;
  process.env.DEPTH_FRAME_SHARD = '0/8';
  // The key hash for "a" is 97, which belongs to shard 1.
  cachedFrame('a', () => {
    throw new Error('another worker owns this frame');
  });
  expect(existsSync(join(dir, 'a.bin.gz'))).toBe(false);
  process.env.DEPTH_FRAME_SHARD = '1/8';
  cachedFrame('a', () => ({ w: 1, h: 1, rgb: Float32Array.of(1, 0, 0) }));
  expect(existsSync(join(dir, 'a.bin.gz'))).toBe(true);
});
