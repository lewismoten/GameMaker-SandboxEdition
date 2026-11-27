// The evening check must catch a hill that returns to its first picture between signs.
import { expect, it } from 'vitest';
import type { StarterBot } from '../../kit/starter/bot';
import { ORIGIN } from '../../kit/starter/map';
import { DOOR_COL, HAZE_ROWS } from '../src/view';
import { coolEvening } from './route';

it.each(HAZE_ROWS)('stops on the first moving tick in evening hill row %i', async (row) => {
  const map = new Uint8Array(10000);
  map[(row + ORIGIN) * 100 + 10 + ORIGIN] = 1;
  const blkmap = [0, 1];
  let tick = 0;
  const bot = {
    sim: { w: { map, blkmap } },
    land: () => Promise.resolve(undefined),
    wait: (ticks: number) => {
      tick += ticks;
      blkmap[1] = 1 + (tick % 2);
      return Promise.resolve(undefined);
    },
    walk: (col: number) => Promise.resolve(col === DOOR_COL ? 'end' : undefined),
  };
  await expect(coolEvening(bot as unknown as StarterBot)).rejects.toThrow('hills blocks should not change');
  expect(tick).toBe(1);
});
