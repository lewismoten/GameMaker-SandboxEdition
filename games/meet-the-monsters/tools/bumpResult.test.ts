// Regression cases for the two-second monster contact check.
import { expect, it } from 'vitest';
import { bumpPassed } from './bumpResult';

it.each([
  [50, 50, true, 0, true],
  [50, 50, false, 0, false],
  [40, 40, true, 10, true],
  [50, 50, true, 10, false],
  [10, 10, true, 10, false],
  [30, 40, true, 10, false],
  [40, 50, true, 0, false],
] as const)('minimum %i, final %i, contact %s, expected loss %i', (least, after, touched, expected, ok) => {
  expect(bumpPassed(50, least, after, 0, touched, expected)).toBe(ok);
});

it('rejects a death even if the player respawns with positive HP', () => {
  expect(bumpPassed(50, 40, 50, 1, true, 10)).toBe(false);
});
