// Tests: Mug wraps on sublimation paper (desk/mug/mugSizes.ts).
import { describe, expect, it } from 'vitest';
import { MARGIN, MUG_SIZES, PAPERS, layoutSheet, paginateWraps } from '../src/desk/mug/mugSizes';

const size = (id: string) => MUG_SIZES.find((s) => s.id === id)!;
const paper = (id: string) => PAPERS.find((p) => p.id === id)!;

describe('sublimation sheets', () => {
  it('puts two 11 oz wraps on a letter page, inside the margins and apart', () => {
    const l = layoutSheet(paper('letter'), size('11oz'))!;
    expect(l.slots.length).toBe(2);
    for (const s of l.slots) {
      const [w, h] = s.rotated ? [3.5, 8.5] : [8.5, 3.5];
      expect(s.x).toBeGreaterThanOrEqual(MARGIN - 1e-9);
      expect(s.y).toBeGreaterThanOrEqual(MARGIN - 1e-9);
      expect(s.x + w).toBeLessThanOrEqual(l.pageW - MARGIN + 1e-9);
      expect(s.y + h).toBeLessThanOrEqual(l.pageH - MARGIN + 1e-9);
    }
  });
  it('fits 15 oz wraps on A4 and letter', () => {
    expect(layoutSheet(paper('a4'), size('15oz'))?.slots.length).toBeGreaterThanOrEqual(1);
    expect(layoutSheet(paper('letter'), size('15oz'))?.slots.length).toBeGreaterThanOrEqual(1);
  });
  it('fits a 20 oz tumbler on letter turned sideways, but not on A4', () => {
    const l = layoutSheet(paper('letter'), size('20oz'))!;
    expect(l.landscape).toBe(true);
    expect(l.slots.length).toBe(1);
    expect(layoutSheet(paper('a4'), size('20oz'))).toBeUndefined();
  });
  it('splits mugs into pages', () => {
    expect(paginateWraps([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });
});
