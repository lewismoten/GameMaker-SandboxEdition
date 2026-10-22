// Tests: how the game boxes stand on the desk's two wall shelves (desk/boxes/shelfLayout.ts).
import { describe, expect, it } from 'vitest';
import { MAX_U, shelfHolds, shelfLayout } from '../src/desk/boxes/shelfLayout';

const SHELVES = [146, 300];

describe('shelfLayout', () => {
  it('stands twelve boxes, and a thirteenth, at full size', () => {
    for (const n of [12, 13]) {
      const { u, rows } = shelfLayout(n, SHELVES);
      expect(u).toBe(MAX_U);
      expect(rows.reduce((a, b) => a + b, 0)).toBe(n);
      // any box on either shelf can stand face out
      rows.forEach((k, i) => expect(k).toBeLessThanOrEqual(shelfHolds(SHELVES[i], u)));
    }
  });

  it('shares a few boxes between the shelves', () => {
    expect(shelfLayout(9, SHELVES).rows).toEqual([4, 5]);
    expect(shelfLayout(1, SHELVES).rows).toEqual([1, 0]);
  });

  it('shrinks the boxes only when the shelves fill up', () => {
    const { u, rows } = shelfLayout(20, SHELVES);
    expect(u).toBeLessThan(MAX_U);
    expect(rows.reduce((a, b) => a + b, 0)).toBe(20);
    rows.forEach((k, i) => expect(k).toBeLessThanOrEqual(shelfHolds(SHELVES[i], u)));
  });
});
