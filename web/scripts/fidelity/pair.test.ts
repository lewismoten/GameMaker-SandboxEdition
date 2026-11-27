// Invalid frame pairs must be rejected before any image is written.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, it } from 'vitest';

it.each([
  [1, 1, 1, 1, 192000, 3],
  [1, 1, -1, 0, 192000, 3],
  [1, 1, 0, 0.5, 192000, 3],
  [321, 1, 0, 0, 192000, 963],
  [1, 201, 0, 0, 192000, 603],
  [1, 1, 0, 0, 191999, 3],
  [1, 1, 0, 0, 192000, 2],
])('rejects crop %ix%i, pair %i/%i, capture sizes %i/%i', (w, h, t, f, web, dos) => {
  mkdirSync('../.tmp', { recursive: true });
  const dir = mkdtempSync('../.tmp/pair-');
  try {
    const prefix = join(dir, 'web');
    const capture = join(dir, 'dos.rgb');
    const image = join(dir, 'pair.png');
    writeFileSync(prefix + '.rgb', Buffer.alloc(web));
    writeFileSync(capture, Buffer.alloc(dos));
    const result = spawnSync(process.execPath, ['scripts/fidelity/pair.mjs', prefix, capture, ...[w, h, t, f].map(String), image]);
    expect(result.status).toBe(1);
    expect(existsSync(image)).toBe(false);
    expect(existsSync(image + '.rgb')).toBe(false);
  } finally {
    rmSync(dir, { recursive: true });
  }
});
