// Stamps: capture, and flips and turns only where the blocks have mirror images.
import { describe, expect, it } from 'vitest';
import { BLEN, emptyBlock, type Block } from '../../../../formats/blocks';
import { captureStamp, mirrors, stampRows, transformStamp } from './stamps';

/** A block with one pixel set at (x, y). */
const dot = (i: number, x: number, y: number): Block => {
  const b = emptyBlock(i);
  b.pixels.fill(0);
  b.pixels[y * BLEN + x] = 9;
  return b;
};
const L = BLEN - 1;
// 0 blank (symmetric), 1 dot top-left, 2 dot top-right (1 flipped), 3 dot bottom-left, 4 dot bottom-right, 5 a lone dot with no mirror
const set = [emptyBlock(0), dot(1, 0, 0), dot(2, L, 0), dot(3, 0, L), dot(4, L, L), dot(5, 3, 7)];
set[0].pixels.fill(0);

describe('stamps', () => {
  it('captures a rectangle of the map', () => {
    const map = Uint8Array.from({ length: 16 }, (_, i) => i);
    expect(captureStamp(map, { x: 1, y: 2, w: 2, h: 2 }, 4)).toEqual({ w: 2, h: 2, cells: [9, 10, 13, 14] });
  });

  it('finds each block’s mirror image in the set', () => {
    const m = mirrors(set);
    expect(m.flipH.slice(0, 5)).toEqual([0, 2, 1, 4, 3]);
    expect(m.flipV.slice(0, 5)).toEqual([0, 3, 4, 1, 2]);
    expect(m.rotate.slice(0, 5)).toEqual([0, 2, 4, 1, 3]); // a quarter clockwise: top-left goes top-right
    expect(m.flipH[5]).toBe(-1);
  });

  it('flips and turns a stamp, swapping its blocks for their mirrors', () => {
    const m = mirrors(set);
    const s = { w: 3, h: 2, cells: [1, 0, -1, 3, 0, 0] };
    expect(stampRows(transformStamp(s, 'flipH', m)!)).toEqual([[-1, 0, 2], [0, 0, 4]]);
    expect(stampRows(transformStamp(s, 'flipV', m)!)).toEqual([[1, 0, 0], [3, 0, -1]]);
    expect(stampRows(transformStamp(s, 'rotate', m)!)).toEqual([[1, 2], [0, 0], [0, -1]]);
    expect(transformStamp({ w: 1, h: 1, cells: [5] }, 'flipH', m)).toBeUndefined();
  });
});
