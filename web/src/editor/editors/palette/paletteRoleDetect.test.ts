// Dedicated colors can be grouped; shared, menu and transparent colors must stay unreserved.
import { describe, expect, it } from 'vitest';
import { rangesFromUses } from './paletteRoleDetect';

const uses = (...entries: [number, ...('character' | 'monster' | 'background')[]][]) => {
  const out = Array.from({ length: 256 }, () => new Set<'character' | 'monster' | 'background'>());
  for (const [color, ...roles] of entries) roles.forEach((role) => out[color].add(role));
  return out;
};

describe('dedicated palette areas', () => {
  it('joins adjacent exclusive colors and leaves shared colors unreserved', () => {
    expect(
      rangesFromUses(
        uses(
          [0, 'background'],
          [1, 'background'],
          [2, 'background'],
          [3, 'character'],
          [4, 'character'],
          [5, 'character', 'monster'],
          [6, 'monster'],
          [255, 'monster'],
        ),
      ),
    ).toEqual([
      { first: 1, last: 2, role: 'background' },
      { first: 3, last: 4, role: 'character' },
      { first: 6, last: 6, role: 'monster' },
    ]);
  });
});
