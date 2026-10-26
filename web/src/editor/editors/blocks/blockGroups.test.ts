// Tests for blockGroups.ts: groups kept in the companion file, layouts, joining and splitting.
import { describe, expect, it } from 'vitest';
import { BLEN } from '../../../formats/blocks';
import { cellOf, groupOf, groupsWith, joinGroup, layoutFor, neighborGroup, readGroups, sameGroup, splitGroup, writeGroups } from './blockGroups';

const block = (v: number) => ({ pixels: new Uint8Array(BLEN * BLEN).fill(v) });

function store() {
  const data = new Map<string, unknown>();
  return {
    data,
    extras: <T>(f: string, s: string, fb: T) => (data.get(`${f}|${s}`) as T) ?? fb,
    setExtras: (f: string, s: string, v: unknown) => (v === undefined ? data.delete(`${f}|${s}`) : data.set(`${f}|${s}`, v)),
  };
}

describe('block groups', () => {
  it('keeps groups in the companion and cleans what it reads', () => {
    const s = store();
    writeGroups(s, 'a.bbl', [neighborGroup('Sign', 10, 2, 1, 150)]);
    expect(readGroups(s, 'a.bbl', 150)).toEqual([{ name: 'Sign', cols: 2, rows: 1, cells: [10, 11] }]);
    s.setExtras('a.bbl', 'groups', [{ name: ' ', cols: 99, rows: 1, cells: [1, 500] }, { cols: 1, rows: 1, cells: [-1] }, 'junk']);
    const g = readGroups(s, 'a.bbl', 150);
    expect(g).toHaveLength(1);
    expect(g[0].name).toBe('Group');
    expect(g[0].cols).toBe(8);
    expect(g[0].cells.slice(0, 2)).toEqual([1, -1]);
    writeGroups(s, 'a.bbl', []);
    expect(s.data.size).toBe(0);
  });

  it('finds a block in its groups', () => {
    const g = groupOf('Poster', [4, 5, 6, 7], 2, 2, 100)!;
    expect(groupsWith([g], 6)).toEqual([g]);
    expect(groupsWith([g], 8)).toEqual([]);
    expect(cellOf(g, 7)).toEqual({ col: 1, row: 1 });
    expect(sameGroup(g, neighborGroup('x', 4, 2, 2, 100))).toBe(true);
    expect(neighborGroup('end', 98, 2, 2, 100).cells).toEqual([98, 99, -1, -1]);
  });

  it('suggests layouts', () => {
    expect(layoutFor(4)).toEqual({ cols: 2, rows: 2 });
    expect(layoutFor(3)).toEqual({ cols: 3, rows: 1 });
    expect(layoutFor(12)).toEqual({ cols: 4, rows: 3 });
  });

  it('joins blocks into one picture and splits it back', () => {
    const blocks = [block(1), block(2), block(3)];
    const g = groupOf('g', [0, 1, 2, -1], 2, 2, 3)!;
    const big = joinGroup(g, blocks, 255);
    const w = 2 * BLEN;
    expect(big.length).toBe(w * 2 * BLEN);
    expect(big[0]).toBe(1);
    expect(big[BLEN]).toBe(2);
    expect(big[BLEN * w]).toBe(3);
    expect(big[BLEN * w + BLEN]).toBe(255);
    big[BLEN * w - 1] = 9; // the right block's bottom right pixel
    const parts = splitGroup(g, big);
    expect([...parts.keys()]).toEqual([0, 1, 2]);
    expect(parts.get(1)![BLEN * BLEN - 1]).toBe(9);
    expect(parts.get(0)!.every((v) => v === 1)).toBe(true);
  });
});
