// Play the Falls with a shifted starting tile in the outer lip.
import { expect, it } from 'vitest';
import { play } from '../../games/flicker/tools/play';
import { theFalls, torchHall } from '../../games/flicker/tools/route';
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

it('rejects one erased flame even when another torch uses its loop', async () => {
  const { bot, sim } = await play(1, 0);
  const level = buildLevels().levels[0];
  const flame = level.things.find((t) => t.ring === 'flameA')!;
  sim.w.map[(flame.y + ORIGIN) * 100 + flame.x + ORIGIN] = level.book.n('sky');
  await expect(torchHall(bot)).rejects.toThrow('flameA starts on the wrong map frame');
});
