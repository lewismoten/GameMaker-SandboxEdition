// Block painter transforms: flips, turns, wrap-around shifts, recolors and mirror points.
import { describe, expect, it } from 'vitest';
import { BLEN } from '../../../formats/blocks';
import { flipH, flipV, mirrorPoints, moveRange, recolor, rotateCCW, rotateCW, shiftWrap, swapRange, colorCounts } from './pixelOps';

const at = (s: Uint8Array, x: number, y: number) => s[y * BLEN + x];
function sample(): Uint8Array {
  const s = new Uint8Array(BLEN * BLEN);
  s[0] = 1; // top left
  s[BLEN - 1] = 2; // top right
  s[(BLEN - 1) * BLEN] = 3; // bottom left
  s[3 * BLEN + 5] = 9; // (5, 3)
  return s;
}

describe('pixelOps', () => {
  it('flips left-right and top-bottom', () => {
    const s = sample();
    expect(at(flipH(s), BLEN - 1, 0)).toBe(1);
    expect(at(flipH(s), 0, 0)).toBe(2);
    expect(at(flipV(s), 0, BLEN - 1)).toBe(1);
    expect(at(flipV(s), 0, 0)).toBe(3);
    expect(flipH(flipH(s))).toEqual(s);
  });

  it('turns a quarter each way, and four turns come back', () => {
    const s = sample();
    // clockwise: the top left corner goes to the top right
    expect(at(rotateCW(s), BLEN - 1, 0)).toBe(1);
    expect(at(rotateCW(s), 0, 0)).toBe(3);
    expect(at(rotateCCW(s), 0, BLEN - 1)).toBe(1);
    expect(rotateCCW(rotateCW(s))).toEqual(s);
    expect(rotateCW(rotateCW(rotateCW(rotateCW(s))))).toEqual(s);
  });

  it('shifts with wrap-around', () => {
    const s = sample();
    expect(at(shiftWrap(s, 1, 0), 6, 3)).toBe(9);
    expect(at(shiftWrap(s, -1, 0), BLEN - 1, 0)).toBe(1);
    expect(at(shiftWrap(s, 0, 1), 0, 1)).toBe(1);
    expect(at(shiftWrap(s, 0, -1), 0, BLEN - 2)).toBe(3);
    expect(shiftWrap(shiftWrap(s, 7, -3), -7, 3)).toEqual(s);
  });

  it('recolors, moves and swaps ranges', () => {
    const s = Uint8Array.from([1, 2, 3, 10, 11, 12, 200]);
    expect([...recolor(s, 2, 7)]).toEqual([1, 7, 3, 10, 11, 12, 200]);
    expect([...moveRange(s, 1, 50, 3)]).toEqual([50, 51, 52, 10, 11, 12, 200]);
    expect([...swapRange(s, 1, 10, 3)]).toEqual([10, 11, 12, 1, 2, 3, 200]);
    // never past color 255
    expect([...moveRange(Uint8Array.from([5, 6]), 5, 255, 2)]).toEqual([255, 6]);
  });

  it('mirrors points without repeats', () => {
    expect(mirrorPoints(2, 3, 'none')).toEqual([[2, 3]]);
    expect(mirrorPoints(2, 3, 'h')).toEqual([
      [2, 3],
      [BLEN - 3, 3],
    ]);
    expect(mirrorPoints(2, 3, 'both')).toHaveLength(4);
    expect(colorCounts(Uint8Array.from([1, 1, 2])).get(1)).toBe(2);
  });
});
