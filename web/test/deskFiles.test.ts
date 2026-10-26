// A game downloaded on the desk PC: laid out as Game-Maker's transfer left it, and GMCRACK's
// patched player.
import { describe, expect, it } from 'vitest';
import { configBat, gameDownloadNodes } from '../src/retro/hacks/deskFiles';
import { pcExtras } from '../src/retro/hacks/pcExtras';
import type { CatalogEntry } from '../src/project/files';
import type { ProgramRef } from '../src/retro/dos/vfs';

const goat: CatalogEntry = {
  id: 'goat',
  title: 'Third Goat from the Left',
  kind: 'shareware',
  path: 'games/goat',
  exe: 'GOAT.EXE',
  gam: 'goat.gam',
  files: ['goat.gam'],
  notice: 'Shareware!',
};
const files = async () => new Map<string, Uint8Array>();
const run: ProgramRef & { kind: 'game' } = { kind: 'game', title: goat.title, gam: 'goat.gam', files, notice: goat.notice, saveId: 'game:goat' };
const date = new Date(1995, 0, 1);
const names = () => gameDownloadNodes(goat, date, run).map((n) => n.name);
const node = (name: string) => gameDownloadNodes(goat, date, run).find((n) => n.name === name);

describe('a downloaded game folder', () => {
  it('is laid out as Game-Maker transfer left it: the player named after the game, CONFIG.BAT, CONFIG.HLP, SNDBLAST.DRV', async () => {
    pcExtras().setCracked('goat', false);
    expect(names()).toEqual(['GOAT.EXE', 'CONFIG.BAT', 'CONFIG.HLP', 'SNDBLAST.DRV', 'FILE_ID.DIZ']);
    expect(configBat('goat.gam')).toBe('GOAT configure\r\n');
    const bat = node('CONFIG.BAT')!;
    expect(new TextDecoder().decode(await bat.read!())).toBe('GOAT configure\r\n');
    expect(bat.run).toEqual({ kind: 'batch', lines: ['GOAT configure'] });
    expect(node('GOAT.EXE')!.run).toBe(run);
  });

  it('a CD game keeps its own CONFIG.HLP (or none, like ORB)', () => {
    const list = (f: string[]) => gameDownloadNodes({ ...goat, id: 'gridlin', files: f }, date, run).map((n) => n.name);
    expect(list(['goat.gam', 'config.hlp', 'gmhelp.txt'])).not.toContain('CONFIG.HLP');
    expect(list(['goat.gam', 'gmhelp.txt'])).not.toContain('CONFIG.HLP');
  });

  it('cracked: GOAT.EXE becomes the patched player (still GOAT.GAM and its saves) and the original is GOAT.BAK; uncracked it is back', () => {
    pcExtras().setCracked('goat', true);
    expect(names()).toEqual(['GOAT.EXE', 'GOAT.BAK', 'CONFIG.BAT', 'CONFIG.HLP', 'SNDBLAST.DRV', 'FILE_ID.DIZ']);
    const exe = node('GOAT.EXE')!;
    expect(exe.run).toMatchObject({ kind: 'game', gam: 'goat.gam', saveId: 'game:goat', cracked: 'GOAT.EXE', title: goat.title });
    expect((exe.run as { files: unknown }).files).toBe(files);
    expect(exe.size).toBeGreaterThan(node('GOAT.BAK')!.size);
    expect(node('GOAT.BAK')!.run).toBeUndefined(); // DOS won't run a .BAK
    pcExtras().setCracked('goat', false);
    expect(names()).not.toContain('GOAT.BAK');
    expect(node('GOAT.EXE')!.run).toBe(run);
  });
});
