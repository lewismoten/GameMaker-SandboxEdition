// Tests: Mug wraps on sublimation paper (desk/mug/mugSizes.ts).
import { describe, expect, it } from 'vitest';
import { MARGIN, MUG_SIZES, PAPERS, packWraps, printPlacement } from '../src/desk/mug/mugSizes';

const size = (id: string) => MUG_SIZES.find((s) => s.id === id)!;
const paper = (id: string) => PAPERS.find((p) => p.id === id)!;

describe('sublimation sheets', () => {
  const one = (p: string, s: string, n = 1) => packWraps(paper(p), Array(n).fill(size(s)), (x: (typeof MUG_SIZES)[number]) => x);
  it('puts two 11 oz wraps on a letter page, inside the margins', () => {
    const l = one('letter', '11oz', 2)!;
    expect(l.pages.length).toBe(1);
    for (const s of l.pages[0]) {
      const [w, h] = s.rotated ? [3.5, 8.5] : [8.5, 3.5];
      expect(s.x).toBeGreaterThanOrEqual(MARGIN - 1e-9);
      expect(s.y).toBeGreaterThanOrEqual(MARGIN - 1e-9);
      expect(s.x + w).toBeLessThanOrEqual(l.pageW - MARGIN + 1e-9);
      expect(s.y + h).toBeLessThanOrEqual(l.pageH - MARGIN + 1e-9);
    }
  });
  it('fits 15 oz wraps on A4 and letter', () => {
    expect(one('a4', '15oz')).toBeDefined();
    expect(one('letter', '15oz')).toBeDefined();
  });
  it('fits a 20 oz tumbler on letter turned sideways, but not on A4', () => {
    const l = one('letter', '20oz')!;
    expect(l.landscape).toBe(true);
    expect(l.pages[0].length).toBe(1);
    expect(one('a4', '20oz')).toBeUndefined();
  });
  it('splits five 11 oz mugs into three pages', () => {
    expect(one('letter', '11oz', 5)!.pages.map((p) => p.length)).toEqual([2, 2, 1]);
  });
});

describe('pictures on a wrap', () => {
  it('puts the picture front and back, inside the wrap, a quarter turn from the front', () => {
    for (const s of MUG_SIZES) {
      for (const aspect of [640 / 288, 320 / 248]) {
        const p = printPlacement(s, aspect);
        expect(p.w / p.h).toBeCloseTo(aspect);
        expect(p.h).toBeLessThanOrEqual(s.wrapH);
        expect(p.y).toBeGreaterThanOrEqual(0);
        expect(p.centers[0] - p.w / 2).toBeGreaterThan(0);
        expect(p.centers[1] + p.w / 2).toBeLessThan(s.wrapW);
        expect(p.centers[1] - p.w / 2).toBeGreaterThan(p.centers[0] + p.w / 2); // they don't overlap
        expect(p.centers[0] + p.centers[1]).toBeCloseTo(s.wrapW); // symmetric about the front
        expect(p.w).toBeGreaterThan(2.5); // big enough to read
      }
    }
    const tumbler = printPlacement(size('20oz'), 2);
    expect(tumbler.centers[1] - tumbler.centers[0]).toBeCloseTo((Math.PI * 2.9) / 2); // exactly front and back
  });
});

describe('an order of mugs', () => {
  const order = (...ids: string[]) => ids.map((id) => size(id));
  const id = (s: (typeof MUG_SIZES)[number]) => s;
  it('puts two 11 oz wraps and one 15 oz on two letter pages', () => {
    const p = packWraps(paper('letter'), order('11oz', '11oz', '15oz'), id)!;
    expect(p.pages.length).toBe(2);
    expect(p.pages.flat().length).toBe(3);
  });
  it('keeps every wrap on its page, inside the margins, without overlaps', () => {
    const items = order('11oz', '15oz', '12oz', '11oz', '12oz', '20oz', '15oz');
    const p = packWraps(paper('letter'), items, id)!;
    expect(p.pages.flat().length).toBe(items.length);
    for (const page of p.pages) {
      const boxes = page.map((q) => {
        const [w, h] = q.rotated ? [q.item.wrapH, q.item.wrapW] : [q.item.wrapW, q.item.wrapH];
        expect(q.x).toBeGreaterThanOrEqual(MARGIN - 1e-9);
        expect(q.y).toBeGreaterThanOrEqual(MARGIN - 1e-9);
        expect(q.x + w).toBeLessThanOrEqual(p.pageW - MARGIN + 1e-9);
        expect(q.y + h).toBeLessThanOrEqual(p.pageH - MARGIN + 1e-9);
        return { x: q.x, y: q.y, w, h };
      });
      for (const a of boxes)
        for (const b of boxes)
          if (a !== b) expect(a.x + a.w <= b.x + 1e-9 || b.x + b.w <= a.x + 1e-9 || a.y + a.h <= b.y + 1e-9 || b.y + b.h <= a.y + 1e-9).toBe(true);
    }
  });
  it('says so when a wrap fits on no page', () => {
    expect(packWraps(paper('a4'), order('11oz', '20oz'), id)).toBeUndefined();
    expect(packWraps(paper('letter'), order('20oz', '20oz'), id)!.pages.length).toBe(2);
  });
});
