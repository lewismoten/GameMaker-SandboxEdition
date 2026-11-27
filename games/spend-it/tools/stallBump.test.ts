// A demo must actually try to walk into the unpaid stall.
import { expect, it } from 'vitest';
import { ORIGIN } from '../../kit/starter/map';
import { unpaidStallBump } from './stallBump';

it('distinguishes collecting two coins, waiting beside the stall and walking against it', () => {
  const beside = { x: ORIGIN + 15, y: ORIGIN + 9, sx: 0, sy: 0 };
  const secondCoin = { ...beside, x: ORIGIN + 10 };
  expect(unpaidStallBump(secondCoin, secondCoin, true, 2, 1)).toBe(false);
  expect(unpaidStallBump({ ...beside, x: beside.x - 1, sx: 16 }, beside, true, 2, 1)).toBe(false);
  expect(unpaidStallBump(beside, beside, false, 2, 1)).toBe(false);
  expect(unpaidStallBump(beside, beside, true, 2, 1)).toBe(true);
});
