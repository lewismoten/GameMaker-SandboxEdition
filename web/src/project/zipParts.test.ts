// A ZIP split into a .zpart file and shared data joins back byte for byte, and a wrong piece is refused.
import { describe, expect, it } from 'vitest';
import { createZip } from '@lewismoten/gamemaker-sandbox-archives/zip';
import { decodePart, encodePart, joinPart, zipDataRanges } from './zipParts';

const noise = (n: number, seed: number) => Uint8Array.from({ length: n }, (_, i) => (i * 7919 + seed * 104729) % 251);

describe('zipParts', async () => {
  const zip = await createZip(
    [
      { name: 'A.GAM', data: noise(3000, 1) },
      { name: 'B.TXT', data: new TextEncoder().encode('hello') },
      { name: 'C.EXE', data: noise(5000, 2) },
    ],
    new Date(2000, 0, 1),
  );
  const ranges = zipDataRanges(zip);
  const blobs = new Map(ranges.map(([o, l], i) => [`b${i}`, zip.slice(o, o + l)]));

  it('ignores an EOCD signature embedded in a legal archive comment', () => {
    const commented = new Uint8Array(zip.length + 24);
    commented.set(zip);
    const view = new DataView(commented.buffer);
    view.setUint16(zip.length - 2, 24, true);
    view.setUint32(zip.length, 0x06054b50, true);
    view.setUint16(zip.length + 10, 1, true);
    expect(zipDataRanges(commented)).toEqual(ranges);
    expect(joinPart(encodePart(commented, []), () => new Uint8Array())).toEqual(commented);
  });

  it('finds each entry’s stored data', () => {
    expect(ranges).toHaveLength(3);
    expect(ranges.every(([o, l]) => o > 0 && o + l < zip.length)).toBe(true);
  });

  it('joins any choice of shared ranges back into the same bytes', () => {
    for (const pick of [[], [0], [2], [0, 2], [0, 1, 2]]) {
      const shared = pick.map((i) => [ranges[i][0], ranges[i][1], `b${i}`] as [number, number, string]);
      const part = encodePart(zip, shared);
      expect(part.length).toBe(9 + JSON.stringify({ size: zip.length, shared }).length + zip.length - shared.reduce((n, s) => n + s[1], 0));
      expect(decodePart(part).header.shared).toEqual(shared);
      expect(joinPart(part, (n) => blobs.get(n)!)).toEqual(zip);
    }
  });

  it('refuses shared data of the wrong length, and a file that is not a .zpart', () => {
    const part = encodePart(zip, [[ranges[2][0], ranges[2][1], 'b2']]);
    expect(() => joinPart(part, () => new Uint8Array(3))).toThrow(/not/);
    expect(() => decodePart(zip)).toThrow(/not a .zpart/);
  });
});
