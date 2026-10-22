import { describe, expect, it } from 'vitest';
import { DIZ_LINES, DIZ_WIDTH, ascii, dizBytes, gameDiz, newestPicture, pictureDiz, wrapWords } from '../src/retro/bbs/fileId';
import type { CatalogEntry } from '../src/project/files';
import { GALLERY } from '../src/retro/bbs/gallery';

const game = (over: Partial<CatalogEntry>): CatalogEntry => ({ id: 'teddy', title: "Teddy's Little Big Adventure", kind: 'shareware', path: '', gam: 'teddy.gam', files: [], ...over });

const legal = (lines: string[]) => {
  expect(lines.length).toBeLessThanOrEqual(DIZ_LINES);
  for (const l of lines) {
    expect(l.length).toBeLessThanOrEqual(DIZ_WIDTH);
    expect(/^[\x20-\x7e]*$/.test(l)).toBe(true);
  }
};

describe('FILE_ID.DIZ', () => {
  it('keeps a game within 10 lines of 45 ASCII columns', () => {
    const long = game({ title: 'KEEP IT BRIEF! The Tiny Pockets Library and a much longer name', company: 'Sandbox Software', year: 1995, price: '$7–$15', original: {} as CatalogEntry['original'], blurb: '“Hi.” '.repeat(80) });
    const lines = gameDiz(long);
    legal(lines);
    expect(lines[0].endsWith('[1/1]')).toBe(true);
    expect(lines.at(-1)).toContain('vesuvian');
    expect(lines.join('\n')).toContain('$7-$15');
  });

  it('credits callers for other authors’ games and uses the uploader’s summary', () => {
    const lines = gameDiz(game({ id: 'signhdg', title: 'Sign of the Hedgehog', company: 'A-J Games', price: '$20', blurb: 'x' }));
    legal(lines);
    expect(lines.join(' ')).toContain('crumpets');
    expect(lines.at(-1)).not.toContain('vesuvian');
  });

  it('describes every gallery picture', () => {
    for (const f of GALLERY) {
      const lines = pictureDiz(f);
      legal(lines);
      expect(lines[0]).toContain(f.name);
    }
  });

  it('writes CR LF text', () => {
    expect(new TextDecoder().decode(dizBytes(['A', 'B']))).toBe('A\r\nB\r\n');
  });

  it('makes text plain ASCII and wraps words', () => {
    expect(ascii('Gwinn’s “CHEZ” — café…')).toBe('Gwinn\'s "CHEZ" - cafe...');
    expect(wrapWords('one two three four', 9)).toEqual(['one two', 'three', 'four']);
  });

  it('finds the newest picture', () => {
    const when: Record<string, number> = { A: 1, B: 3, C: 2 };
    expect(newestPicture([{ name: 'A' }, { name: 'B' }, { name: 'C' }, { name: 'D' }], (n) => when[n])?.name).toBe('B');
  });
});
