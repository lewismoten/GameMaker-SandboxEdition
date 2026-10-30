// Seam regression cases: nearest gestures, long drags, repeated small maps and zoom fractions.
import { describe, expect, it } from 'vitest';
import { nativeCell, tileOrigins, visibleCopy, wrapValue } from './mapWrap';

describe('wrapped map coordinates', () => {
  it('keeps native cells in the DOS map through either seam', () => {
    expect(nativeCell({ x: -1, y: 100 })).toEqual({ x: 99, y: 0 });
    expect(nativeCell({ x: 201, y: -201 })).toEqual({ x: 1, y: 99 });
    expect(wrapValue(-0.5, 200)).toBe(199.5);
  });
  it('covers both sides of a partial tile and repeats maps smaller than the viewport', () => {
    expect(tileOrigins(3990, 2000, 800)).toEqual([-1990, 10]);
    expect(tileOrigins(-0.5, 200, 620)).toEqual([-199.5, 0.5, 200.5, 400.5, 600.5]);
    expect(tileOrigins(0, 4000, 390)).toEqual([0]);
    expect(visibleCopy(0, 1990, 2000, 800)).toBe(10);
    expect(visibleCopy(1980, 1990, 2000, 800)).toBe(-10);
    expect(visibleCopy(0, 0, 200, 1000)).toBe(400);
  });
});
