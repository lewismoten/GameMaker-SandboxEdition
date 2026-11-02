import { describe, expect, it } from 'vitest';
import { emptyBlock } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { planRanges, syncRange, type SyncFile } from '@lewismoten/gamemaker-sandbox-tools/palette-reserve';

const pal = (colors: Record<number, [number, number, number]>) => {
  const p = new Uint8Array(768);
  for (const [i, c] of Object.entries(colors)) p.set(c, Number(i) * 3);
  return p;
};
const block = (fill: number[]) => {
  const b = emptyBlock(0);
  b.pixels = new Uint8Array(400).map((_, i) => fill[i % fill.length]);
  return b;
};

describe('planRanges', () => {
  it('sizes a window by the distinct colors and avoids numbers other blocks draw with', () => {
    const others = new Array(256).fill(0);
    for (let i = 16; i < 40; i++) others[i] = 100;
    const [r] = planRanges([{ role: 'monster', distinct: 8, usage: new Array(256).fill(0) }], others);
    expect(r.last - r.first + 1).toBe(8);
    expect(r.first).toBeGreaterThanOrEqual(40);
    expect(r.conflicts).toBe(0);
  });
  it('keeps two roles apart and caps the size', () => {
    const none = new Array(256).fill(0);
    const rs = planRanges(
      [
        { role: 'monster', distinct: 200, usage: none },
        { role: 'character', distinct: 5, usage: none },
      ],
      none,
    );
    expect(rs).toHaveLength(2);
    expect(rs[0].last - rs[0].first + 1).toBe(48);
    expect(rs[0].last).toBeLessThan(rs[1].first);
  });
});

describe('syncRange', () => {
  const red: [number, number, number] = [60, 0, 0];
  const green: [number, number, number] = [0, 60, 0];
  it('moves colors into the range and copies it to every palette', () => {
    const a = pal({ 100: red, 101: green, 30: [1, 2, 3] });
    const b = pal({ 100: red, 101: green, 30: [9, 9, 9] });
    const f: SyncFile = { blocks: [block([100, 101])], shown: new Set([0]), palettes: ['a', 'b'] };
    const r = syncRange(
      [f],
      new Map([
        ['a', a],
        ['b', b],
      ]),
      50,
      52,
      new Map(),
    );
    if (!r.ok) throw new Error(r.why);
    const px = r.pixels.get(0)!.get(0)!;
    expect(new Set(px).size).toBe(2);
    for (const v of px) expect(v >= 50 && v <= 52).toBe(true);
    expect(r.score.worst).toBe(0); // same colors, so the scenes draw the same
    const [pa, pb] = [r.palettes.get('a')!, r.palettes.get('b')!];
    expect(Array.from(pa.subarray(150, 159))).toEqual(Array.from(pb.subarray(150, 159)));
    expect(pa[px[0] * 3] + pa[px[0] * 3 + 1]).toBe(60);
  });
  it('scores a color that differs between palettes', () => {
    const a = pal({ 100: red });
    const b = pal({ 100: green });
    const f: SyncFile = { blocks: [block([100])], shown: new Set([0]), palettes: ['a', 'b'] };
    const r = syncRange(
      [f],
      new Map([
        ['a', a],
        ['b', b],
      ]),
      50,
      50,
      new Map(),
    );
    if (!r.ok) throw new Error(r.why);
    expect(r.score.worst).toBeGreaterThan(20);
    expect(r.score.flagged).toEqual([0]);
  });
  it('reduces the least used colors when the range is too small', () => {
    const a = pal({ 100: red, 101: [58, 2, 2], 102: green });
    const f: SyncFile = { blocks: [block([100, 100, 100, 101, 102])], shown: new Set([0]), palettes: ['a'] };
    const r = syncRange([f], new Map([['a', a]]), 50, 51, new Map());
    if (!r.ok) throw new Error(r.why);
    expect(r.reduced).toBe(1);
    expect(new Set(r.pixels.get(0)!.get(0)).size).toBe(2);
  });
  it('refuses when other blocks draw with a color in the range', () => {
    const a = pal({ 100: red });
    const f: SyncFile = { blocks: [block([100])], shown: new Set([0]), palettes: ['a'] };
    expect(syncRange([f], new Map([['a', a]]), 50, 51, new Map([['a', new Set([51])]])).ok).toBe(false);
  });
});
