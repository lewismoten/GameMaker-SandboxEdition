// Exercise the score command with captures ending on the anchor.
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, it } from 'vitest';

it.each([
  [1, 1, true],
  [0, 1, false],
  [1, 0, false],
] as const)('scores %i web frames against %i DOS frames', (web, dos, valid) => {
  mkdirSync('../.tmp', { recursive: true });
  const dir = mkdtempSync('../.tmp/score-');
  try {
    const prefix = join(dir, 'web');
    const capture = join(dir, 'dos.rgb');
    writeFileSync(prefix + '.rgb', Buffer.alloc(web * 192000));
    writeFileSync(prefix + '.clocks', '0');
    writeFileSync(capture, Buffer.alloc(dos * 3));
    const result = spawnSync(process.execPath, ['scripts/fidelity/score.mjs', prefix, capture, '1', '1', '0'], { encoding: 'utf8' });
    if (valid) {
      expect(result.stdout).toContain('SUMMARY ticks=1 exact=1 mean=100.000% first_diff=none');
      expect(result.status).toBe(0);
    } else {
      expect(result.stderr).toContain('at least one frame');
      expect(result.status).toBe(1);
    }
  } finally {
    rmSync(dir, { recursive: true });
  }
});
