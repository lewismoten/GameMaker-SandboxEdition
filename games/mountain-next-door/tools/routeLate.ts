// The way through the second half's added levels (routeMore.ts has the morning's): the same human orders, a look
// at every sign, a wait for anything on a clock, every treasure taken.
import type { StarterBot } from '../../kit/starter/bot';
import { LANDINGS, TOWER_AT, towerFeet } from '../src/levels/tower';
import { POINTS } from '../src/props';
import { blocks, ladder, take } from './route';
import { READ, leave, must, readAt, score, shownAt, watchFor } from './routeKit';

/** Waits like a person for the block `name` at (`x`, `row`) of level `file` to show; `fresh`: wait for it to go and come back, so there is a whole turn to cross. */
export async function waitUp(bot: StarterBot, file: string, name: string, x: number, row: number, fresh: boolean, what: string): Promise<void> {
  const up = blocks(file).n(name);
  const isUp = () => shownAt(bot, x, row) === up;
  if (fresh && isUp()) await watchFor(bot, () => !isUp(), `${what} dropping`, 400);
  await watchFor(bot, isUp, `${what} coming up`, 400);
}

/** 9. The Lookout: seven landings, a lamp lit on each, the loose boards timed (the out-of-step pair from the sound board between), the view. */
export async function lookout(bot: StarterBot): Promise<void> {
  const from = bot.sim.ci.score;
  const T = TOWER_AT;
  const at = T.signs;
  const up = (k: number) => ladder(bot, T.ladders[k], 'up', towerFeet(k), `the ladder to landing ${k + 1}`);
  const lamp = (k: number) => take(bot, T.lamps[k], POINTS.lantern, `the lamp on landing ${k + 1}`);
  const run = (k: number, i = 0) => T.loose.filter(([l]) => l === k)[i];
  const over = async (k: number, i: number, fresh: boolean) => {
    const [, a, b] = run(k, i);
    await must(bot, bot.walk(a - 1, 'the loose boards'), 'to the loose boards');
    await waitUp(bot, 'tower', 'boardUp', a, LANDINGS[k], fresh, `the loose boards at ${a}`);
    await must(bot, bot.walk(b + 2, 'over the loose boards'), 'over the loose boards');
    if (Math.round(bot.px.y / 20) !== towerFeet(k)) throw new Error(`fell through the boards at ${a}..${b}`);
  };
  await readAt(bot, at.base[1] + 1, 'the lookout sign');
  await up(0);
  await lamp(0);
  await up(1);
  await readAt(bot, at.lamps[1] + 1, 'the lamps sign');
  await lamp(1);
  await up(2);
  await readAt(bot, at.loose[1] + 1, 'the loose boards sign');
  await over(2, 0, true);
  await lamp(2);
  await up(3);
  await readAt(bot, at.log[1] + 1, 'the logbook');
  await lamp(3);
  await up(4);
  await readAt(bot, at.two[1] + 1, 'the out-of-step sign');
  await over(4, 0, true);
  await over(4, 1, false);
  await lamp(4);
  await up(5);
  await lamp(5);
  await up(6);
  await readAt(bot, at.view[1] + 1, 'the view');
  await must(bot, bot.wait(READ), 'a long look at the trail of snow');
  score(bot, from, 6 * POINTS.lantern, 'the lookout');
  await leave(bot, bot.walk(T.exit + 1, 'the exit'), 'the exit');
}
