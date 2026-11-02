// Role reassignment must preserve neighboring ranges and keep DOS's fixed color roles intact.
import { describe, expect, it } from 'vitest';
import { copyReservedRanges, readReservations, reservationAt, reserveColors } from '../src/editor/editors/palette/paletteReservations';

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
  it('copies only the selected role colors and resolves destination overlaps without changing either source', () => {
    const target = new Uint8Array(768).fill(12),
      source = new Uint8Array(768).fill(42);
    const current = [{ first: 5, last: 30, role: 'background' }];
    const areas = [
      { first: 10, last: 15, role: 'character' },
      { first: 20, last: 25, role: 'monster' },
    ];
    const result = copyReservedRanges(target, current, source, areas, ['character']);
    expect(result.roles).toEqual([
      { first: 5, last: 9, role: 'background' },
      { first: 10, last: 15, role: 'character' },
      { first: 16, last: 30, role: 'background' },
    ]);
    for (let i = 0; i < 256; i++) expect([...result.pal.subarray(i * 3, i * 3 + 3)]).toEqual(new Array(3).fill(i >= 10 && i <= 15 ? 42 : 12));
    expect([...target]).toEqual(new Array(768).fill(12));
    expect([...source]).toEqual(new Array(768).fill(42));
    expect(current).toEqual([{ first: 5, last: 30, role: 'background' }]);
    expect(areas).toEqual([
      { first: 10, last: 15, role: 'character' },
      { first: 20, last: 25, role: 'monster' },
    ]);
  });
  it('can copy the layout alone, ignores malformed areas, and keeps menu and transparency colors untouched', () => {
    const pal = new Uint8Array(768).fill(7);
    const areas = [
      { first: 0, last: 4, role: 'character' },
      { first: 1, last: 254, role: 'character' },
      { first: 255, last: 255, role: 'monster' },
    ];
    const layout = copyReservedRanges(pal, [], undefined, areas, ['character', 'monster']);
    expect(layout.pal).toEqual(pal);
    expect(layout.roles).toEqual([{ first: 1, last: 254, role: 'character' }]);
    const colors = copyReservedRanges(pal, [], new Uint8Array(768).fill(33), areas, ['character']);
    expect(colors.pal.slice(0, 3)).toEqual(pal.slice(0, 3));
    expect(colors.pal.slice(765)).toEqual(pal.slice(765));
    expect(() => copyReservedRanges(pal, [], new Uint8Array(3), [], [])).toThrow(RangeError);
  });
});
