// Node-only boundary coverage for typed VGA channels; the kept values match the old clamp.
import { expect, it } from 'vitest';
import { channelValue } from './channelValue';

it.each([0, 1, 62, 63])('leaves native VGA value %i alone without a message', (value) => {
  expect(channelValue(value, 'Red')).toEqual({ value, note: '' });
});
it.each([
  [-1, 0],
  [64, 63],
  [255, 63],
  [12.5, 12],
])('explains requested %s becoming %s', (asked, value) => {
  expect(channelValue(asked, 'Blue')).toEqual({ value, note: `DOS VGA blue is kept between 0 and 63; ${asked} became ${value}.` });
});
it('keeps exactly the previous palette bytes for all channels', () => {
  const input = [-1, 64, 31.9, 0, 63, 255];
  const before = Uint8Array.from(input, (v) => Math.max(0, Math.min(63, v | 0)));
  expect(Uint8Array.from(input, (v) => channelValue(v, 'Green').value)).toEqual(before);
});
