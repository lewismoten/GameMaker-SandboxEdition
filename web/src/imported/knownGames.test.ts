// A CD game is found in the known-games table by its content fingerprint, and a changed data file
// (a map, say) is a different game even when the .gam is the same.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { contentFingerprint } from './contentFingerprint';
import table from './knownGames.json';

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
    expect(fp && (table as Record<string, string[]>)[fp]).toBeTruthy();
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
