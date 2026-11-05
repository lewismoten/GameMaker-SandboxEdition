// The way through the game, as orders for the bot (kit/starter/bot.ts): the keys a person
// would press, level by level, taking every coin on the way. Each sign's lesson is shown once,
// including the mistake: in level 1 the gate is tried with no bulb lit and stays shut.
import { SCAN } from '../../kit/starter/ids';
import type { Result, StarterBot } from '../../kit/starter/bot';
import { COUNT } from '../src/meterBlocks';

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

/** Bulbs lit now (the counter holds one more than it shows). */
const lit = (bot: StarterBot): number => bot.sim.ci.meter[COUNT] - 1;

/** Every coin is 10 points and a bulb is worth nothing: a level that should give `n` coins must have. */
function coins(bot: StarterBot, from: number, n: number, what: string): void {
  const got = (bot.sim.ci.score - from) / 10;
  if (got !== n) throw new Error(`${what}: ${got} of ${n} coins`);
}

/** Walks into a gate that is still shut, as a person would to see what it does, and checks it did not open or take anything. */
async function bump(bot: StarterBot, col: number, held: number, what: string): Promise<void> {
  await must(bot, bot.walk(col - 1, `the ${what}`), `to the ${what}`);
  bot.sim.press(SCAN.right);
  const r = await bot.wait(30);
  bot.sim.release(SCAN.right);
  if (r) throw new Error(`bumping the ${what}: ${r}`);
  if (bot.px.x >= col * 20) throw new Error(`the ${what} let the hero through with too few bulbs lit`);
  if (lit(bot) !== held) throw new Error(`the ${what} took count it should not have (${lit(bot)} of ${held})`);
  bot.say(`bumped the ${what} with ${held} lit, still shut`);
}

/** 1. Light the Meter: a bump at the gate (nothing lit), up the ladder, along the five bulbs, then the gate. */
export async function lightTheMeter(bot: StarterBot): Promise<void> {
  const score = bot.sim.ci.score;
  if (lit(bot) !== 0) throw new Error(`level 1 should start with nothing lit (have ${lit(bot)})`);
  await bump(bot, 31, 0, 'gate');
  await must(bot, bot.walk(18, 'the ladder'), 'back to the ladder');
  await must(bot, bot.walk(17, 'the ladder'), 'onto the ladder');
  await must(bot, bot.climb('up', 2, 'up the ladder'), 'climb');
  await must(bot, bot.walk(22, 'the bulbs'), 'along the ledge');
  if (lit(bot) < 2 || lit(bot) > 3) throw new Error(`halfway along the meter expected 2 or 3 lit, have ${lit(bot)}`);
  await must(bot, bot.walk(29, 'the end of the meter'), 'along the ledge');
  if (lit(bot) !== 5) throw new Error(`expected 5 lit, have ${lit(bot)}`);
  await must(bot, bot.walk(18, 'the ladder again'), 'back along the ledge');
  await must(bot, bot.walk(17, 'the ladder'), 'onto the ladder');
  await must(bot, bot.climb('down', 8, 'down the ladder'), 'down the ladder');
  await must(bot, bot.walk(30, 'the gate'), 'to the gate');
  await must(bot, bot.walk(32, 'through the gate'), 'through the gate');
  if (lit(bot) !== 0) throw new Error(`the gate should take all 5 (have ${lit(bot)})`);
  await must(bot, bot.walk(36, 'the coins'), 'the coins');
  coins(bot, score, 4, 'level 1 before the exit');
  await leave(bot, bot.walk(43, 'the exit'), 'the exit');
}

/** 2. The Full Meter: three bulbs on the ground, three on the ledge, then the gate that is the door. */
export async function fullMeter(bot: StarterBot): Promise<void> {
  const score = bot.sim.ci.score;
  if (lit(bot) !== 0) throw new Error(`level 2 should start with nothing lit (have ${lit(bot)})`);
  await must(bot, bot.walk(14, 'the ground bulbs'), 'to the ground bulbs');
  if (lit(bot) !== 3) throw new Error(`expected 3 lit, have ${lit(bot)}`);
  await must(bot, bot.walk(22, 'the ladder'), 'to the ladder');
  await must(bot, bot.walk(23, 'the ladder'), 'onto the ladder');
  await must(bot, bot.climb('up', 2, 'up the ladder'), 'climb');
  await must(bot, bot.walk(16, 'the ledge bulbs'), 'along the ledge');
  await must(bot, bot.walk(21, 'the ledge bulbs'), 'along the ledge');
  if (lit(bot) !== 6) throw new Error(`expected 6 lit, have ${lit(bot)}`);
  await must(bot, bot.walk(22, 'the ladder'), 'to the ladder');
  await must(bot, bot.walk(23, 'the ladder'), 'onto the ladder');
  await must(bot, bot.climb('down', 8, 'down the ladder'), 'down the ladder');
  await must(bot, bot.walk(34, 'the coins'), 'the coins');
  coins(bot, score, 6, 'level 2 before the exit');
  await must(bot, bot.walk(40, 'the gate'), 'to the gate');
  await leave(bot, bot.walk(42, 'through the gate'), 'the gate that is the exit');
}
