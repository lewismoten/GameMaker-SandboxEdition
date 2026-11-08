// The way through the levels added in the second hour pass: Hale's Orchard and the ones after it (the same human
// orders as routeGrow.ts: read every sign, take every treasure, wait for anything on a clock).
import type { StarterBot } from '../../kit/starter/bot';
import { ORCHARD_AT, ORCHARD_ROWS, orchardFeet } from '../src/levels/orchard';
import { POINTS } from '../src/props';
import { blocks, take } from './route';
import { climbUp, leave, must, READ, readAt, score, shownAt, watchFor } from './routeKit';

/** What a stop on the way is: a column to walk to and the order to carry out there. */
export type Stop = [number, () => Promise<void>];

/** Runs the stops in order of column, rightward (1) or leftward (-1). */
export async function inOrder(stops: Stop[], dir: 1 | -1 = 1): Promise<void> {
  stops.sort((a, b) => (a[0] - b[0]) * dir);
  for (const [, go] of stops) await go();
}

/** Passes a yard gate at column `x` (its lower half on ground row `ground`) going `dir`: waits for it to swing shut, then open, and walks through. */
export async function passGate(bot: StarterBot, file: string, x: number, ground: number, dir: 1 | -1): Promise<void> {
  const open = blocks(file).n('swingOpen1');
  const isOpen = () => shownAt(bot, x, ground - 1) === open;
  await must(bot, bot.walk(x - dir, 'the gate'), 'to the gate');
  if (isOpen()) await watchFor(bot, () => !isOpen(), 'the gate swinging shut', 400);
  await watchFor(bot, isOpen, 'the gate swinging open', 400);
  await must(bot, bot.walk(x + 2 * dir, 'through the gate'), 'through the gate');
}

/** 10. Hale's Orchard: three terraces of windfall apples and trunks to blaze, the swinging gates waited for, a ladder up at each end. */
export async function halesOrchard(bot: StarterBot): Promise<void> {
  const from = bot.sim.ci.score;
  const A = ORCHARD_AT;
  let want = 0;
  for (let k = 0; k < ORCHARD_ROWS.length; k++) {
    const dir = k % 2 ? -1 : 1;
    const t = ORCHARD_ROWS[k];
    const stops: Stop[] = [];
    for (const x of A.trees[k]) {
      want += POINTS.blaze;
      stops.push([x, () => take(bot, x, POINTS.blaze, `a trunk at ${x}`)]);
    }
    for (const x of A.apples[k]) {
      want += POINTS.apple;
      stops.push([x, () => take(bot, x, POINTS.apple, `an apple at ${x}`)]);
    }
    if (A.pie[0] === k) stops.push([A.pie[1], () => must(bot, bot.walk(A.pie[1], 'the pie'), 'to the pie')]);
    for (const [kk, x] of A.signs) if (kk === k) stops.push([x, () => readAt(bot, x + 1, `the sign at ${x}`)]);
    for (const [x] of A.gates[k]) stops.push([x - 2 * dir, () => passGate(bot, 'grove', x, t, dir)]);
    await inOrder(stops, dir);
    if (k < A.ladders.length) {
      await must(bot, bot.wait(READ / 5), 'a breath');
      await climbUp(bot, A.ladders[k], orchardFeet(k + 1), `the ladder up from terrace ${k + 1}`);
    }
  }
  score(bot, from, want, "hale's orchard");
  await leave(bot, bot.walk(A.exit, 'the exit'), 'the exit');
}
