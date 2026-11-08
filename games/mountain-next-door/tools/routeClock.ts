// The way through The Clock Tower: each floor walked for its drifts of snow and its sign, then up the flue's smoke from
// the start of a puff (the same human orders as routeGrow.ts).
import type { StarterBot } from '../../kit/starter/bot';
import { CLOCK_AT, FLOORS } from '../src/levels/clock';
import { POINTS } from '../src/props';
import { step, take } from './route';
import { waitUp } from './routeLate';
import { leave, must, readAt, score, watchFor } from './routeKit';

/** 15. The Clock Tower. */
export async function theClockTower(bot: StarterBot): Promise<void> {
  const from = bot.sim.ci.score;
  const C = CLOCK_AT;
  const feet = (k: number) => FLOORS[k] - 1;
  /** Rides floor k's flue up to floor k + 1: a flue at the right end is entered going right, one at the left going left. */
  const ride = async (k: number) => {
    const x = C.flues[k];
    const right = x > 20;
    await must(bot, bot.walk(right ? x - 1 : x + 1, 'the flue'), 'to the flue');
    await waitUp(bot, 'clock', 'puff0', x, feet(k), true, `flue ${k + 1} puffing`);
    await step(bot, right ? 'right' : 'left', 5, `into flue ${k + 1}`);
    await watchFor(bot, () => bot.px.y / 20 <= feet(k + 1) + 3.5, `riding flue ${k + 1}`, 300);
    await must(bot, bot.walk(right ? x - 2 : x + 2, `off flue ${k + 1}`), `off flue ${k + 1}`);
    await must(bot, bot.land(), 'landing');
    if (Math.round(bot.px.y / 20) !== feet(k + 1)) throw new Error(`flue ${k + 1}: not on its floor (row ${bot.px.y / 20}, wanted ${feet(k + 1)})`);
  };
  for (let k = 0; k < FLOORS.length; k++) {
    const dir = k % 2 ? -1 : 1;
    const stops: [number, () => Promise<void>][] = [
      ...C.flakes[k].map((x): [number, () => Promise<void>] => [x, () => take(bot, x, POINTS.flake, `a drift of snow at ${x}`)]),
      ...C.signs.filter(([f]) => f === k).map(([, x]): [number, () => Promise<void>] => [x, () => readAt(bot, x + 1, `the sign at ${x}`)]),
    ];
    stops.sort((a, b) => (a[0] - b[0]) * dir);
    for (const [, go] of stops) await go();
    if (k < C.flues.length) await ride(k);
  }
  score(bot, from, C.flakes.flat().length * POINTS.flake, 'the clock tower');
  await leave(bot, bot.walk(C.exit, 'the exit'), 'the exit');
}
