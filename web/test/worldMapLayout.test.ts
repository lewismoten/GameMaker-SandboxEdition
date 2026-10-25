// Tests: the World Map's printing arithmetic (manual/printables/worldMapLayout.ts).
import { describe, expect, it } from 'vitest';
import { folds, tiles } from '../src/manual/printables/worldMapLayout';

describe('world map layout', () => {
  it('splits a big map into overlapping pages named like an atlas', () => {
    expect(tiles(100, 70, 105, 80, 3)).toHaveLength(1);
    const ts = tiles(331, 212, 105, 80, 3);
    expect(ts.map((t) => t.name).slice(0, 5)).toEqual(['A1', 'B1', 'C1', 'D1', 'A2']);
    const last = ts[ts.length - 1];
    expect(last.x + last.w).toBeGreaterThanOrEqual(331);
    expect(last.y + last.h).toBeGreaterThanOrEqual(212);
    expect(ts[1].x).toBe(102);
  });
  it('folds into panels', () => {
    expect(folds(85, 85)).toEqual([]);
    expect(folds(331, 85)).toHaveLength(3);
  });
});
