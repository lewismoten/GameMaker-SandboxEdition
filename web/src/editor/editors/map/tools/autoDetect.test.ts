// Guessing a terrain's edges and corners from the block art.
import { describe, expect, it } from 'vitest';
import { BLEN, emptyBlock, type Block } from '../../../../formats/blocks';
import { autoDetect } from './autoDetect';
import { BLOB47 } from './autotile';

const GRASS = 2;
const DIRT = 5;
/** A block that is dirt where `out(x, y)`, else grass, with a little texture. */
const tile = (i: number, out: (x: number, y: number) => boolean): Block => {
  const b = emptyBlock(i);
  for (let y = 0; y < BLEN; y++) for (let x = 0; x < BLEN; x++) b.pixels[y * BLEN + x] = out(x, y) ? DIRT + ((x * y) % 2) : GRASS + ((x + y) % 2);
  return b;
};
const B = 4; // the edge band
const far = BLEN - B;

describe('auto-detecting a terrain', () => {
  it('finds the 3×3 and the inner corners of an edges terrain, whatever order the blocks are in', () => {
    const shapes: ((x: number, y: number) => boolean)[] = [
      (x, y) => x < B || y < B, // top-left corner
      (_x, y) => y < B,
      (x, y) => x >= far || y < B,
      (x) => x < B,
      () => false, // fill
      (x) => x >= far,
      (x, y) => x < B || y >= far,
      (_x, y) => y >= far,
      (x, y) => x >= far || y >= far,
      (x, y) => x < B && y < B, // inner corners
      (x, y) => x >= far && y < B,
      (x, y) => x < B && y >= far,
      (x, y) => x >= far && y >= far,
    ];
    const order = [7, 3, 12, 0, 9, 4, 1, 11, 5, 2, 10, 6, 8]; // block n is shape order[n]
    const blocks = order.map((s, i) => tile(i, shapes[s]));
    blocks.push(tile(13, () => true)); // the dirt outside
    blocks.push(emptyBlock(14)); // something else entirely
    const fill = order.indexOf(4);
    const tiles = autoDetect(blocks, 'edges', fill, 13);
    expect(tiles).toEqual(shapes.map((_, s) => order.indexOf(s)));
  });

  it('leaves slots empty when nothing fits, and guesses nothing for paths', () => {
    const blocks = [tile(0, () => false), tile(1, () => true)];
    const tiles = autoDetect(blocks, 'blob47', 0, 1);
    expect(tiles.filter((t) => t >= 0)).toEqual([0]);
    expect(tiles[BLOB47.indexOf(0xff)]).toBe(0);
    expect(autoDetect(blocks, 'path', 0, 1).every((t) => t === -1)).toBe(true);
  });
});
