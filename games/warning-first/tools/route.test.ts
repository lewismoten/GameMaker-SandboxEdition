// Keep the warning check sensitive to the picture even when the clock and block names are intact.
import { expect, it } from 'vitest';
import { StarterBot } from '../../kit/starter/bot';
import { buildLevels, ventBlock } from '../src/levels';
import { flickerThenGone, rumbleThenPuff } from './route';
import { GameSim } from './sim';

it.each(['grate', 'plank'])('rejects a static %s warning', async (kind) => {
  const bot = new StarterBot(new GameSim());
  bot.jumpHold = 8;
  const grate = kind === 'grate';
  if (!grate) await rumbleThenPuff(bot);
  const { book } = buildLevels().levels[grate ? 0 : 1];
  const first = grate ? ventBlock(0, 'g', 'rumble') : 'p0.flicker';
  const blocks = bot.sim.w.bg;
  for (const suffix of ['2', '4']) blocks[book.n(first + suffix)].pixels.set(blocks[book.n(first)].pixels);
  await expect((grate ? rumbleThenPuff : flickerThenGone)(bot)).rejects.toThrow(/warning pictures/);
});
