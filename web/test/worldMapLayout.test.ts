// Tests: the World Map's layout arithmetic (manual/printables/worldMapLayout.ts).
import { describe, expect, it } from 'vitest';
import { CARD, CELL, bounds, cardRects, edgePoint, folds, tiles } from '../src/manual/printables/worldMapLayout';
import { CARD_UNITS } from '../src/editor/editors/integrator/layoutCells';

const overlap = (a: { x: number; y: number; w: number; h: number }, b: typeof a) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

describe('world map layout', () => {
  it('spreads cards one cell apart, whatever the integrator spacing', () => {
    for (const k of [0.5, 1, 2.3]) {
      const pos = new Map([
        [0, { x: 10, y: 40 }],
        [1, { x: 10 + CARD_UNITS.w * k, y: 40 }],
        [2, { x: 10, y: 40 + CARD_UNITS.h * k }],
      ]);
      const r = cardRects(pos);
      expect(r.get(1)!.x - r.get(0)!.x).toBeCloseTo(CELL.w);
      expect(r.get(2)!.y - r.get(0)!.y).toBeCloseTo(CELL.h);
      const all = [...r.values()];
      for (let a = 0; a < all.length; a++) for (let b = a + 1; b < all.length; b++) expect(overlap(all[a], all[b])).toBe(false);
      expect(all[0].w).toBe(CARD.w);
    }
  });
  it('puts cards at the origin and measures them', () => {
    const r = cardRects(new Map([[3, { x: 50, y: 50 }]]), { x: 5, y: 22 });
    const b = bounds(r.values());
    expect(b.x).toBeCloseTo(5 + (CELL.w - CARD.w) / 2);
    expect(b.w).toBe(CARD.w);
    expect(cardRects(new Map()).size).toBe(0);
  });
  it('arrows leave a card at its edge toward the other card', () => {
    const r = { x: 0, y: 0, w: 10, h: 6 };
    expect(edgePoint(r, { x: 100, y: 3 }, 0)).toEqual({ x: 10, y: 3 });
    expect(edgePoint(r, { x: 5, y: -50 }, 0)).toEqual({ x: 5, y: 0 });
  });
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
