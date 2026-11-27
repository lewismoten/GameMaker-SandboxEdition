// Exercise the release size budget through its command-line entry point.
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
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

it('counts a Windows game ZIP toward its folder and ZIP budgets', () => {
  const dist = mkdtempSync(join(tmpdir(), 'release-sizes-'));
  try {
    const game = join(dist, 'games', 'originals', 'sample');
    mkdirSync(game, { recursive: true });
    writeFileSync(join(game, 'game.zip'), Buffer.alloc(4.5 * 1024 ** 2));
    writeFileSync(join(dist, 'offline.json'), '{"files":[]}');
    // Keep filesystem access native while making path.relative return Windows paths.
    const preload =
      "import path from 'node:path'; import {syncBuiltinESMExports} from 'node:module'; path.relative = path.win32.relative; path.sep = path.win32.sep; syncBuiltinESMExports();";
    const result = spawnSync(
      process.execPath,
      ['--import', 'data:text/javascript,' + encodeURIComponent(preload), join(__dirname, '../../../scripts/release/sizes.mjs'), '--dist', dist],
      { encoding: 'utf8' },
    );
    expect(result.stdout).toMatch(/games\/originals\/\s+4\.5 MB/);
    expect(result.stdout).toMatch(/FAIL\s+biggest game ZIP games\/originals\/sample\/game.zip/);
    expect(result.status).toBe(1);
  } finally {
    rmSync(dist, { recursive: true, force: true });
  }
});
