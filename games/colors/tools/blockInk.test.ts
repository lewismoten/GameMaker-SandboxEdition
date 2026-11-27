// The same foreground can be drawn on sky or transparent padding.
import { expect, it } from 'vitest';
import { shapeDifference } from './blockInk';

it('counts only changes in foreground coverage', () => {
  const sky = 7;
  const a = new Uint8Array(400).fill(sky);
  const b = new Uint8Array(400).fill(255);
  a[42] = b[42] = 3;
  expect(shapeDifference(a, b, sky)).toBe(0);
  b[42] = 255;
  expect(shapeDifference(a, b, sky)).toBe(1 / 400);
});
