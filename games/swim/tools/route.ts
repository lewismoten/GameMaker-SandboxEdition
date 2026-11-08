// The way through the game, as orders for the bot (kit/starter/bot.ts): the keys a person would press,
// level by level, taking every coin on the way. It acts out each lesson once, the trouble included, and the
// checks here fail unless the water does what its sign says:
//   level 1: step off the bank into the creek and hold Right; the current wins and Kit ends up against the bank he
//            started from, unhurt; then hop the three stones across
//   level 2: drop into the pool; it floats him up to the top row, where he settles; swim across
//   level 3: step into the tall pool at the bottom; it lifts him up and to the left to the ledge, and he walks out
import type { Result, StarterBot } from '../../kit/starter/bot';
import { SCAN } from '../../kit/starter/ids';
import { ORIGIN } from '../../kit/starter/map';
import { L1, L2, L3 } from '../src/levels';

/** Runs an order; anything but carrying on (a scene change, getting stuck) is an error. */
async function must(bot: StarterBot, r: Promise<Result>, what: string): Promise<void> {
  const out = await r;
  if (out) throw new Error(`${what}: ${out}\n${bot.log.slice(-8).join('\n')}`);
}

/** The last order of a level: it must take the hero through the door (to the next level or the ending). */
async function leave(bot: StarterBot, r: Promise<Result>, what: string): Promise<void> {
  const out = await r;
  if (out !== 'link' && out !== 'end') throw new Error(`${what}: ${out ?? 'still here'}\n${bot.log.slice(-8).join('\n')}`);
}

/** Every coin is 10 points: the score a level should have given. */
function score(bot: StarterBot, from: number, want: number, what: string): void {
  const got = bot.sim.ci.score - from;
  if (got !== want) {
    const left: string[] = [];
    const coin = bot.sim.w.bg.findIndex((b) => b.scorePts === 10);
    for (let y = 0; y < 100; y++) for (let x = 0; x < 100; x++) if (bot.sim.w.map[y * 100 + x] === coin) left.push(`${x - ORIGIN},${y - ORIGIN}`);
    throw new Error(`${what}: scored ${got}, expected ${want}; coins left at ${left.join(' ')}`);
  }
  if (got !== want) throw new Error(`${what}: scored ${got}, expected ${want}`);
  bot.say(`${what}: scored ${got}`);
}

/** A person's look at what just happened, in ticks (about a second and a half). */
const LOOK = 40;
const col = (bot: StarterBot) => bot.px.x / 20;
const row = (bot: StarterBot) => bot.px.y / 20;
const hp = (bot: StarterBot) => bot.sim.ci.hitpts;

/** Holds a key until `done()` (or `max` ticks); returns what stopped the hero, if anything. */
async function hold(bot: StarterBot, key: 'left' | 'right', done: () => boolean, max = 300): Promise<Result> {
  bot.sim.press(SCAN[key]);
  for (let t = 0; t < max && !done(); t++) {
    const r = await bot.tick();
    if (r) return (bot.sim.releaseAll(), r);
  }
  bot.sim.release(SCAN[key]);
  return undefined;
}

/** 1. The Creek: fall in and be carried back, then hop the stones. */
export async function theCreek(bot: StarterBot): Promise<void> {
  const from = bot.sim.ci.score;
  const hp0 = hp(bot);
  const [c0] = L1.creek;
  await must(bot, bot.walk(6, 'the water sign'), 'to the first sign');
  await must(bot, bot.wait(LOOK), 'reading the signs');
  await must(bot, bot.walk(c0 - 2, 'the creek bank'), 'to the creek');
  // what the sign teaches, once, on purpose: walk into the creek and keep Right held; the current wins
  await must(
    bot,
    hold(bot, 'right', () => col(bot) >= c0 + 1.2),
    'into the creek',
  );
  await must(bot, bot.wait(LOOK), 'carried by the current');
  if (col(bot) > c0 + 0.5) throw new Error(`the current should carry Kit back to the bank (column ${c0}); he is at ${col(bot).toFixed(1)}`);
  if (row(bot) < L1.ground) throw new Error(`Kit should be down in the creek; he is at row ${row(bot).toFixed(1)}`);
  if (hp(bot) !== hp0) throw new Error('the creek must not hurt');
  bot.say(`the creek carried Kit back to column ${col(bot).toFixed(1)}, unhurt`);
  await must(bot, bot.jump('left', c0 - 2), 'out of the creek');
  // now the way across: hop from stone to stone
  await must(bot, bot.walk(c0 - 1, 'the edge'), 'to the edge');
  for (const stone of L1.stones) {
    await must(bot, bot.jump('right', stone), `onto the stone at ${stone}`);
    bot.say(`stone ${stone}: score ${bot.sim.ci.score - from}`);
    if (Math.abs(col(bot) - stone) > 0.9 || row(bot) > L1.ground - 1)
      throw new Error(`should be standing on the stone at ${stone}; he is at ${col(bot).toFixed(1)}, ${row(bot).toFixed(1)}`);
  }
  await must(bot, bot.jump('right', L1.creek[1] + 2), 'off the last stone');
  await must(bot, bot.walk(L1.coins[L1.coins.length - 1][0] + 1, 'the far coins'), 'to the far coins');
  score(bot, from, 10 * L1.coins.length, 'level 1');
  await leave(bot, bot.walk(L1.exit, 'the exit'), 'the exit');
}

/** 2. The Float: drop into the deep pool, settle at the top and swim across. */
export async function theFloat(bot: StarterBot): Promise<void> {
  const from = bot.sim.ci.score;
  const [p0, p1] = L2.pool;
  await must(bot, bot.walk(6, 'the first sign'), 'to the first sign');
  await must(bot, bot.wait(LOOK), 'reading the sign');
  await must(bot, bot.walk(p0 - 1, 'the edge of the pool'), 'to the pool');
  await must(
    bot,
    hold(bot, 'right', () => col(bot) >= p0 + 1.5),
    'into the pool',
  );
  await must(bot, bot.wait(LOOK), 'floating');
  if (row(bot) > L2.ground + 0.2) throw new Error(`Kit should float at the top row (${L2.ground}); he is at row ${row(bot).toFixed(1)}`);
  bot.say(`Kit floats at row ${row(bot).toFixed(1)}`);
  await must(
    bot,
    hold(bot, 'right', () => col(bot) >= p1 + 1),
    'swimming across',
  );
  await must(bot, bot.jump('right', p1 + 2), 'out onto the bank');
  await must(bot, bot.walk(L2.exit - 1, 'the exit'), 'to the exit');
  score(bot, from, 10 * L2.coins.length, 'level 2');
  await leave(bot, bot.walk(L2.exit, 'the exit'), 'the exit');
}

/** 3. The Lift: step into the tall pool and be lifted up and to the left onto the ledge. */
export async function theLift(bot: StarterBot): Promise<void> {
  const from = bot.sim.ci.score;
  const [p0] = L3.pool;
  await must(bot, bot.walk(L3.start - 3, 'the sign'), 'to the sign');
  await must(bot, bot.wait(LOOK), 'reading the sign');
  await must(bot, bot.walk(p0 + 13, 'the pool'), 'to the pool');
  await must(
    bot,
    hold(bot, 'left', () => row(bot) <= L3.top + 0.5, 300),
    'riding up',
  );
  await must(bot, bot.wait(LOOK), 'at the top');
  bot.say(`score so far ${bot.sim.ci.score - from}; Kit rode up to row ${row(bot).toFixed(1)} at column ${col(bot).toFixed(1)}`);
  await must(
    bot,
    hold(bot, 'left', () => col(bot) <= 6),
    'out onto the ledge',
  );
  await must(bot, bot.walk(L3.exit + 1, 'the door'), 'to the door');
  score(bot, from, 10 * L3.coins.length, 'level 3');
  await leave(bot, bot.walk(L3.exit, 'the exit'), 'the exit');
}
