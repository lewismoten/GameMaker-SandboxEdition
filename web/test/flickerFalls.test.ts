// Play the Falls with a shifted starting tile in the outer lip.
import { expect, it } from 'vitest';
import { play } from '../../games/flicker/tools/play';
import { theFalls } from '../../games/flicker/tools/route';
import { buildLevels } from '../../games/flicker/src/levels';
import { ORIGIN } from '../../games/kit/starter/map';

it('rejects an outer lip starting one frame ahead on the map', async () => {
  const { bot, sim } = await play(1, 1);
  const level = buildLevels().levels[1];
  const lip = level.things.find((t) => t.ring === 'lipR')!;
  sim.w.map[(lip.y + ORIGIN) * 100 + lip.x + ORIGIN] = level.book.n('lipR.1');
  await expect(theFalls(bot)).rejects.toThrow('lipR starts on the wrong map frame');
});

it('rejects an outer splash running one frame ahead at the right speed', async () => {
  const { bot, sim } = await play(1, 1);
  const { book } = buildLevels().levels[1];
  sim.w.blkmap[book.n('splashR.0')] = book.n('splashR.1');
  await expect(theFalls(bot)).rejects.toThrow('splashR should step with the left column');
});
