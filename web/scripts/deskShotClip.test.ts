// Check the padded close-up against each edge of the phone viewport.
import { expect, it } from 'vitest';
import { deskShotClip } from './deskShotClip';

it.each([
  ['left', -100, 50],
  ['right', 410, 50],
  ['top', 50, -100],
  ['bottom', 50, 864],
] as const)('skips an empty intersection on the %s', (_, x, y) => {
  expect(deskShotClip({ x, y, width: 50, height: 50 }, 390, 844)).toBeNull();
});

it.each([
  ['left', -10, 50, 0, 30, 60, 90],
  ['right', 370, 50, 350, 30, 40, 90],
  ['top', 50, -10, 30, 0, 90, 60],
  ['bottom', 50, 824, 30, 804, 90, 40],
] as const)('clips a partly visible prop on the %s', (_, x, y, left, top, width, height) => {
  expect(deskShotClip({ x, y, width: 50, height: 50 }, 390, 844)).toEqual({ x: left, y: top, width, height });
});
