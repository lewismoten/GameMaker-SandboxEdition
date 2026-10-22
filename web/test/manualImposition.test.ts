// Tests: Printing the manual as a folded booklet (manual/printables/imposition.ts).
import { describe, expect, it } from 'vitest';
import { bookletPageCount, bookletSheets, centerSpread, spreadAt, stepSpread } from '../src/manual/printables/imposition';

describe('booklet imposition', () => {
  it('rounds pages up to folded sheets', () => {
    expect(bookletPageCount(1)).toBe(4);
    expect(bookletPageCount(12)).toBe(12);
    expect(bookletPageCount(13)).toBe(16);
  });

  it('puts the staples between the middle pages', () => {
    expect(centerSpread(12)).toEqual([5, 6]);
    // and the viewer shows those two together
    expect(spreadAt(5, 12, true)).toEqual([5, 6]);
    expect(spreadAt(6, 12, true)).toEqual([5, 6]);
  });

  it('pages through cover, spreads and back cover', () => {
    const seen: number[][] = [];
    let at = 0;
    for (let i = 0; i < 10; i++) {
      seen.push(spreadAt(at, 8, true));
      const next = stepSpread(at, 8, true, 1);
      if (next === at) break;
      at = next;
    }
    expect(seen).toEqual([[0], [1, 2], [3, 4], [5, 6], [7]]);
    expect(stepSpread(7, 8, true, -1)).toBe(5);
    expect(stepSpread(1, 8, true, -1)).toBe(0);
    expect(stepSpread(3, 8, false, 1)).toBe(4);
  });

  it('imposes every page exactly once, outer sheet first', () => {
    const sheets = bookletSheets(8);
    expect(sheets).toEqual([
      { front: [7, 0], back: [1, 6] },
      { front: [5, 2], back: [3, 4] },
    ]);
    const all = bookletSheets(16).flatMap((s) => [...s.front, ...s.back]);
    expect(all.sort((a, b) => a - b)).toEqual([...Array(16).keys()]);
  });
});
