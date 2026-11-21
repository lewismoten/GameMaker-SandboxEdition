// Exercise the release size budget through its command-line entry point.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, it } from 'vitest';

function check(manifest?: object) {
  const dist = mkdtempSync(join(tmpdir(), 'release-sizes-'));
  try {
    if (manifest) writeFileSync(join(dist, 'offline.json'), JSON.stringify(manifest));
    return spawnSync(process.execPath, [join(__dirname, '../../../scripts/release/sizes.mjs'), '--dist', dist], { encoding: 'utf8' });
  } finally {
    rmSync(dist, { recursive: true, force: true });
  }
}

it.each([1, 72])('adds wire bytes and enforces the offline budget with a %i MB file', (mb) => {
  const result = check({ files: [{ wire: mb * 1024 ** 2, stored: 99 }, { wire: 1024 ** 2 }, { wire: 0 }] });
  expect(result.stdout).toMatch(new RegExp(`Offline copy \\(3 files, transfer\\)\\s+${mb + 1}\\.0 MB`));
  expect(result.status).toBe(mb === 1 ? 0 : 1);
});

it.each([
  [undefined, 'offline.json'],
  [{}, 'offline.json'],
  [{ files: [{}] }, 'files[0].wire'],
  [{ files: [{ wire: '42' }] }, 'files[0].wire'],
] as const)('rejects incomplete size inputs', (manifest, diagnostic) => {
  const result = check(manifest);
  expect(result.status).toBe(1);
  expect(result.stderr).toContain(diagnostic);
  expect(result.stdout).not.toContain('NaN');
});
