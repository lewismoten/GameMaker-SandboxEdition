// Every Starter's ZIP, as the site build makes it, comes back byte for byte from its .zpart file and
// the shared data (scripts/zipShare.ts, src/project/zipParts.ts), and the split really saves space.
import { describe, expect, it } from 'vitest';
import { resolve } from 'node:path';
import { cdCatalog, cdFiles } from './cdGames';
import { gameArchive, gameZipName } from './gameArchive';
import { shareZips } from './zipShare';
import { decodePart, joinPart } from '../src/project/zipParts';
import { SHARED_DIR } from '../src/project/sharedZip';

const cd = resolve(import.meta.dirname, '../../cd');

describe('zipShare', () => {
  it('splits every Starter and joins each back into its ZIP', { timeout: 120_000 }, async () => {
    const files = cdFiles(cd);
    const starters = cdCatalog(cd).filter((e) => e.series === 'starter');
    expect(starters.length).toBeGreaterThan(50);
    const zips = new Map<string, Uint8Array>();
    for (const e of starters) zips.set(`${e.path}${gameZipName(e)}`, await gameArchive(e, files));
    const { parts, blobs } = shareZips(zips);
    for (const [key, zip] of zips) {
      const part = parts.get(key)!;
      for (const [, , name] of decodePart(part).header.shared) expect(blobs.has(`${SHARED_DIR}${name}.bin`)).toBe(true);
      expect(
        joinPart(part, (name) => blobs.get(`${SHARED_DIR}${name}.bin`)!),
        key,
      ).toEqual(zip);
    }
    const sum = (m: Map<string, Uint8Array>) => [...m.values()].reduce((n, b) => n + b.length, 0);
    // today the shared copy of the DOS player alone saves over 7 MB
    expect(sum(parts) + sum(blobs)).toBeLessThan(sum(zips) * 0.6);
    // the same input splits the same way (blob names are content hashes)
    const again = shareZips(zips);
    expect([...again.blobs.keys()]).toEqual([...blobs.keys()]);
    expect([...again.parts.values()]).toEqual([...parts.values()]);
  });
});
