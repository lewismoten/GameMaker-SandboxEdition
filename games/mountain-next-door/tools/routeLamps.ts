// The way through The Lamplighter's Stair: each terrace walked for its lamps, posts and acorns, each alley crossed on
// the fog once its last step has just come up, a ladder up at each end (the same human orders as routeHour.ts).
import type { StarterBot } from '../../kit/starter/bot';
import { FOG_STEPS, LAMPS_AT, LAMP_ROWS, lampFeet } from '../src/levels/lamps';
import { POINTS } from '../src/props';
import { blocks, take } from './route';
import { climbUp, leave, must, readAt, score, shownAt, watchFor } from './routeKit';
import { inOrder, type Stop } from './routeHour';

/** 14. The Lamplighter's Stair. */
export async function lamplightersStair(bot: StarterBot): Promise<void> {
  const from = bot.sim.ci.score;
  const A = LAMPS_AT;
  const up = blocks('lamps').n(`mist${FOG_STEPS - 1}u`);
  let want = 0;
  for (let k = 0; k < LAMP_ROWS.length; k++) {
    const dir = k % 2 ? -1 : 1;
    const t = LAMP_ROWS[k];
    const stops: Stop[] = [];
    for (const [pts, xs] of [
      [POINTS.lantern, A.lamps[k]],
      [POINTS.blaze, A.posts[k]],
      [POINTS.acorn, A.acorns[k]],
    ] as const)
      for (const x of xs) {
        want += pts;
        stops.push([x, () => take(bot, x, pts, `a lamp, post or acorn at ${x}`)]);
      }
    if (A.pie[0] === k) stops.push([A.pie[1], () => must(bot, bot.walk(A.pie[1], 'the pie'), 'to the pie')]);
    for (const [kk, x] of A.signs) if (kk === k) stops.push([x, () => readAt(bot, x + 1, `the sign at ${x}`)]);
    for (const x0 of A.alleys[k]) {
      const edge = dir > 0 ? x0 - 1 : x0 + FOG_STEPS * 2;
      const lastLeft = dir > 0 ? x0 + 2 * (FOG_STEPS - 1) : x0;
      const isUp = () => shownAt(bot, lastLeft, t) === up;
      stops.push([
        edge,
        async () => {
          await must(bot, bot.walk(edge, 'the alley'), 'to the alley');
          if (isUp()) await watchFor(bot, () => !isUp(), 'the fog thinning', 400);
          await watchFor(bot, isUp, 'the last fog step coming up', 400);
          await must(bot, bot.walk(dir > 0 ? x0 + FOG_STEPS * 2 + 1 : x0 - 2, 'across the alley'), 'across the alley');
          if (bot.px.y / 20 > lampFeet(k)) throw new Error(`fell in the alley at ${x0}`);
        },
      ]);
    }
    await inOrder(stops, dir);
    if (k < A.ladders.length) await climbUp(bot, A.ladders[k], lampFeet(k + 1), `the ladder up from terrace ${k + 1}`);
  }
  score(bot, from, want, "the lamplighter's stair");
  await leave(bot, bot.walk(A.exit, 'the exit'), 'the exit');
}
