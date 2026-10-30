// Role reassignment must preserve neighboring ranges and keep DOS's fixed color roles intact.
import { describe, expect, it } from 'vitest';
import { readReservations, reservationAt, reserveColors } from '../src/editor/editors/palette/paletteReservations';

describe('palette reservations', () => {
  it('splits reassigned ranges, then merges matching adjacent roles', () => {
    const original = [{ first: 10, last: 30, role: 'character' as const }];
    const changed = reserveColors(original, 15, 20, 'monster');
    expect(changed).toEqual([
      { first: 10, last: 14, role: 'character' },
      { first: 15, last: 20, role: 'monster' },
      { first: 21, last: 30, role: 'character' },
    ]);
    expect(reserveColors(changed, 15, 20, 'character')).toEqual(original);
    expect(original[0].last).toBe(30);
    expect(reserveColors(changed, 13, 23)).toEqual([
      { first: 10, last: 12, role: 'character' },
      { first: 24, last: 30, role: 'character' },
    ]);
  });
  it('rejects ranges that claim built-in roles or have invalid bounds', () => {
    for (const [first, last] of [
      [0, 10],
      [250, 255],
      [20, 10],
      [1.5, 2],
      [1, NaN],
    ])
      expect(() => reserveColors([], first, last, 'background')).toThrow(RangeError);
    expect(reservationAt([], 0)).toBe('menu');
    expect(reservationAt([], 255)).toBe('transparent');
  });
  it('accepts only usable companion metadata and resolves overlapping imported ranges', () => {
    const ranges = readReservations([
      null,
      { first: 0, last: 255, role: 'background' },
      { first: 3, last: 5, role: 'unknown' },
      { first: 3, last: 10, role: 'background' },
      { first: 8, last: 12, role: 'monster' },
    ]);
    expect(ranges).toEqual([
      { first: 3, last: 7, role: 'background' },
      { first: 8, last: 12, role: 'monster' },
    ]);
    expect(reservationAt(ranges, 7)).toBe('background');
    expect(reservationAt(ranges, 8)).toBe('monster');
    expect(reservationAt(ranges, 13)).toBeUndefined();
  });
});
