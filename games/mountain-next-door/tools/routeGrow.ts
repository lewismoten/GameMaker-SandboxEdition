// The way through the levels added in the 3.1 growth pass: The Survey Line and the ones after it. The same human
// orders as routeNew.ts: read every sign, take every treasure, wait for anything on a clock.
import type { StarterBot } from '../../kit/starter/bot';
import { DECKS, SURVEY_AT, surveyFeet } from '../src/levels/survey';
import { POINTS } from '../src/props';
import { ladder, take } from './route';
import { waitUp } from './routeLate';
import { leave, must, readAt, score } from './routeKit';

/** What a stop on the way is: a column to walk to and the order to carry out there. */
type Stop = [number, () => Promise<void>];

/** Runs the stops in order of column, rightward (1) or leftward (-1). */
async function inOrder(stops: Stop[], dir: 1 | -1 = 1): Promise<void> {
  stops.sort((a, b) => (a[0] - b[0]) * dir);
  for (const [, go] of stops) await go();
}

/** 9. The Survey Line: along the first deck (stakes, acorns, the loose boards waited for), up the ladder, back along the second. */
export async function theSurveyLine(bot: StarterBot): Promise<void> {
  const from = bot.sim.ci.score;
  const A = SURVEY_AT;
  const at = A.signs;
  /** Crosses loose run `i` once its boards are up (`fresh`: wait for a whole turn), going `dir`. */
  const over = (i: number, dir: 1 | -1, fresh: boolean): Stop => {
    const [k, a, b] = A.loose[i];
    return [
      dir === 1 ? a : b,
      async () => {
        const [near, far] = dir === 1 ? [a - 1, b + 1] : [b + 1, a - 1];
        await must(bot, bot.walk(near, 'the loose boards'), 'to the loose boards');
        await waitUp(bot, 'survey', 'boardUp', dir === 1 ? a : b, DECKS[k], fresh, `the loose boards at ${a}`);
        await must(bot, bot.walk(far, 'over the loose boards'), 'over the loose boards');
        if (Math.round(bot.px.y / 20) !== surveyFeet(k)) throw new Error(`fell through the boards at ${a}..${b}`);
      },
    ];
  };
  const stake = (k: number): Stop[] => A.stakes.filter(([d]) => d === k).map(([, x]): Stop => [x, () => take(bot, x, POINTS.blaze, `a stake at ${x}`)]);
  const nut = (k: number): Stop[] => A.acorns.filter(([d]) => d === k).map(([, x]): Stop => [x, () => take(bot, x, POINTS.acorn, `an acorn at ${x}`)]);
  const sign = (name: keyof typeof at): Stop => [at[name][1], () => readAt(bot, at[name][1] + 1, `the ${name} sign`)];
  await readAt(bot, at.camp[1] + 1, 'the camp sign');
  await ladder(bot, A.ladders[0], 'up', surveyFeet(0), 'the ladder to the first deck');
  await inOrder([...stake(0), ...nut(0), sign('two'), sign('lunch'), over(0, 1, true), over(1, 1, true), over(2, 1, false)]);
  await ladder(bot, A.ladders[1], 'up', surveyFeet(1), 'the ladder to the second deck');
  const right = (s: Stop) => s[0] > A.ladders[1];
  await inOrder([...stake(1).filter(right), ...nut(1).filter(right)]);
  await must(bot, bot.walk(A.pie[1], 'the pie'), 'to the pie');
  await inOrder(
    [...stake(1).filter((s) => !right(s)), ...nut(1).filter((s) => !right(s)), sign('hat'), sign('form'), over(3, -1, true), over(4, -1, true)],
    -1,
  );
  score(bot, from, A.stakes.length * POINTS.blaze + A.acorns.length * POINTS.acorn, 'the survey line');
  await leave(bot, bot.walk(A.exit, 'the exit'), 'the exit');
}
