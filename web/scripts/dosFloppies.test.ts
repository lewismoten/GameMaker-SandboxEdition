// Exercise the disk-layout command as a user runs it, including safe output-directory refusal.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { expect, it } from 'vitest';
import { exportDos } from '../src/export/exportDos';
import { GameFiles } from '../src/project/files';

it('writes disk directories from a real export ZIP and refuses to overwrite existing output', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'dos-floppies-'));
  try {
    const { zip } = await exportDos(new GameFiles([['test.gam', Uint8Array.of(9)]]), {
      title: 'Test',
      gam: 'test.gam',
      runtime: { player: Uint8Array.of(1), driver: Uint8Array.of(2) },
    });
    const input = join(dir, 'game.zip');
    const output = join(dir, 'floppies');
    writeFileSync(input, zip);
    const run = () =>
      execFileSync(process.execPath, [resolve('../node_modules/vite-node/vite-node.mjs'), 'scripts/dosFloppies.ts', input, output], {
        cwd: resolve('.'),
        encoding: 'utf8',
        stdio: 'pipe',
      });
    expect(run()).toContain('disk 1');
    expect(readFileSync(join(output, 'DISK1', 'TEST.GAM'))).toEqual(Buffer.from([9]));
    expect(existsSync(join(output, 'DISK1', 'INSTALL.BAT'))).toBe(true);
    expect(existsSync(join(output, 'DISK1', 'DISK1.ID'))).toBe(true);
    expect(() => run()).toThrow();
    expect(readFileSync(join(output, 'DISK1', 'TEST.GAM'))).toEqual(Buffer.from([9]));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}, 30000);
