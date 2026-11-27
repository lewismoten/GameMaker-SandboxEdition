// Check the Frost Lot route at the last slab's crack and drop boundaries.
import { expect, it, vi } from 'vitest';
import type { StarterBot } from '../../kit/starter/bot';
import { frostLot } from './route';

function crossing(ticks: number) {
  const bot = {
    sim: { ticks, ci: { hitpts: 100, meter: [0, 1] } },
    walk: vi.fn((_x: number, where: string) => Promise.resolve(where === 'the exit' ? 'link' : undefined)),
    wait: vi.fn().mockResolvedValue(undefined),
    say: vi.fn(),
  };
  return frostLot(bot as unknown as StarterBot);
}

it.each([901, 969])('allows crossing on cracked ice at tick %i', async (ticks) => {
  await expect(crossing(ticks)).resolves.toBeUndefined();
});

it('rejects a crossing after the final slab drops', async () => {
  await expect(crossing(971)).rejects.toThrow('too slow for the ice');
});
