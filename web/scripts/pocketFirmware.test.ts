// Firmware download destinations decode spaces in a checkout path; downloads use a local stub.
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, it } from 'vitest';

it('downloads into a fresh checkout whose path contains a space', () => {
  const root = mkdtempSync(join(tmpdir(), 'firmware checkout '));
  try {
    const scripts = join(root, 'scripts');
    mkdirSync(scripts);
    copyFileSync(new URL('./pocketFirmware.ts', import.meta.url), join(scripts, 'pocketFirmware.ts'));
    const fw = join(root, 'public/pocket/fw');
    mkdirSync(fw, { recursive: true });
    const notice = readFileSync(new URL('../public/pocket/fw/NOTICES.txt', import.meta.url));
    writeFileSync(join(fw, 'NOTICES.txt'), notice);
    const bytes = Buffer.from('fixture firmware');
    writeFileSync(
      join(scripts, 'pocketFirmware.json'),
      JSON.stringify({
        repo: 'fixture/repo',
        tag: 'test',
        files: [{ board: 'board', file: 'firmware.bin', asset: 'firmware.bin', size: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') }],
      }),
    );
    const stub = join(root, 'fetch.mjs');
    writeFileSync(stub, `globalThis.fetch = async () => new Response(${JSON.stringify(bytes.toString())});`);
    const result = spawnSync(process.execPath, ['--import', stub, join(scripts, 'pocketFirmware.ts')], { encoding: 'utf8', timeout: 10000 });
    expect(result.status, result.stderr).toBe(0);
    expect(readFileSync(join(root, 'public/pocket/fw/board/firmware.bin'))).toEqual(bytes);
    expect(readFileSync(join(fw, 'board/NOTICES.txt'))).toEqual(notice);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
