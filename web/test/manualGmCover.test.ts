// Tests: the Owner's Guide cover's peeled-back corner (manual/printables/gmCover.ts).
import { describe, expect, it } from 'vitest';
import { peel, COVER_W, COVER_H } from '../src/manual/printables/gmCover';

describe('peel', () => {
  it('folds the bottom back over a level fold onto the sheet', () => {
    const { sheet, flap } = peel([0, 800], [COVER_W, 800], 1);
    expect(sheet).toEqual([
      [0, 0],
      [COVER_W, 0],
      [COVER_W, 800],
      [0, 800],
    ]);
    // the 50 below the fold turns over to lie 50 above it
    expect(flap.slice(2)).toEqual([
      [COVER_W, 750],
      [0, 750],
    ]);
  });
  it('curls only part of the way back', () => {
    const { flap } = peel([0, 800], [COVER_W, 800], 0.4);
    expect(flap[2][1]).toBeCloseTo(780);
    expect(COVER_H).toBe(850);
  });
});
