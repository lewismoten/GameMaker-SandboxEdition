// The DOS bugs feature says only what the code shows: the chunk limit is fli.ts's, FileRead's
// buffer and quiet short read and DoLineCompress's signed count are in RSD's source, the
// AllBlack chunk calls BoxFill, a DOS export carries the help files, Transfer takes A:\NAME,
// RSD's ABOUT.HLP says Version 2.00, Carl's buzz is pitched round 115 Hz, and Lewis's
// screenshot is shipped small and credited.
import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { FLI_CHUNK_MAX } from '../../../formats/fli';
import { DESIGN, DOS_BUGS, designLine } from './dosBugs';

const repo = join(__dirname, '../../../../..');
const read = (path: string, enc: BufferEncoding = 'utf8') => readFileSync(join(repo, path), enc);

describe('the DOS bugs feature', async () => {
  const pages = await DOS_BUGS.pages({ games: [], game: () => undefined });
  const text = JSON.stringify(pages);

  it('runs one or two pages', () => {
    expect(pages.length).toBeGreaterThanOrEqual(1);
    expect(pages.length).toBeLessThanOrEqual(2);
  });

  it('gives the chunk limit fli.ts writes', () => {
    expect(text).toContain(`${FLI_CHUNK_MAX.toLocaleString('en-US')}-byte buffer`);
    expect(text).toContain(`no chunk over ${FLI_CHUNK_MAX.toLocaleString('en-US')} bytes`);
  });

  it('describes FileRead and the FLI decoder as RSD wrote them', () => {
    const fileRead = read('code/DRV/FILECLSS.CPP');
    expect(fileRead).toContain('if (blen>0x0000FFF0) blen=0x0000FFF0;'); // up to 65,520 bytes
    expect(text).toContain((0xfff0).toLocaleString('en-US'));
    expect(fileRead).toMatch(/buf = new uchar \[blen\]; blen-=2;/); // smaller when memory is short
    expect(fileRead).toContain('Bytes=End-idx;'); // hands over less, and says nothing
    const fli = read('code/Image/FLI/FLI.CPP');
    expect(fli).toContain('static void DoLineCompress(char *Data'); // the count is a signed char
    expect(fli).toContain('NumPackets= (int) (*Data);');
    expect(fli).toMatch(/case AllBlack:[\s\S]{0,80}Vid->BoxFill/);
    // VideoMode (code/DRV/DRIVER.INC) runs GetCols, GetColsRev, Line, Box, BoxFill: VGAScrn
    // fills GetCols and leaves the next four, BoxFill among them, as 0
    expect(read('code/DRV/DRIVER.INC')).toMatch(/GetCols\s+dd\s+0\s+GetColsRev\s+dd\s+0\s+Line\s+dd\s+0\s+Box\s+dd\s+0\s+BoxFill\s+dd/);
    expect(read('code/DRV/VGAOBJ.ASM')).toMatch(/_VGAScrn\s+VideoMode\s+<[^>]*GetColsL256,0,0,0,0,/);
  });

  it('names the help files a DOS export carries, and the paths Transfer takes', () => {
    const exportDos = read('web/src/export/exportDos.ts');
    for (const f of ['CONFIG.HLP', 'GMHELP.TXT']) (expect(exportDos).toContain(f), expect(text).toContain(f));
    expect(read('web/src/retro/gm.ts')).toContain('A:\\\\NAME');
  });

  it('quotes Version 2.00 from RSD’s own ABOUT.HLP', () => {
    // a help screen is character and color pairs: every other byte is the text
    const bytes = readFileSync(join(repo, 'cd/gm/about.hlp'));
    const chars = (from: number) => String.fromCharCode(...bytes.filter((_, i) => i % 2 === from));
    expect([chars(0), chars(1)].some((t) => t.includes('Version 2.00'))).toBe(true);
    expect(text).toContain('Version 2.00');
  });

  it('pitches Carl’s buzz as the game does', () => {
    const src = read('games/carl/src/sound/sounds.ts');
    const buzz = /const BUZZ = \[([\d, ]+)\]/.exec(src)![1].split(',').map(Number);
    const mean = buzz.reduce((s, f) => s + f, 0) / buzz.length;
    expect(Math.abs(mean - 115)).toBeLessThan(5);
    expect(text).toContain('115 Hz');
  });

  it('lists each design problem with whether it is fixed', () => {
    for (const d of DESIGN) expect(text).toContain(JSON.stringify(designLine(d)).slice(1, -1));
  });

  it('ships Lewis’s screenshot small, and credits it', () => {
    expect(statSync(join(repo, 'web/public/magazine/dos-carl.webp')).size).toBeLessThan(100_000);
    expect(read('NOTICE.md')).toContain('dos-carl.webp');
  });
});
