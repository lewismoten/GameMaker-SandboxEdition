// Tests: Exporting a game as a DOS folder with PLAYGAME (export/exportDos.ts).
import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { exportDos, dosNameProblems } from '../src/export/exportDos';
import { GameFiles } from '../src/project/files';
import { readZip } from '../src/project/zip';

const cdgm = resolve(__dirname, '../../cd/gm');
const sample = resolve(__dirname, '../../cd/gameware/sample');

function stubFetch(): void {
  vi.stubGlobal('fetch', async (url: string) => {
    const name = String(url).split('/').pop()!;
    const path = join(cdgm, name);
    return existsSync(path) ? new Response(readFileSync(path)) : new Response(null, { status: 404 });
  });
}

describe('DOS export', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('flags names DOS cannot store', () => {
    expect(dosNameProblems(['sample.gam', 'toolongname.map', 'two.dots.pal', 'ok_1.cmf'])).toEqual(['toolongname.map', 'two.dots.pal']);
  });

  it.skipIf(!existsSync(sample) || !existsSync(join(cdgm, 'xferplay.exe')))(
    'names the stand-alone player after the game and keeps its files intact',
    async () => {
      stubFetch();
      const files = new GameFiles(readdirSync(sample).map((n) => [n, new Uint8Array(readFileSync(join(sample, n)))]));
      files.set('game0.sav', new TextEncoder().encode('{}')); // web-only save, must be left out
      const { name, zip, exe } = await exportDos(files, { title: 'SAMPLE GAME', gam: 'sample.gam', appBase: 'http://x/' });
      expect(name).toBe('sample-dos.zip');
      expect(exe).toBe('SAMPLE.EXE');
      const entries = new Map((await readZip(zip)).map((e) => [e.name, e.data]));
      expect(Buffer.compare(entries.get('SAMPLE.EXE')!, readFileSync(join(cdgm, 'xferplay.exe')))).toBe(0);
      expect(entries.has('SNDBLAST.DRV')).toBe(true);
      expect(new TextDecoder().decode(entries.get('CONFIG.BAT'))).toContain('SAMPLE config');
      expect(Buffer.compare(entries.get('SAMPLE.MAP')!, readFileSync(join(sample, 'sample.map')))).toBe(0);
      expect(entries.has('GAME0.SAV')).toBe(false);
      expect(dosNameProblems([...entries.keys()])).toEqual([]);
      // the player's MIT notice and the Borland and Creative parts travel with it
      const readme = new TextDecoder().decode(entries.get('README.TXT'));
      expect(readme).toContain('Copyright (c) 2014 gandrewstone');
      expect(readme).toContain('Permission is hereby granted');
      expect(readme).toContain('Creative Technology');
      expect(readme).toContain('Borland');
    },
  );

  it.skipIf(!existsSync(join(cdgm, 'xferplay.exe')))('keeps a game’s own README.TXT and puts the player’s beside it', async () => {
    stubFetch();
    const files = new GameFiles(readdirSync(sample).map((n) => [n, new Uint8Array(readFileSync(join(sample, n)))]));
    files.set('readme.txt', new TextEncoder().encode('the game’s own'));
    const { zip } = await exportDos(files, { title: 'SAMPLE GAME', gam: 'sample.gam', appBase: 'http://x/' });
    const names = (await readZip(zip)).map((e) => e.name);
    expect(new Set(names).size).toBe(names.length);
    expect(names).toContain('README.TXT');
    expect(names).toContain('PLAYER.TXT');
  });

  it('refuses a .gam name that cannot become an .EXE name', async () => {
    stubFetch();
    await expect(exportDos(new GameFiles([['my game.gam', new Uint8Array(1)]]), { title: 'x', gam: 'my game.gam', appBase: 'http://x/' })).rejects.toThrow(
      /not a DOS file name/,
    );
  });
});
