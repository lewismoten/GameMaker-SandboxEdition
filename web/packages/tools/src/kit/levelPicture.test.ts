// openingTop: the screen's first map row when a scene opens; renderRegion from a corner part way into a block.
import { describe, expect, it } from 'vitest';
import type { Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import type { GameMap } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { openingTop, renderRegion } from './levelPicture';

describe('openingTop', () => {
  it('puts the hero feet edge six rows below the top', () => {
    expect(
      openingTop([
        { x: 14, y: 20 },
        { x: 14, y: 21 },
      ]),
    ).toBe(16);
  });
  it('ignores sprites in other columns', () => {
    expect(
      openingTop([
        { x: 14, y: 20 },
        { x: 14, y: 21 },
        { x: 30, y: 40 },
      ]),
    ).toBe(16);
  });
});

describe('renderRegion', () => {
  // every block one flat color: its map row
  const bg = Array.from({ length: 100 }, (_, i) => ({ pixels: new Uint8Array(400).fill(i) })) as unknown as Block[];
  const map = { blocks: Uint8Array.from({ length: 10000 }, (_, i) => Math.floor(i / 100)), monsters: [] } as unknown as GameMap;
  it('starts part way into a block when the top row has a fraction', () => {
    const p = renderRegion(map, bg, [], [], 0, 1.2, 2, 3);
    expect([p.w, p.h]).toEqual([40, 60]);
    // 1.2 rows is 24 pixels: 16 lines of row 1, all of rows 2 and 3, 4 lines of row 4
    expect([0, 15, 16, 35, 36, 55, 56, 59].map((y) => p.get(0, y))).toEqual([1, 1, 2, 2, 3, 3, 4, 4]);
  });
  it('is unchanged for whole rows', () => {
    const p = renderRegion(map, bg, [], [], 0, 1, 2, 3);
    expect([0, 19, 20, 59].map((y) => p.get(0, y))).toEqual([1, 1, 2, 3]);
  });
});
