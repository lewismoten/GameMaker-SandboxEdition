// Map cell helpers: lines, rectangles, flood fill areas, find and replace.
import { describe, expect, it } from 'vitest';
import { findBlock, floodCells, lineCells, rectCells, replaceAll, spanRect } from './cellOps';

describe('map cell helpers', () => {
  it('draws lines and rectangles', () => {
    expect(lineCells({ x: 0, y: 0 }, { x: 3, y: 1 })).toEqual([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 1 },
      { x: 3, y: 1 },
    ]);
    expect(spanRect({ x: 3, y: 1 }, { x: 1, y: 2 })).toEqual({ x: 1, y: 1, w: 3, h: 2 });
    expect(rectCells({ x: 0, y: 0, w: 3, h: 3 }, true)).toHaveLength(8);
  });

  it('floods, finds and replaces', () => {
    const b = Uint8Array.from([1, 1, 2, 1, 2, 2, 1, 1, 1]);
    expect(floodCells(b, { x: 0, y: 0 }, 3, 3)).toHaveLength(6);
    expect(findBlock(b, 2)).toEqual([2, 4, 5]);
    expect(replaceAll(b, 2, 7)).toBe(3);
    expect([...b]).toEqual([1, 1, 7, 1, 7, 7, 1, 1, 1]);
  });
});
