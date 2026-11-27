// A broken lit twin must fail the route even while the engine keeps ticking.
import { existsSync } from 'node:fs';
import { expect, it, vi } from 'vitest';
import { bgBlock } from '@lewismoten/gamemaker-sandbox-engine/engine/world';
import { StarterBot } from '../../kit/starter/bot';
import { buildLevels } from '../src/levels';
import { DARK, LIT } from '../src/storm';
import { GameSim } from './sim';
import { flashAndRumble } from './route';

it.skipIf(!existsSync(new URL('../disk/one.bbl', import.meta.url)))('rejects a flash that stays lit on the first excess tick', async () => {
  const bot = new StarterBot(new GameSim());
  const { book, timed } = buildLevels().levels[0];
  for (const block of timed.filter((t) => t.name.endsWith('.lit'))) {
    const index = book.n(block.name);
    bgBlock(bot.sim.w, index).nextBl = index;
  }
  const tick = bot.tick.bind(bot);
  let ticks = 0;
  vi.spyOn(bot, 'tick').mockImplementation(() => {
    if (++ticks > DARK * 2) throw new Error('test stopped a stuck route');
    return tick();
  });
  await expect(flashAndRumble(bot)).rejects.toThrow(`the flash lasted ${LIT + 1} ticks`);
});
