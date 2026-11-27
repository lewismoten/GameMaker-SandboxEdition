// Equal totals can hide a pickup in the wrong counter.
import { expect, it } from 'vitest';
import { meterDifference, meterField } from './pocketHostMeters';

it('preserves the index of each of the 30 counters', () => {
  const meters = Array<number>(30).fill(0);
  meters[0] = 1;
  const before = meterField(meters);
  meters[0] = 0;
  meters[29] = 1;
  expect(meterDifference(before, meterField(meters))).toBe('meter[0]: engine 1, board 0');
  expect(meterField(meters)).not.toBe(before);
  expect(meterField(meters).split(',').map(Number)).toEqual(meters);
});
