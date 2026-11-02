// Joining background sets: blocks move into free slots, twins are reused, carried numbers stay put.
import { describe, expect, it } from 'vitest';
import { emptyBlock, type Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import type { GameMap } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { mergeBackgroundSets } from '@lewismoten/gamemaker-sandbox-tools/block-merge';

const set = (draw: Record<number, number>, edit?: (i: number, b: Block) => void): Block[] =>
  Array.from({ length: 150 }, (_, i) => {
    const b = emptyBlock(i);
    if (i in draw) b.pixels.fill(draw[i]);
    edit?.(i, b);
    return b;
  });
const map = (cells: number[]): GameMap => ({
  blocks: Uint8Array.from([...cells, ...new Array(10000 - cells.length).fill(0)]),
  mons: new Uint8Array(10000),
  monsters: [],
});
const input = (keep: Block[], drop: Block[], used: number[], pinned: number[] = [0], keepUsed = [0]) => ({
  keep,
  drop,
  dropMaps: [map(used)],
  dropUsed: new Set([0, ...used]),
  dropPinned: new Set(pinned),
  keepUsed: new Set(keepUsed),
});

describe('mergeBackgroundSets', () => {
  it('reuses an identical block, moves the others into free slots and renumbers the map', () => {
    const r = mergeBackgroundSets(input(set({ 1: 10, 2: 20 }), set({ 1: 20, 2: 30, 3: 40 }), [1, 2, 3], [0], [0, 1, 2]));
    if (typeof r === 'string') throw new Error(r);
    expect(r.at.get(1)).toBe(2); // same pixels as the kept set's 2
    expect(r.at.get(2)).toBe(3);
    expect(r.at.get(3)).toBe(4);
    expect([...r.maps[0].blocks.slice(0, 4)]).toEqual([2, 3, 4, 0]);
    expect(r.blocks[1].pixels[0]).toBe(10);
    expect(r.blocks[4].pixels[0]).toBe(40);
  });
  it('moves a block with its links following', () => {
    const drop = set({ 1: 20, 2: 30 }, (i, b) => {
      if (i === 1) b.nextBl = 2;
    });
    const r = mergeBackgroundSets(input(set({ 1: 10 }), drop, [1, 2], [0], [0, 1]));
    if (typeof r === 'string') throw new Error(r);
    expect(r.blocks[r.at.get(1)!].nextBl).toBe(r.at.get(2));
  });
  it('keeps a carried number on its own slot, or refuses', () => {
    const drop = set({ 5: 70 }, (i, b) => {
      if (i === 5) b.obj = 1;
    });
    const ok = mergeBackgroundSets(input(set({ 1: 10 }), drop, [5], [0, 5], [0, 1]));
    if (typeof ok === 'string') throw new Error(ok);
    expect(ok.at.get(5)).toBe(5);
    const taken = set({ 5: 11 });
    expect(mergeBackgroundSets(input(taken, drop, [5], [0, 5], [0, 5]))).toEqual(expect.stringMatching(/carried between scenes/));
  });
  it('refuses when the drawn blocks do not fit', () => {
    const keep = set(Object.fromEntries(Array.from({ length: 149 }, (_, i) => [i + 1, i + 1])));
    expect(mergeBackgroundSets(input(keep, set({ 1: 250, 2: 251 }), [1, 2], [0], [0]))).toEqual(expect.stringMatching(/do not fit/));
  });
});
