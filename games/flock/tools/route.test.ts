// A level must reject a collapsed flock before the first bot order.
import { expect, it } from 'vitest';
import type { StarterBot } from '../../kit/starter/bot';
import { BIRD } from '../src/monsters';
import { oneShape, outOfStep } from './route';

it.each([oneShape, outOfStep])('%s checks the relative spawn positions', async (route) => {
  const birds = Array.from({ length: 5 }, () => ({ monnum: BIRD }));
  const bot = {
    sim: { ci: { score: 0 }, w: { mm: birds, mi: birds.map(() => ({ curx: [12, 0], cury: [6, 0] })) } },
  } as unknown as StarterBot;
  await expect(route(bot)).rejects.toThrow('birds should begin in a V');
});
