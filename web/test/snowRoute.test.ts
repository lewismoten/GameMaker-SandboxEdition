// Check the second snow lesson against changes that undo the trail or the drift.
import { expect, it, vi } from 'vitest';
import { ORIGIN } from '../../games/kit/starter/map';
import { buildLevels } from '../../games/snow/src/levels';
import { play } from '../../games/snow/tools/play';
import { pilesUp } from '../../games/snow/tools/route';

it.each([0, 1, 2, 'footprints'] as const)('rejects a late change to %s', async (part) => {
  const { bot, sim } = await play(1, 1);
  const { book } = buildLevels().levels[1];
  const wait = bot.wait.bind(bot);
  vi.spyOn(bot, 'wait').mockImplementation(async (ticks) => {
    const result = await wait(ticks);
    if (ticks === 30) {
      if (part === 'footprints') sim.w.map[(ORIGIN + 9) * 100 + ORIGIN + 17] = book.n('powder');
      else sim.w.blkmap[book.n(`drift${part}.0`)] = book.n(`drift${part}.0`);
    }
    return result;
  });
  await expect(pilesUp(bot)).rejects.toThrow(part === 'footprints' ? 'footprints disappeared' : `drift column ${part}`);
});
