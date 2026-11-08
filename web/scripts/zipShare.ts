// Splits a set of game ZIPs into .zpart files and the stored entry data two or more of them share
// (src/project/zipParts.ts): the site ships each piece once, and the browser joins a game's ZIP back
// together, byte for byte. Blob names are content hashes, so a build's output depends only on the ZIPs.
import { createHash } from 'node:crypto';
import { encodePart, zipDataRanges, type SharedRange } from '../src/project/zipParts';
import { SHARED_DIR } from '../src/project/sharedZip';

/** Entry data under this size stays in each .zpart: a file of its own would cost more than it saves. */
export const MIN_SHARED = 1024;

/** A game's .zpart file name, from its ZIP's. */
export const partName = (pack: string): string => pack.replace(/\.zip$/i, '.zpart');

/**
 * `zips` by any key: each one's .zpart (same key) and the shared data by site path
 * (games/shared/<name>.bin), sorted by path.
 */
export function shareZips(zips: ReadonlyMap<string, Uint8Array>, min = MIN_SHARED): { parts: Map<string, Uint8Array>; blobs: Map<string, Uint8Array> } {
  const ranges = new Map<string, { offset: number; length: number; name: string }[]>();
  const users = new Map<string, Set<string>>();
  for (const [key, zip] of zips) {
    const list = zipDataRanges(zip)
      .filter(([, length]) => length >= min)
      .map(([offset, length]) => ({
        offset,
        length,
        name: createHash('sha256')
          .update(zip.subarray(offset, offset + length))
          .digest('hex')
          .slice(0, 24),
      }));
    ranges.set(key, list);
    for (const r of list) (users.get(r.name) ?? users.set(r.name, new Set()).get(r.name)!).add(key);
  }
  const blobs = new Map<string, Uint8Array>();
  const parts = new Map<string, Uint8Array>();
  for (const [key, zip] of zips) {
    const shared: SharedRange[] = [];
    for (const r of ranges.get(key)!.sort((a, b) => a.offset - b.offset)) {
      if (users.get(r.name)!.size < 2) continue;
      shared.push([r.offset, r.length, r.name]);
      blobs.set(`${SHARED_DIR}${r.name}.bin`, zip.slice(r.offset, r.offset + r.length));
    }
    parts.set(key, encodePart(zip, shared));
  }
  return { parts, blobs: new Map([...blobs].sort(([a], [b]) => (a < b ? -1 : 1))) };
}
