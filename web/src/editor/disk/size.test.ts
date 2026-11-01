import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { HIGH, LOW, RUNTIME_FILES, disksFor, floppyLine, sizeUp } from './size';
import { GameFiles } from '../../project/files';
import { serializeGame, newGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';

describe('disk size', () => {
  it('uses the sizes of the runtime files on the CD', () => {
    const size = (n: string) => readFileSync(new URL(`../../../../cd/gm/${n}`, import.meta.url)).length;
    for (const n of ['xferplay.exe', 'sndblast.drv', 'config.hlp']) expect(RUNTIME_FILES.find(([f]) => f.toLowerCase() === n)![1]).toBe(size(n));
  });

  it('packs whole files into clusters, a directory entry each', () => {
    expect(disksFor([1], HIGH)).toBe(1);
    expect(disksFor([HIGH.clusters * 512], HIGH)).toBe(1);
    expect(disksFor([HIGH.clusters * 512, 1], HIGH)).toBe(2);
    expect(disksFor([730_112], LOW)).toBe(1);
    expect(disksFor([730_113], LOW)).toBe(Infinity);
    // 113 tiny files need 113 root entries: a second 720 KB disk, but one 1.44 MB disk
    expect(disksFor(new Array(113).fill(1), LOW)).toBe(2);
    expect(disksFor(new Array(113).fill(1), HIGH)).toBe(1);
  });

  it('counts the export and the files nothing names', () => {
    const f = new GameFiles();
    f.set('g.gam', serializeGame(newGame('G')));
    f.set('spare.map', new Uint8Array(20000));
    f.set('game1.sav', new Uint8Array(500));
    const s = sizeUp(f, 'g.gam');
    expect(s.unused.map(([n]) => n)).toEqual(['spare.map']);
    expect(s.game).toBe(f.get('g.gam')!.length + 20000);
    expect(s.disks).toEqual({ high: 1, low: 1 });
    expect(floppyLine(s)).toMatch(/fits on one low density disk/);
  });
});
