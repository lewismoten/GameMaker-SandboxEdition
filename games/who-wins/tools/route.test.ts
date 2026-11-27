// Replay the lesson with a star that expires before reaching the big one.
import { expect, it } from 'vitest';
import { STAR } from '../src/monsters';
import { play } from './play';
import { throwStar } from './route';

it('rejects a missed star that fizzles at the end of its lifetime', async () => {
  const { bot, sim } = await play(1, 1);
  expect(await bot.walk(15)).toBeUndefined();
  const beforeThrow = bot.snapshot();
  expect(await throwStar(bot, 'at the big one')).toBe(true);
  bot.restore(beforeThrow);
  sim.w.mon[STAR].end = 2;
  expect(await throwStar(bot, 'at the big one')).toBe(false);
});
