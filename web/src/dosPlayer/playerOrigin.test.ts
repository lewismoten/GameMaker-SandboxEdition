// An imported game's player record: read back from the companion, its About page on Play's F10
// (with the build the game was first made with), and a 3.00 player's own bytes in the DOS
// download, byte for byte. Synthetic players only (the CD's XFERPLAY edited here).
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { adoptPlayer, buildData } from '@lewismoten/gamemaker-sandbox-archives/project/importPlayer';
import { readZip } from '@lewismoten/gamemaker-sandbox-archives/zip';
import { md5Hex } from '@lewismoten/gamemaker-sandbox-archives/player/md5';
import { drawAbout } from '@lewismoten/gamemaker-sandbox-engine/engine/funcKeys';
import { playerLook } from '@lewismoten/gamemaker-sandbox-engine/engine/playerLook';
import type { Screen } from '@lewismoten/gamemaker-sandbox-engine/gfx/screen';
import { emptyCompanion, setSection } from '../project/companion';
import { GameFiles } from '../project/files';
import { exportDos } from '../export/exportDos';
import { companionOrigin, keptParts, ORIGIN_SECTION, playerAbout } from './playerOrigin';

const stock = new Uint8Array(readFileSync(new URL('../../../cd/gm/xferplay.exe', import.meta.url)));
const gam = new Uint8Array(readFileSync(new URL('../../../cd/gameware/peach/peach.gam', import.meta.url)));
const put = (exe: Uint8Array, o: number, s: string) => [...s].forEach((c, i) => (exe[o + i] = c.charCodeAt(0)));

/** A 3.00 player whose author wrote their own About page's first two lines. */
function authorsPlayer(): Uint8Array {
  const exe = stock.slice();
  const b = buildData('3.00')!;
  put(exe, b.about[0], '   NEBULA SOFTWARE       ');
  put(exe, b.about[1], 'copyright 1995 by Nobody ');
  return exe;
}

/** What a stub screen was asked to write: [y, text]. */
function written(page: number, about: ReturnType<typeof playerAbout>): [number, string][] {
  const out: [number, string][] = [];
  const screen = { write: (_x: number, y: number, _c: number, t: string) => out.push([y, t]), box: () => {}, boxFill: () => {} } as unknown as Screen;
  drawAbout(screen, new Uint8Array(768), playerLook({}, about), page);
  return out;
}

describe('the imported player record', () => {
  it('reads back from the companion, and a damaged one as none', () => {
    const r = adoptPlayer(new GameFiles([['nebula.gam', gam]]), [{ name: 'NEBULA.EXE', bytes: authorsPlayer() }])!;
    const c = emptyCompanion();
    setSection(c, 'nebula.gam', ORIGIN_SECTION, JSON.parse(JSON.stringify(r.origin)));
    expect(companionOrigin(c, 'nebula.gam')).toMatchObject({ build: '3.00', aboutAuthor: 'Nobody', exe: 'NEBULA.EXE' });
    setSection(c, 'nebula.gam', ORIGIN_SECTION, { build: 3 });
    expect(companionOrigin(c, 'nebula.gam')).toBeUndefined();
  });

  it('shows the author’s About page on F10, and the build it was first made with', () => {
    const r = adoptPlayer(new GameFiles(), [{ name: 'NEBULA.EXE', bytes: authorsPlayer() }])!;
    const about = playerAbout(r.origin);
    expect(written(0, about).slice(0, 2)).toEqual([
      [40, '   NEBULA SOFTWARE       '],
      [48, 'copyright 1995 by Nobody '],
    ]);
    expect(written(1, about).map(([, t]) => t)).toEqual(expect.arrayContaining(['Originally made with', 'Game-Maker 3.00.']));
  });

  it('says what is known of a player of no known build', () => {
    expect(playerAbout({ build: 'unknown', label: '', aboutAuthor: 'X' } as never)!.origin!.join(' ')).toBe(
      'Originally made with Game-Maker (version unknown, about text replaced by its author).',
    );
    // this edition's own words stay, with the line after them
    const lines = written(1, { origin: ['Originally made with', 'Game-Maker 2.02.'] });
    expect(lines[0][1]).toMatch(/^Game-Maker software/);
    expect(lines.at(-1)).toEqual([88, 'Game-Maker 2.02.']);
  });

  it('writes a 3.00 player’s own bytes back in the DOS download, byte for byte', async () => {
    const exe = authorsPlayer();
    const r = adoptPlayer(new GameFiles(), [{ name: 'NEBULA.EXE', bytes: exe }])!;
    const { zip } = await exportDos(new GameFiles([['nebula.gam', gam]]), {
      title: 'Nebula',
      gam: 'nebula.gam',
      player: r.patches,
      kept: keptParts(r.origin),
      runtime: { player: stock, driver: Uint8Array.of(1) },
      date: new Date(2000, 0, 1),
    });
    const entries = await readZip(zip);
    expect(md5Hex(entries.find((e) => e.name === 'NEBULA.EXE')!.data)).toBe(md5Hex(exe));
    expect(new TextDecoder().decode(entries.find((e) => e.name === 'README.TXT')!.data)).toMatch(/written back unchanged/);
  });

  it('keeps an older build’s bytes out of the 3.00 download', () => {
    expect(keptParts({ build: '2.02', regions: [{ offset: 0, data: 'AA==' }], importPatches: {} } as never)).toBeUndefined();
  });
});
