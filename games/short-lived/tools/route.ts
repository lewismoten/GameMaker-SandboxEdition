// The way through the game, as orders for the bot (kit/starter/bot.ts): the keys a person
// would press, level by level, taking every coin on the way. Each sign's lesson is acted out,
// the mistake included, once: Kit walks into the bubble and the sleeper and is held back
// (they are solid), waits, and walks on when the time is up. The checks here fail if anything else happens.
import type { Result, StarterBot } from '../../kit/starter/bot';
import { ORIGIN } from '../../kit/starter/map';
import { BUBBLE_X, SLEEPER_X } from '../src/levels';
import { AWAKE, BUBBLES, SLEEPERS, TWINKLE } from '../src/monsters';

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

/** How many monsters number `n` (or any of the numbers `n`) are alive. */
export function alive(bot: StarterBot, n: number | number[]): number {
  const ns = typeof n === 'number' ? [n] : n;
  return bot.sim.w.mm.filter((m) => ns.includes(m.monnum)).length;
}

/** Every coin is 10 points: a level that should give `n` coins must have. */
function coins(bot: StarterBot, from: number, n: number, what: string): void {
  const got = (bot.sim.ci.score - from) / 10;
  if (got !== n) {
    const left: string[] = [];
    const coin = bot.sim.w.bg.findIndex((b) => b.scorePts === 10);
    for (let y = 0; y < 100; y++) for (let x = 0; x < 100; x++) if (bot.sim.w.map[y * 100 + x] === coin) left.push(`${x - ORIGIN},${y - ORIGIN}`);
    throw new Error(`${what}: ${got} of ${n} coins; left at ${left.join(' ')}`);
  }
}

/** A person stopped at a sign for a moment to read it. */
const READ = 40;

/** Waits like a person, a look every half second, until `gone()`; false if it never happens. */
async function waitUntil(bot: StarterBot, gone: () => boolean, what: string): Promise<void> {
  let ticks = 0;
  for (; ticks < 1200 && !gone(); ticks += 3) await must(bot, bot.wait(3), what);
  if (!gone()) throw new Error(`${what}: never happened`);
  bot.say(`${what}: ${ticks} ticks`);
}

/** 1. A Bubble: read the signs (both in view from the start), walk up to the bubble (it holds Kit back), watch it shrink and pop, then walk through. */
export async function aBubble(bot: StarterBot): Promise<void> {
  const score = bot.sim.ci.score;
  await must(bot, bot.wait(READ), 'reading the first sign');
  await must(bot, bot.walk(8, 'the second sign'), 'to the second sign');
  await must(bot, bot.wait(READ / 2), 'reading');
  await must(bot, bot.walk(BUBBLE_X - 2, 'the bubble'), 'to the bubble');
  if (alive(bot, BUBBLES) !== 1) throw new Error(`level 1: expected the bubble when Kit arrives; ${alive(bot, BUBBLES)}`);
  bot.say(`at the bubble`);
  let sparkle = false;
  await waitUntil(bot, () => ((sparkle ||= alive(bot, TWINKLE) > 0), alive(bot, BUBBLES) === 0), 'waiting for the bubble');
  sparkle ||= alive(bot, TWINKLE) > 0;
  if (!sparkle) throw new Error('level 1: the bubble should leave a sparkle');
  bot.say('the bubble popped by itself');
  await must(bot, bot.wait(20), 'letting the sparkle fade');
  await must(bot, bot.walk(20, 'through the tunnel'), 'through the tunnel');
  coins(bot, score, 6, 'level 1 before the exit');
  await leave(bot, bot.walk(25, 'the exit'), 'the exit');
}

/** 2. Wake Up: the sleeper holds Kit back; it opens its eyes and becomes the awake one, which Kit walks through. */
export async function wakeUp(bot: StarterBot): Promise<void> {
  const score = bot.sim.ci.score;
  await must(bot, bot.wait(READ), 'reading the first sign');
  await must(bot, bot.walk(8, 'the second sign'), 'to the second sign');
  await must(bot, bot.wait(READ / 2), 'reading');
  await must(bot, bot.walk(SLEEPER_X - 2, 'the sleeper'), 'to the sleeper');
  if (alive(bot, SLEEPERS) !== 1 || alive(bot, AWAKE) !== 0) throw new Error('level 2: the sleeper should not be awake yet when Kit arrives');
  await waitUntil(bot, () => alive(bot, SLEEPERS) === 0, 'waiting for the sleeper');
  if (alive(bot, AWAKE) !== 1) throw new Error('level 2: the sleeper should have become the awake one');
  bot.say('the sleeper woke up');
  await must(bot, bot.wait(20), 'a moment');
  await must(bot, bot.walk(22, 'through the tunnel'), 'through the tunnel');
  if (alive(bot, AWAKE) !== 1) throw new Error('level 2: the awake one should still be there');
  coins(bot, score, 6, 'level 2 before the exit');
  await leave(bot, bot.walk(27, 'the exit'), 'the exit');
}

export { ORIGIN };
