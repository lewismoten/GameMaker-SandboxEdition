// A CD game is found in the known-games table by its content fingerprint, and a changed data file
// (a map, say) is a different game even when the .gam is the same.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { contentFingerprint } from './contentFingerprint';
import knownTable from './knownGames.json';
import { tagInfo, VIEWS, GENRES, THEMES, type KnownGame } from './knownGame';

const table = knownTable as unknown as Record<string, KnownGame>;

const dir = join(__dirname, '../../../cd/gameware/volume');
const read = (n: string) => new Uint8Array(readFileSync(join(dir, n)));

describe('known games', () => {
  const gam = read('volume.gam');
  const get = (n: string) => {
    try {
      return read(n.toLowerCase());
    } catch {
      return undefined;
    }
  };
  it('matches a CD game', async () => {
    const fp = await contentFingerprint(gam, get);
    expect(fp && table[fp]).toBeTruthy();
  });
  it("gives a curated CD game its curated tags, not the rules' guesses", async () => {
    const fp = await contentFingerprint(gam, get);
    const info = tagInfo(fp ? table[fp] : undefined, () => ['guess']);
    expect(info.known).toBe(true);
    expect(info.tags).toEqual(['mixed', 'adventure']);
    expect(info.levels).toBe(18);
  });
  it('curated rows use only the view, genre and theme words', () => {
    const words = new Set<string>([...VIEWS, ...GENRES, ...THEMES]);
    for (const row of Object.values(table)) if (row.c) for (const t of row.t) expect(words, t).toContain(t);
  });
  it('does not match when a data file differs', async () => {
    const same = await contentFingerprint(gam, get);
    const other = await contentFingerprint(gam, (n) => {
      const b = get(n);
      return b && /\.map$/i.test(n) ? b.slice(0, b.length - 1) : b;
    });
    expect(other).not.toBe(same);
  });
});
