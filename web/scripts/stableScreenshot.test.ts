// Regression coverage for selecting the frame saved by editor:shots.
import { expect, it, vi } from 'vitest';
import { stableScreenshot } from './stableScreenshot';

const route = '/#/p/look:blaster/bus3.map';
const waitForTimeout = async () => {};

it('fails with the route and scheme when every frame changes', async () => {
  let frame = 0;
  const screenshot = vi.fn(async () => Buffer.from([++frame]));
  await expect(stableScreenshot({ screenshot, waitForTimeout }, route, 'dark')).rejects.toThrow(`${route} (dark)`);
  expect(screenshot).toHaveBeenCalledTimes(21);
});

it('returns the matching frame as soon as the editor settles', async () => {
  const match = Buffer.from([2]);
  const screenshot = vi
    .fn(async () => match)
    .mockResolvedValueOnce(Buffer.from([1]))
    .mockResolvedValueOnce(Buffer.from([2]));
  expect(await stableScreenshot({ screenshot, waitForTimeout }, route, 'light')).toBe(match);
  expect(screenshot).toHaveBeenCalledTimes(3);
});
