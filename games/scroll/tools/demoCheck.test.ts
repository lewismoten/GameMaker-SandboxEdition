// Exercise the command's verdict with the title demo's possible replay outcomes.
import { expect, it, vi } from 'vitest';

const replay = vi.hoisted(() => vi.fn());
vi.mock('../../kit/walkthrough', () => ({ replay }));
vi.mock('node:fs', () => ({ readFileSync: () => new Uint8Array() }));

it.each([
  [{ scenes: [2, 3, 4], keysLeft: 0 }, /expected scenes/],
  [{ scenes: [2, 3, 3], keysLeft: 0 }, /expected scenes/],
  [{ scenes: [2, 3], keysLeft: 1 }, /1 keys unplayed/],
  [{ scenes: [2, 3], keysLeft: 0, error: 'unexpected scene' }, /replay failed: unexpected scene/],
])('rejects an unexpected replay outcome %o', async (result, reason) => {
  vi.resetModules();
  replay.mockResolvedValue(result);
  await expect(import('./demoCheck')).rejects.toThrow(reason);
});
