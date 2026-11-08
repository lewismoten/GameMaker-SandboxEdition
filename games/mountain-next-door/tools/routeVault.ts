// The way through The Records Cellar: the top floor to its end for the lanterns, down the ladder that goes to a dead
// end (its three lanterns and its sign taken, like a person who wants to see), back up, the other ladder to the
// middle floor's way on, down again, and along the bottom floor to the deed (the same human orders as routeHour.ts).
import type { StarterBot } from '../../kit/starter/bot';
import { VAULT_AT, vaultFeet } from '../src/levels/vault';
import { POINTS } from '../src/props';
import { ladder, take } from './route';
import { climbUp, leave, must, readAt, score } from './routeKit';

/** 17. The Records Cellar. */
export async function recordsCellar(bot: StarterBot): Promise<void> {
  const from = bot.sim.ci.score;
  const A = VAULT_AT;
  const lamp = async (xs: readonly number[]) => {
    for (const x of xs) await take(bot, x, POINTS.lantern, `a lantern at ${x}`);
  };
  const [top0, top1, top2] = A.top;
  await readAt(bot, A.signs[0][1] + 1, 'the records sign');
  await lamp([top0, top1, top2]);
  // down the ladder to the dead end, and the three lanterns in it
  await ladder(bot, A.deadLadder, 'down', vaultFeet(1), 'the ladder to the dead end');
  const [p0, p1, p2] = A.pocket;
  await lamp([p0, p1]);
  await readAt(bot, A.signs[2][1] + 1, 'the dead end sign');
  await lamp([p2]);
  await must(bot, bot.wait(30), 'a look at the dead end');
  await climbUp(bot, A.deadLadder, vaultFeet(0), 'the ladder back up');
  // the way on
  await ladder(bot, A.ladder, 'down', vaultFeet(1), 'the ladder to the way on');
  const [m0, m1, m2] = A.mid;
  await lamp([m0, m1]);
  await readAt(bot, A.signs[1][1] + 1, 'the survey files sign');
  await lamp([m2]);
  await ladder(bot, A.down, 'down', vaultFeet(2), 'the ladder to the bottom floor');
  for (const x of A.bottom) await lamp([x]);
  await readAt(bot, A.signs[3][1] + 1, 'the deed sign');
  const want = (A.top.length + A.pocket.length + A.mid.length + A.bottom.length) * POINTS.lantern;
  score(bot, from, want, 'the records cellar');
  await leave(bot, bot.walk(A.exit, 'the exit'), 'the exit');
}
