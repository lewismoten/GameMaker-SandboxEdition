// A blue bird can hatch and disappear before the quiet period ends.
import { expect, it } from 'vitest';
import type { StarterBot } from '../../kit/starter/bot';
import { PATH_NEST_X, STAND } from '../src/levels';
import { BIRD, BLUEBIRD } from '../src/monsters';
import { emptyNest, ORIGIN } from './route';

it('rejects a transient blue bird on its first tick after the path nest empties', async () => {
  const ci = { score: 0 };
  const w = { map: new Uint8Array(10000), mm: [BIRD, BLUEBIRD, BLUEBIRD].map((monnum) => ({ monnum })) };
  let quietTicks = 0;
  let emptied = false;
  const bot = {
    sim: { ci, w },
    say() {},
    async walk(x: number) {
      if (x === PATH_NEST_X + 1) {
        emptied = true;
        w.map[(STAND + ORIGIN) * 100 + PATH_NEST_X + ORIGIN] = 1;
        w.mm = [];
      }
      if (x === 40) ci.score = 60;
      if (x === 43) return 'end';
    },
    async wait(ticks: number) {
      if (emptied) {
        quietTicks += ticks;
        w.mm = quietTicks >= 10 && quietTicks < 70 ? [{ monnum: BLUEBIRD }] : [];
      }
    },
  };
  await expect(emptyNest(bot as unknown as StarterBot)).rejects.toThrow('the emptied nest should hatch no more');
  expect(quietTicks).toBe(10);
});
