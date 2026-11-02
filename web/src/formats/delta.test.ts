import { describe, expect, it } from 'vitest';
import { applyDelta, deltaSize, diffVersions } from '@lewismoten/gamemaker-sandbox-tools/delta';

const enc = (s: string) => Uint8Array.from(s, (c) => c.charCodeAt(0));

describe('version deltas', () => {
  it('stores a changed block of a big binary file as a few bytes and rebuilds it exactly', () => {
    const a = new Uint8Array(63000).map((_, i) => i % 251);
    const b = a.slice();
    b.fill(7, 840, 1260); // one block
    const d = diffVersions(new Map([['x.bbl', a]]), new Map([['x.bbl', b]]));
    expect(deltaSize(d)).toBeLessThan(500);
    expect(applyDelta(new Map([['x.bbl', a]]), d).get('x.bbl')).toEqual(b);
  });
  it('handles files that grow, shrink, appear and go', () => {
    const v1 = new Map([
      ['a.map', Uint8Array.of(1, 2, 3, 4)],
      ['gone.pal', Uint8Array.of(9)],
    ]);
    const v2 = new Map([
      ['a.map', Uint8Array.of(1, 5, 3, 4, 8, 8)],
      ['new.mon', Uint8Array.of(2)],
    ]);
    const d = diffVersions(v1, v2);
    expect(applyDelta(v1, d)).toEqual(v2);
    const back = diffVersions(v2, v1);
    expect(applyDelta(v2, back)).toEqual(v1);
    expect(diffVersions(v1, v1)).toEqual({});
  });
  it('stores text files as line patches, byte for byte', () => {
    const a = enc('one\ntwo\nthree\r\nfour');
    const b = enc('one\ntwo\n\xe9 three\r\nfour\nfive');
    const d = diffVersions(new Map([['n.txt', a]]), new Map([['n.txt', b]]));
    expect(d['n.txt'].kind).toBe('lines');
    expect(applyDelta(new Map([['n.txt', a]]), d).get('n.txt')).toEqual(b);
  });
});
