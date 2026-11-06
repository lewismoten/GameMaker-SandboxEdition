// The way through the game, as orders for the bot (kit/starter/bot.ts): the keys a person
// would press, level by level, taking every coin on the way. Each sign's lesson is acted out,
// the mistake included, once: level 1 waits for the big one to pop the pips (no throwing), and
// level 2's first star is thrown at the big one and used up. The checks here fail if anything else happens.
import type { Result, StarterBot } from '../../kit/starter/bot';
import { ORIGIN } from '../../kit/starter/map';
import { BIG, BIG_STILL, FIZZLE, MID, PIP, POP_SCORE, STAR } from '../src/monsters';
import { SCAN_ENTER } from '../src/hero';

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

/** Ticks a star lives (monsters.ts STAR_LIFE) and the sparkle after it, so a throw has finished by then. */
const THROW_WATCH = 60;

/** Presses Enter like a person (a tap), then waits for the star to land; true if it was seen to fizzle. */
export async function throwStar(bot: StarterBot, what: string): Promise<boolean> {
  bot.sim.press(SCAN_ENTER);
  await must(bot, bot.wait(3), 'throwing');
  bot.sim.release(SCAN_ENTER);
  let fizzled = false;
  for (let t = 0; t < THROW_WATCH; t += 2) {
    await must(bot, bot.wait(2), 'watching the star');
    if (alive(bot, FIZZLE)) fizzled = true;
  }
  bot.say(`threw a star ${what}, score ${bot.sim.ci.score}`);
  return fizzled;
}

/** Every coin is 10 points and every pop 50: a level that should give `n` coins (and how many `pops`) must have. */
function coins(bot: StarterBot, from: number, n: number, what: string, pops: number): void {
  const got = (bot.sim.ci.score - from - pops * POP_SCORE) / 10;
  if (got !== n) {
    const left: string[] = [];
    const coin = bot.sim.w.bg.findIndex((b) => b.scorePts === 10);
    for (let y = 0; y < 100; y++) for (let x = 0; x < 100; x++) if (bot.sim.w.map[y * 100 + x] === coin) left.push(`${x - ORIGIN},${y - ORIGIN}`);
    throw new Error(`${what}: ${got} of ${n} coins; left at ${left.join(' ')}`);
  }
}

/** 1. The Big One: read the signs, wait for the big one to pop both pips (Kit throws nothing), then walk through. */
export async function theBigOne(bot: StarterBot): Promise<void> {
  const score = bot.sim.ci.score;
  await must(bot, bot.walk(16, 'the second sign'), 'to the second sign');
  if (alive(bot, PIP) !== 2) throw new Error(`level 1: expected 2 pips when Kit arrives; ${alive(bot, PIP)}`);
  // wait like a person: a look every half second until the way is clear
  for (let i = 0; i < 40 && alive(bot, PIP) > 0; i++) await must(bot, bot.wait(30), 'waiting for the big one');
  if (alive(bot, PIP) !== 0) throw new Error('level 1: the big one never popped the pips');
  if (alive(bot, BIG) !== 1) throw new Error('level 1: the big one should have survived');
  if (alive(bot, STAR)) throw new Error('level 1: nobody threw a star');
  bot.say('the big one popped both pips');
  await must(bot, bot.wait(40), 'letting the sparkles fade');
  await must(bot, bot.walk(36, 'through the tunnel'), 'through the tunnel');
  coins(bot, score, 6, 'level 1 before the exit', 0);
  await leave(bot, bot.walk(43, 'the exit'), 'the exit');
}

/** 2. Your Star: a star at the big one is used up; step past it, and one star pops the pip and one the mid. */
export async function yourStar(bot: StarterBot): Promise<void> {
  const score = bot.sim.ci.score;
  await must(bot, bot.walk(15, 'the big one'), 'to the second sign');
  // the mistake, once: the big one is stronger than the star, so the star is used up and nothing pops
  let before = { score: bot.sim.ci.score, pips: alive(bot, PIP), mids: alive(bot, MID), big: alive(bot, BIG_STILL) };
  if (!(await throwStar(bot, 'at the big one'))) throw new Error('the star at the big one should fizzle where a player can see it');
  if (alive(bot, PIP) !== before.pips || alive(bot, MID) !== before.mids || alive(bot, BIG_STILL) !== before.big || bot.sim.ci.score !== before.score)
    throw new Error('the star at the big one was meant to be used up and do nothing');
  if (alive(bot, STAR)) throw new Error('a star is still flying');
  // step past the big one (it is friendly), stand close to the tunnel, throw at the pip
  await must(bot, bot.walk(22, 'past the big one'), 'past the big one');
  before = { score: bot.sim.ci.score, pips: alive(bot, PIP), mids: alive(bot, MID), big: alive(bot, BIG_STILL) };
  await throwStar(bot, 'at the pip');
  if (alive(bot, PIP) !== before.pips - 1 || bot.sim.ci.score - before.score !== POP_SCORE) throw new Error('the star should have popped the pip for 50');
  await must(bot, bot.walk(25, 'closer'), 'closer to the mid');
  before = { score: bot.sim.ci.score, pips: alive(bot, PIP), mids: alive(bot, MID), big: alive(bot, BIG_STILL) };
  await throwStar(bot, 'at the mid');
  if (alive(bot, MID) !== before.mids - 1 || bot.sim.ci.score - before.score !== POP_SCORE) throw new Error('the star should have popped the mid for 50');
  if (alive(bot, BIG_STILL) !== 1) throw new Error('the big one should still be standing');
  await must(bot, bot.walk(40, 'through the tunnel'), 'through the tunnel');
  coins(bot, score, 6, 'level 2 before the exit', 2);
  await leave(bot, bot.walk(43, 'the exit'), 'the exit');
}

export { ORIGIN };
