// Seam regression cases: nearest gestures, long drags, repeated small maps and zoom fractions.
import { describe, expect, it } from 'vitest';
import { continueWrappedCell, nativeCell, tileOrigins, visibleCopy, wrapValue } from './mapWrap';

describe('wrapped map coordinates', () => {
  it('keeps native cells in the DOS map through either seam', () => {
    expect(nativeCell({ x: -1, y: 100 })).toEqual({ x: 99, y: 0 });
    expect(nativeCell({ x: 201, y: -201 })).toEqual({ x: 1, y: 99 });
    expect(wrapValue(-0.5, 200)).toBe(199.5);
  });
  it('continues a short stroke across a seam without painting the long way round', () => {
    const start = { x: 98, y: 1 };
    const next = continueWrappedCell({ x: 1, y: 99 }, start);
    expect(next).toEqual({ x: 101, y: -1 });
    expect(nativeCell(next)).toEqual({ x: 1, y: 99 });
    expect(continueWrappedCell({ x: 99, y: 1 }, { x: 1, y: 99 })).toEqual({ x: -1, y: 101 });
    expect(continueWrappedCell({ x: 5, y: 0 }, { x: 199, y: 0 }, { x: 100, y: 0 })).toEqual({ x: 199, y: 0 });
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
