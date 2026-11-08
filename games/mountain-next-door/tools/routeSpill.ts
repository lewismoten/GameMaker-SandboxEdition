// The way through The Spillway: each terrace crossed on its stones (waiting on the bank until the next run has just
// come up), its blazes and acorns taken, its signs read, and the ladder down to the next (the same human orders as
// routeGrow.ts).
import type { StarterBot } from '../../kit/starter/bot';
import { SPILL_AT, TERRACES, spillFeet } from '../src/levels/spillway';
import { POINTS } from '../src/props';
import { blocks, cross, ladder, take } from './route';
import { leave, must, readAt, score, shownAt, watchFor } from './routeKit';

/** Crosses a stream leftward on its runs of stones (`cross` in route.ts goes rightward): wait for a run to have just come up, then walk it. */
async function crossLeft(bot: StarterBot, runs: readonly (readonly [number, number, ...unknown[]])[], ground: number, what: string): Promise<void> {
  const up = blocks('spill').n('stoneUp');
  const isUp = (x: number) => shownAt(bot, x, ground) === up;
  await must(bot, bot.walk(runs[runs.length - 1][1] + 1, what), `to ${what}`);
  for (const [i, [a, b]] of [...runs].reverse().entries()) {
    if (i === 0 && isUp(b)) await watchFor(bot, () => !isUp(b), `the stones at ${b} going down`, 400);
    await watchFor(bot, () => isUp(b), `the stones at ${b} coming up`, 400);
    await must(bot, bot.walk(a, `across ${what}`), `across ${what}`);
    if (bot.px.y / 20 > ground - 1) throw new Error(`fell in at ${what} (x ${bot.px.x / 20})`);
  }
  await must(bot, bot.walk(runs[0][0] - 2, `out of ${what}`), `out of ${what}`);
  if (bot.px.y / 20 > ground - 1) throw new Error(`fell in at ${what}`);
}

/** 12. The Spillway. */
export async function theSpillway(bot: StarterBot): Promise<void> {
  const from = bot.sim.ci.score;
  const A = SPILL_AT;
  let want = 0;
  for (let k = 0; k < TERRACES.length; k++) {
    const dir = k % 2 ? -1 : 1;
    const t = TERRACES[k];
    const stops: [number, () => Promise<void>][] = [];
    for (const [kk, x] of A.posts)
      if (kk === k) {
        want += POINTS.blaze;
        stops.push([x, () => take(bot, x, POINTS.blaze, `a blaze at ${x}`)]);
      }
    for (const [kk, x] of A.acorns)
      if (kk === k) {
        want += POINTS.acorn;
        stops.push([x, () => take(bot, x, POINTS.acorn, `an acorn at ${x}`)]);
      }
    if (A.pie[0] === k) stops.push([A.pie[1], () => must(bot, bot.walk(A.pie[1], 'the pie'), 'to the pie')]);
    A.signs.forEach(([kk, x]) => {
      if (kk === k) stops.push([x, () => readAt(bot, x + 1, `the sign at ${x}`)]);
    });
    for (const runs of A.crossings[k]) {
      const edge = dir === 1 ? runs[0][0] : runs[runs.length - 1][1];
      stops.push([
        edge,
        () => (dir === 1 ? cross(bot, runs, t, `a pool on terrace ${k + 1}`, 'spill') : crossLeft(bot, runs, t, `a pool on terrace ${k + 1}`)),
      ]);
    }
    stops.sort((a, b) => (a[0] - b[0]) * dir);
    for (const [, go] of stops) await go();
    if (k < A.ladders.length) await ladder(bot, A.ladders[k], 'down', spillFeet(k + 1), `the ladder down from terrace ${k + 1}`);
  }
  score(bot, from, want, 'the spillway');
  await leave(bot, bot.walk(A.exit, 'the exit'), 'the exit');
}
