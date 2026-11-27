// The Escape press ends a title demo after its recorded delay.
import { expect, it, vi } from 'vitest';
import { playDemoKeys } from './demoReplay';

it.each([0, 25])('stops after the %i ticks before Escape', async (delta) => {
  let ticks = 0;
  const sim = { press: vi.fn(), release: vi.fn() };
  await playDemoKeys(
    [
      { delta: 1, key: 77 },
      { delta: 2, key: 205 },
      { delta, key: 1 },
      { delta: 2, key: 129 },
    ],
    sim,
    async () => {
      ticks++;
    },
  );
  expect(ticks).toBe(3 + delta);
  expect(sim.press.mock.calls).toEqual([[77]]);
  expect(sim.release.mock.calls).toEqual([[77]]);
});
