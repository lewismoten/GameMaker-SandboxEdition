// Portable native disk output enforces DOS names and replaces only the caller's chosen directory.
import { expect, it } from 'vitest';
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { Disk, dosText } from '@lewismoten/gamemaker-sandbox-tools/kit/disk';
it('writes lowercase DOS names and removes stale generated output', () => {
  const dir = mkdtempSync(join(tmpdir(), 'native-disk-'));
  try {
    writeFileSync(join(dir, 'stale.tmp'), 'old');
    const disk = new Disk(dir);
    disk.put('DEMO.GAM', Uint8Array.of(1, 2, 3));
    disk.put('README.TXT', 'one\ntwo');
    expect(() => disk.put('too-long-name.gam', '')).toThrow('DOS 8.3');
    expect(disk.write()).toBe(11);
    expect(readdirSync(dir).sort()).toEqual(['demo.gam', 'readme.txt']);
    expect(readFileSync(join(dir, 'readme.txt'), 'utf8')).toBe('one\r\ntwo');
    expect(dosText('A€')).toEqual(Uint8Array.of(65, 63));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
