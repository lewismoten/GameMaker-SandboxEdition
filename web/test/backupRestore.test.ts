// Verify authentication and staged publication during backup restore.
import { expect, it, vi } from 'vitest';
import { createCipheriv, scryptSync } from 'node:crypto';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { restoreBackup } from '../../scripts/backup-restore.mjs';

it('authenticates before extraction and cleans up a failed restore', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'gm-backup-'));
  try {
    const file = join(dir, 'backup.enc');
    const dest = join(dir, 'restored');
    const salt = Buffer.alloc(16, 1);
    const iv = Buffer.alloc(12, 2);
    const cipher = createCipheriv('aes-256-gcm', scryptSync('test-passphrase', salt, 32), iv);
    const plain = Buffer.from('ordinary test data');
    const encrypted = Buffer.concat([Buffer.from('GMLBK1\0\0'), salt, iv, cipher.update(plain), cipher.final(), cipher.getAuthTag()]);
    const bad = Buffer.from(encrypted);
    bad[bad.length - 1] ^= 1;
    writeFileSync(file, bad);
    const extract = vi.fn();
    await expect(restoreBackup(file, dest, 'test-passphrase', extract)).rejects.toThrow();
    expect(extract).not.toHaveBeenCalled();
    expect(existsSync(dest)).toBe(false);
    expect(readdirSync(dir)).toEqual(['backup.enc']);
    writeFileSync(file, encrypted);
    await expect(
      restoreBackup(file, dest, 'test-passphrase', async (_: string, staged: string) => {
        writeFileSync(join(staged, 'partial'), 'partial');
        throw new Error('extract failed');
      }),
    ).rejects.toThrow('extract failed');
    expect(existsSync(dest)).toBe(false);
    expect(readdirSync(dir)).toEqual(['backup.enc']);
    if (process.platform !== 'win32') {
      const tar = join(dir, 'tar');
      writeFileSync(tar, '#!/bin/sh\ntouch "$4/partial"\nkill -TERM "$$"\n', { mode: 0o700 });
      vi.stubEnv('PATH', dir + ':' + process.env.PATH);
      try {
        await expect(restoreBackup(file, dest, 'test-passphrase')).rejects.toThrow('SIGTERM');
        expect(existsSync(dest)).toBe(false);
        expect(readdirSync(dir).sort()).toEqual(['backup.enc', 'tar']);
      } finally {
        vi.unstubAllEnvs();
        rmSync(tar);
      }
    }
    await restoreBackup(file, dest, 'test-passphrase', async (archive: string, staged: string) => {
      expect(readFileSync(archive)).toEqual(plain);
      expect(existsSync(dest)).toBe(false);
      writeFileSync(join(staged, 'complete'), 'complete');
    });
    expect(readdirSync(dest)).toEqual(['complete']);
    expect(readdirSync(dir).sort()).toEqual(['backup.enc', 'restored']);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
