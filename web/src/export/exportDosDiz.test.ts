// The DOS ZIP gets a FILE_ID.DIZ from "About this game", and nothing else about the zip changes:
// the game's own files are byte for byte what the project holds.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { exportDos } from './exportDos';
import { GameFiles } from '../project/files';
import { readZip } from '@lewismoten/gamemaker-sandbox-archives/zip';
import { readFileIdDiz } from '../project/fileIdDiz';

const exe = new Uint8Array(readFileSync(new URL('../../../cd/gm/xferplay.exe', import.meta.url)));
const gam = new Uint8Array(readFileSync(new URL('../../../cd/gameware/peach/peach.gam', import.meta.url)));
const runtime = { player: exe, driver: Uint8Array.of(1) };
const base = { title: 'Nebula', gam: 'nebula.gam', date: new Date(2000, 0, 1), runtime };

describe('FILE_ID.DIZ in the DOS export', () => {
  it('is written from the About fields; the game files are unchanged', async () => {
    const files = new GameFiles([['nebula.gam', gam]]);
    const plain = await readZip((await exportDos(files, base)).zip);
    const withAbout = await readZip(
      (await exportDos(files, { ...base, about: { title: 'Nebula Run', author: 'Doc Leo', year: '1994', description: 'Fly a ship.' }, version: '1.1' })).zip,
    );
    expect(plain.find((e) => e.name === 'FILE_ID.DIZ')).toBeUndefined();
    const diz = withAbout.find((e) => e.name === 'FILE_ID.DIZ')!;
    expect(new TextDecoder().decode(diz.data)).toBe('Nebula Run v1.1\r\nby Doc Leo, 1994\r\nFly a ship.\r\n');
    expect(readFileIdDiz(diz.data).about.author).toBe('Doc Leo');
    for (const e of plain) expect(withAbout.find((x) => x.name === e.name)!.data).toEqual(e.data);
    expect(withAbout.map((e) => e.name).filter((n) => !plain.some((e) => e.name === n))).toEqual(['FILE_ID.DIZ']);
  });
});
