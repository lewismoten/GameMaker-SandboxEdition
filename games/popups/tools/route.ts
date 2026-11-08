// The way through the game, as orders for the bot (kit/starter/bot.ts): the keys a person
// would press, level by level, taking every coin on the way. Each sign's lesson is acted out,
// the mistake included, once: Kit touches a coin whose number never leaves, and walks on. The checks here fail if anything else happens.
import type { Result, StarterBot } from '../../kit/starter/bot';
import { ORIGIN } from '../../kit/starter/map';
import { BOX, COIN, GEM, POP100, POP200, POP500, STUCK, STUCKPOP } from '../src/monsters';

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

/** How many monsters number `n` are alive. */
export function alive(bot: StarterBot, n: number): number {
  return bot.sim.w.mm.filter((m) => m.monnum === n).length;
}

/** A person stopped at a sign for a moment to read it. */
const READ = 40;

/** Waits like a person, a look every half second, until `done()`; throws if it never happens within `max` ticks. */
async function waitUntil(bot: StarterBot, done: () => boolean, what: string, max = 400): Promise<number> {
  let ticks = 0;
  for (; ticks < max && !done(); ticks += 3) await must(bot, bot.wait(3), what);
  if (!done()) throw new Error(`${what}: never happened`);
  return ticks;
}

/** Walks to block `x`, a person's stride, and checks the score went up by exactly `pays` and the number `pop` is on screen. */
async function take(bot: StarterBot, x: number, pop: number, pays: number, what: string): Promise<void> {
  const before = bot.sim.ci.score;
  await must(bot, bot.walk(x, what), what);
  if (bot.sim.ci.score - before !== pays) throw new Error(`${what}: score went up ${bot.sim.ci.score - before}, expected ${pays}`);
  if (alive(bot, pop) < 1) throw new Error(`${what}: the number should be on screen`);
}

/** 1. A Number Appears: two plain coins vanish; each of three coin monsters pays 100 and becomes a number that rises and is gone. */
export async function aNumber(bot: StarterBot): Promise<void> {
  const score = bot.sim.ci.score;
  await must(bot, bot.walk(8, 'the first sign'), 'to the first sign');
  await must(bot, bot.wait(READ), 'reading');
  await must(bot, bot.walk(12, 'the plain coins'), 'the plain coins');
  if (bot.sim.ci.score - score !== 20) throw new Error('level 1: the two plain coins should pay 10 each');
  if (alive(bot, POP100) !== 0) throw new Error('level 1: a plain coin should leave no number');
  await must(bot, bot.walk(15, 'the second sign'), 'to the second sign');
  await must(bot, bot.wait(READ), 'reading');
  if (alive(bot, COIN) !== 3) throw new Error(`level 1: expected three coin monsters; ${alive(bot, COIN)}`);
  await take(bot, 19, POP100, 100, 'the first coin');
  const rise = await waitUntil(bot, () => alive(bot, POP100) === 0, 'the first number rising');
  bot.say(`the number rose and was gone in ${rise} ticks`);
  await take(bot, 22, POP100, 100, 'the second coin');
  await take(bot, 25, POP100, 100, 'the third coin');
  await must(bot, bot.walk(29, 'the third sign'), 'to the third sign');
  await must(bot, bot.wait(READ), 'reading');
  if (alive(bot, COIN) !== 0 || alive(bot, POP100) !== 0) throw new Error('level 1: every coin should be a number by now and every number gone');
  if (bot.sim.ci.score - score !== 320) throw new Error(`level 1: score ${bot.sim.ci.score - score}, expected 320`);
  await leave(bot, bot.walk(43, 'the exit'), 'the exit');
}

/** 2. Its Own Picture: a 200 and a 500; then a coin whose number never leaves, and a coin done right. */
export async function itsOwn(bot: StarterBot): Promise<void> {
  const score = bot.sim.ci.score;
  await must(bot, bot.walk(8, 'the first sign'), 'to the first sign');
  await must(bot, bot.wait(READ), 'reading');
  await take(bot, 12, POP200, 200, 'the gem');
  await take(bot, 15, POP500, 500, 'the box');
  await waitUntil(bot, () => alive(bot, POP200) + alive(bot, POP500) === 0, 'the numbers rising');
  await must(bot, bot.walk(19, 'the fourth sign'), 'to the stuck sign');
  await must(bot, bot.wait(READ), 'reading');
  await take(bot, 25, STUCKPOP, 100, 'the coin that gets stuck');
  await must(bot, bot.wait(200), 'watching it blink');
  if (alive(bot, STUCKPOP) !== 1) throw new Error('level 2: the stuck number should still be there');
  bot.say('the stuck number is still blinking');
  await must(bot, bot.walk(30, 'the fixing sign'), 'to the fixing sign');
  await must(bot, bot.wait(READ), 'reading');
  await take(bot, 34, POP100, 100, 'the last coin');
  await waitUntil(bot, () => alive(bot, POP100) === 0, 'the last number rising');
  if (alive(bot, STUCKPOP) !== 1 || alive(bot, STUCK) + alive(bot, GEM) + alive(bot, BOX) + alive(bot, COIN) !== 0)
    throw new Error('level 2: only the stuck number should be left');
  if (bot.sim.ci.score - score !== 900) throw new Error(`level 2: score ${bot.sim.ci.score - score}, expected 900`);
  await leave(bot, bot.walk(43, 'the exit'), 'the exit');
}

export { ORIGIN };
