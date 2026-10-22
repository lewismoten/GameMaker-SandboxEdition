// Tests: DOS names for files the CD renamed with underscores (export/exportDos.ts dosNames).
import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { GameFiles } from '../src/project/files';
import { dosNames } from '../src/export/exportDos';

const dir = join(__dirname, '../../cd/sharware/ajquest');

describe('dosNames', () => {
  it('gives CD underscore names back the DOS names the game uses', () => {
    const files = new GameFiles(readdirSync(dir).map((n) => [n, new Uint8Array(readFileSync(join(dir, n)))] as [string, Uint8Array]));
    const gam = files.names().find((n) => n.endsWith('.gam'))!;
    const map = dosNames(files, gam);
    expect(map.get('a_j.chr')).toBe('a-j.chr');
    for (const [from, to] of map) {
      expect(files.names()).toContain(from);
      expect(to).not.toBe(from);
    }
  });

  it('leaves a game without such names alone', () => {
    const files = new GameFiles([['x.gam', new Uint8Array(0)]]);
    expect(dosNames(files, 'x.gam').size).toBe(0);
  });
});
