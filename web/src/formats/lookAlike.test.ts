// Look-alike blocks: same colors fold, same shape in other colors does not, pins and timers hold.
import { describe, expect, it } from 'vitest';
import { emptyBlock, type Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import type { GameMap } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { applyFold, findLookAlikes } from '@lewismoten/gamemaker-sandbox-tools/look-alike';

const pal = (...rgb: number[][]) => {
  const p = new Uint8Array(768);
  rgb.forEach((c, i) => p.set(c, i * 3));
  return p;
};
const block = (i: number, fill: number, edit?: (b: Block) => void): Block => {
  const b = emptyBlock(i);
  b.pixels.fill(fill);
  b.pixels[5] = fill + 1;
  edit?.(b);
  return b;
};
const map = (cells: number[]): GameMap => ({
  blocks: Uint8Array.from([...cells, ...new Array(10000 - cells.length).fill(0)]),
  mons: new Uint8Array(10000),
  monsters: [],
});

describe('findLookAlikes', () => {
  // colors 1 and 3 are the same red, 2 and 4 the same blue; 5 and 6 differ
  const palette = pal([0, 0, 0], [60, 0, 0], [0, 0, 60], [60, 0, 0], [0, 0, 60], [0, 60, 0], [9, 9, 9]);
  const blocks = Array.from({ length: 150 }, (_, i) => emptyBlock(i));
  blocks[1] = block(1, 1);
  blocks[2] = block(2, 3); // same colors as 1 through the palette
  blocks[3] = block(3, 5); // same shape, other colors
  blocks[4] = block(4, 1, (b) => (b.solid = 1)); // looks like 1, plays differently
  const input = { blocks, palettes: [palette], used: new Set([0, 1, 2, 3, 4]), pinned: new Set([0]) };

  it('folds blocks of equal colors and rules, and lists color variants apart', () => {
    const r = findLookAlikes(input);
    expect(r.groups).toEqual([{ keep: 1, fold: [2] }]);
    expect(r.colorVariants.map((m) => m.sort())).toContainEqual([1, 2, 3, 4]);
  });
  it('keeps a pinned block, and leaves two pinned alone', () => {
    expect(findLookAlikes({ ...input, pinned: new Set([2]) }).groups).toEqual([{ keep: 2, fold: [1] }]);
    const r = findLookAlikes({ ...input, pinned: new Set([1, 2]) });
    expect(r.groups).toEqual([]);
    expect(r.pinnedGroups).toEqual([[1, 2]]);
  });
  it('does not fold blocks that turn into different things', () => {
    const b = blocks.map((x) => ({ ...x }));
    b[2] = { ...b[2], touchBl: 3 };
    expect(findLookAlikes({ ...input, blocks: b }).groups).toEqual([]);
  });
  it('renumbers maps and links', () => {
    const b = blocks.map((x) => ({ ...x }));
    b[3] = { ...b[3], nextBl: 2 };
    const r = applyFold(b, [map([0, 1, 2, 3, 2])], [{ keep: 1, fold: [2] }]);
    expect([...r.maps[0].blocks.slice(0, 5)]).toEqual([0, 1, 1, 3, 1]);
    expect(r.blocks[3].nextBl).toBe(1);
    expect(r.blocks[2].pixels.every((v) => v === 0)).toBe(true);
    expect(r.to[2]).toBe(1);
  });
});
