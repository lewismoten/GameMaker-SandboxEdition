// Tests: The Sofa's file library (retro/bbs/sofaFiles.ts) and its FILE_ID.DIZ (fileId.ts).
import { describe, expect, it } from 'vitest';
import type { CatalogEntry } from '../src/project/files';
import { DIZ_LINES, DIZ_WIDTH, gameDiz } from '../src/retro/bbs/fileId';
import { sofaLibrary, sofaZipName } from '../src/retro/bbs/sofaFiles';

const entry = (id: string, company: string, original = true): CatalogEntry => ({
  id,
  title: id.toUpperCase(),
  kind: 'shareware',
  path: `games/originals/${id}/`,
  gam: `${id}.gam`,
  files: [`${id}.gam`],
  company,
  exe: `${id.toUpperCase()}.EXE`,
  ...(original ? { original: {} } : {}),
});

describe('The Sofa file library', () => {
  const goat = entry('goat', 'The Bard of Bizarre');
  it("lists only the board's own uploads, not Sandbox Software's or the CD's shareware", () => {
    expect(sofaLibrary([goat, entry('snowbound', 'Sandbox Software'), entry('orb', 'Josh Turcotte', false)]).map((g) => g.id)).toEqual(['goat']);
  });
  it('names the ZIP after the program', () => expect(sofaZipName(goat)).toBe('GOAT.ZIP'));
  it("signs the DIZ from Doc Leo to The Sofa, within the DIZ's limits", () => {
    const diz = gameDiz(goat);
    expect(diz[diz.length - 1]).toBe('Uploaded by DOC LEO to THE SOFA BBS');
    expect(diz.length).toBeLessThanOrEqual(DIZ_LINES);
    for (const l of diz) expect(l.length).toBeLessThanOrEqual(DIZ_WIDTH);
    expect(gameDiz(entry('snowbound', 'Sandbox Software')).at(-1)).toMatch(/SANDBOX BBS/);
  });
});
