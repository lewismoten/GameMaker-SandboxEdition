// The way through The Frozen Tarn: each reach walked for its blazes, acorns and signs, its runs of plates crossed
// once a run has just come up, its wave of single plates gone with (the same human orders as routeSpill.ts and the
// stream's ripple), the ladder up between the reaches.
import type { StarterBot } from '../../kit/starter/bot';
import { TARN_AT, TARN_ROWS, tarnFeet } from '../src/levels/tarn';
import { POINTS } from '../src/props';
import { blocks, ladder, take } from './route';
import { inOrder, type Stop } from './routeHour';
import { leave, must, readAt, score, shownAt, watchFor } from './routeKit';

type Runs = readonly (readonly [number, number, ...unknown[]])[];

/** Crosses a pool of plate runs going `dir`: waits on the bank for the first run to have just come up, then walks each run in turn. */
async function crossRuns(bot: StarterBot, runs: Runs, ground: number, dir: 1 | -1): Promise<void> {
  const up = blocks('tarn').n('stoneUp');
  const isUp = (x: number) => shownAt(bot, x, ground) === up;
  const ordered = dir > 0 ? runs : [...runs].reverse();
  const bank = dir > 0 ? runs[0][0] - 1 : runs[runs.length - 1][1] + 1;
  await must(bot, bot.walk(bank, 'the pool'), 'to the pool');
  for (const [i, [a, b]] of ordered.entries()) {
    const near = dir > 0 ? a : b;
    const far = dir > 0 ? b : a;
    if (i === 0 && isUp(near)) await watchFor(bot, () => !isUp(near), `the plates at ${near} going down`, 400);
    await watchFor(bot, () => isUp(near), `the plates at ${near} coming up`, 400);
    await must(bot, bot.walk(far, 'across the pool'), 'across the pool');
    if (bot.px.y / 20 > ground - 1) throw new Error(`fell in at ${near} (x ${bot.px.x / 20})`);
  }
  const out = dir > 0 ? runs[runs.length - 1][1] + 2 : runs[0][0] - 2;
  await must(bot, bot.walk(out, 'out of the pool'), 'out of the pool');
  if (bot.px.y / 20 > ground - 1) throw new Error('fell in leaving the pool');
}

/** The wave: waits on the bank for the first plate to rise fresh, then hops plate to plate as each comes up. */
async function crossWave(bot: StarterBot, water: readonly [number, number], stones: readonly number[], ground: number, dir: 1 | -1): Promise<void> {
  const book = blocks('tarn');
  const up = (x: number) => shownAt(bot, x, ground) === book.n('rUpA') || shownAt(bot, x, ground) === book.n('rUpB');
  const bank = dir > 0 ? water[0] - 1 : water[1] + 1;
  await must(bot, bot.walk(bank, 'the wave bank'), 'to the wave bank');
  if (up(stones[0])) await watchFor(bot, () => !up(stones[0]), 'the first plate going down', 400);
  await watchFor(bot, () => up(stones[0]), 'the first plate coming up', 400);
  const far = dir > 0 ? water[1] + 1 : water[0] - 1;
  for (const [i, x] of [...stones, far].entries()) {
    if (i > 0 && i < stones.length) await watchFor(bot, () => up(x), `the plate at ${x} coming up`, 400);
    await must(bot, bot.jump(dir > 0 ? 'right' : 'left', x), `to the plate at ${x}`);
    if (bot.px.y / 20 > ground - 1) throw new Error(`fell in at the plate at ${x}`);
  }
}

/** 19. The Frozen Tarn. */
export async function frozenTarn(bot: StarterBot): Promise<void> {
  const from = bot.sim.ci.score;
  const A = TARN_AT;
  let want = 0;
  for (let k = 0; k < TARN_ROWS.length; k++) {
    const dir = k % 2 ? -1 : 1;
    const t = TARN_ROWS[k];
    const r = A.reaches[k];
    const stops: Stop[] = [];
    for (const x of A.posts[k]) {
      want += POINTS.blaze;
      stops.push([x, () => take(bot, x, POINTS.blaze, `a blaze at ${x}`)]);
    }
    for (const x of [...A.acorns[k], ...r.ripple.stones]) {
      want += POINTS.acorn;
      if (r.ripple.stones.includes(x as never)) continue; // taken on the plates
      stops.push([x, () => take(bot, x, POINTS.acorn, `an acorn at ${x}`)]);
    }
    if (A.pie[0] === k) stops.push([A.pie[1], () => must(bot, bot.walk(A.pie[1], 'the pie'), 'to the pie')]);
    for (const [kk, x] of A.signs) if (kk === k) stops.push([x, () => readAt(bot, x + 1, `the sign at ${x}`)]);
    for (const runs of r.runs) stops.push([dir > 0 ? runs[0][0] : runs[runs.length - 1][1], () => crossRuns(bot, runs, t, dir)]);
    stops.push([dir > 0 ? r.ripple.water[0] : r.ripple.water[1], () => crossWave(bot, r.ripple.water, r.ripple.stones, t, dir)]);
    await inOrder(stops, dir);
    if (k < TARN_ROWS.length - 1) await ladder(bot, A.ladder, 'up', tarnFeet(k + 1), 'the ladder up to the upper tarn');
  }
  score(bot, from, want, 'the frozen tarn');
  await leave(bot, bot.walk(A.exit, 'the exit'), 'the exit');
}
