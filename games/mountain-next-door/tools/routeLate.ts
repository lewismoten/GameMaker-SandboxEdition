// The way through the second half's added levels (routeMore.ts has the morning's): the same human orders, a look
// at every sign, a wait for anything on a clock, every treasure taken.
import type { StarterBot } from '../../kit/starter/bot';
import { ROOFS_AT } from '../src/levels/roofs';
import { LANDINGS, TOWER_AT, towerFeet } from '../src/levels/tower';
import { POINTS } from '../src/props';
import { blocks, ladder, rideUp, take } from './route';
import { READ, hop, leave, must, readAt, score, shownAt, watchFor } from './routeKit';

/** Waits like a person for the block `name` at (`x`, `row`) of level `file` to show; `fresh`: wait for it to go and come back, so there is a whole turn to cross. */
export async function waitUp(bot: StarterBot, file: string, name: string, x: number, row: number, fresh: boolean, what: string): Promise<void> {
  const up = blocks(file).n(name);
  const isUp = () => shownAt(bot, x, row) === up;
  if (fresh && isUp()) await watchFor(bot, () => !isUp(), `${what} dropping`, 400);
  await watchFor(bot, isUp, `${what} coming up`, 400);
}

/** 11. Rooftops: every drift of snow, the stacks hopped, each chimney watched and ridden from the start of a puff. */
export async function rooftops(bot: StarterBot): Promise<void> {
  const from = bot.sim.ci.score;
  const R = ROOFS_AT;
  const at = R.signs;
  const flake = (x: number) => take(bot, x, POINTS.flake, `the drift of snow at ${x}`);
  const chimney = async (k: number) => {
    const [x, roof, to] = R.puffs[k];
    await must(bot, bot.walk(x - 1, 'the chimney'), 'to the chimney');
    await waitUp(bot, 'roofs', 'puff0', x, roof - 1, true, `chimney ${k + 1} puffing`);
    await rideUp(bot, x, to, `chimney ${k + 1}'s smoke`);
  };
  await must(bot, bot.walk(at.over + 1, 'the over-the-roofs spot'), 'to the over-the-roofs spot');
  await flake(10);
  await flake(16);
  await hop(bot, R.stacks[0][0], 1, 'the chimney stack');
  await must(bot, bot.walk(at.smoke + 2, 'the smoke spot'), 'to the smoke spot');
  await flake(23);
  await chimney(0);
  await flake(31);
  await flake(34);
  await must(bot, bot.walk(at.clock + 1, 'the clock spot'), 'to the clock spot');
  await flake(41);
  await flake(45);
  await chimney(1);
  await flake(53);
  await chimney(2);
  await readAt(bot, at.friends + 1, 'the chimneys sign');
  await flake(62);
  await hop(bot, R.stacks[1][0], 1, 'the chimney stack');
  await flake(68);
  await flake(74);
  await flake(78);
  await must(bot, bot.walk(at.mill + 1, 'the mill road spot'), 'to the mill road spot');
  await flake(83);
  score(bot, from, R.flakes.length * POINTS.flake, 'rooftops');
  await leave(bot, bot.walk(R.exit + 1, 'the exit'), 'the exit');
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
  await must(bot, bot.walk(at.lamps[1] + 1, 'the lamps spot'), 'to the lamps spot');
  await lamp(1);
  await up(2);
  await must(bot, bot.walk(at.loose[1] + 1, 'the loose boards spot'), 'to the loose boards spot');
  await over(2, 0, true);
  await lamp(2);
  await up(3);
  await readAt(bot, at.log[1] + 1, 'the logbook');
  await lamp(3);
  await up(4);
  await must(bot, bot.walk(at.two[1] + 1, 'the out-of-step spot'), 'to the out-of-step spot');
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
