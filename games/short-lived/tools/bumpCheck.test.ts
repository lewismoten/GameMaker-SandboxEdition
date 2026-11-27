// A lost life must fail either collision even when the starting lives meter stays full.
import { afterEach, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
});

it.each([
  ['the sleeper', 'touching the sleeper changed hit points or lives'],
  ['through the awake one', 'walking through the awake one cost something'],
])('detects a life lost on the walk labeled "%s"', async (collision, message) => {
  const { SLEEPERS } = await import('../src/monsters');
  const ci = { lives: 3, meter: [0, 3], hitpts: 5 };
  const px = { x: 0 };
  let asleep = true;
  const bot = {
    px,
    walk(x: number, label: string) {
      px.x = x * 20;
      if (label === collision) ci.lives--;
    },
    wait(ticks: number) {
      if (ticks === 10) asleep = false;
    },
  };
  vi.doMock('./play', () => ({ play: () => ({ sim: { ci, press: vi.fn(), release: vi.fn() }, bot }) }));
  vi.doMock('./route', () => ({ alive: (_bot: unknown, ids: unknown) => Number((ids === SLEEPERS) === asleep) }));
  vi.spyOn(process, 'exit').mockImplementation(() => {
    throw new Error('probe failed');
  });
  const error = vi.spyOn(console, 'error').mockImplementation(() => {});
  await expect(import('./bumpCheck')).rejects.toThrow('probe failed');
  expect(error).toHaveBeenCalledWith(`bumpCheck: ${message}`);
});
