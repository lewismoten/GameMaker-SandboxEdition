// Exercises the desk driver's screenshot polling without booting the desk.
import { afterEach, expect, it, vi } from 'vitest';
import { settle } from './deskSettle';

function sequence(frames: string[]) {
  vi.useFakeTimers();
  return {
    screenshot: vi.fn(async () => Buffer.from(frames.shift()!)),
    waitForTimeout: async (ms: number) => {
      vi.advanceTimersByTime(ms);
    },
  };
}

afterEach(() => vi.useRealTimers());

it('continues once consecutive screenshots match', async () => {
  const page = sequence(['A', 'B', 'B']);
  await settle(page, undefined, 750);
  expect(page.screenshot).toHaveBeenCalledTimes(3);
});

it('reports a timeout when the screen keeps changing', async () => {
  const page = sequence(['A', 'B', 'C']);
  await expect(settle(page, undefined, 750)).rejects.toThrow(/screen.*settle.*750 ms/i);
  expect(page.screenshot).toHaveBeenCalledTimes(3);
});
