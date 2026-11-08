// The way through the game, as orders for the bot (kit/starter/bot.ts): the keys a person
// would press, level by level, taking every coin on the way.
import { SCAN } from '../../kit/starter/ids';
import type { Result, StarterBot } from '../../kit/starter/bot';

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

/** Every coin is 10 points and every key 25: a level that should give `n` coins (and `keys` keys) must have. */
function coins(bot: StarterBot, from: number, n: number, what: string, keys = 0): void {
  const got = (bot.sim.ci.score - from - keys * 25) / 10;
  if (got !== n) throw new Error(`${what}: ${got} of ${n} coins`);
}

/** Walks into a door that is still shut, as a person would to see what it does, and checks it did not open. */
async function bump(bot: StarterBot, col: number, what: string): Promise<void> {
  await must(bot, bot.walk(col - 1, `the ${what}`), `to the ${what}`);
  bot.sim.press(SCAN.right);
  const r = await bot.wait(30);
  bot.sim.release(SCAN.right);
  if (r) throw new Error(`bumping the ${what}: ${r}`);
  if (bot.px.x >= col * 20) throw new Error(`the ${what} let the hero through with too few keys`);
  bot.say(`bumped the ${what}, still shut`);
}

/** 1. Take Both Keys: both keys, the coins, then the door; the spare stays in the pocket. */
export async function takeBoth(bot: StarterBot): Promise<void> {
  const score = bot.sim.ci.score;
  await must(bot, bot.walk(11, 'both keys'), 'to the keys');
  await must(bot, bot.walk(13, 'the second key'), 'on past the second key');
  await must(bot, bot.walk(23, 'the gold door'), 'to the door');
  await must(bot, bot.walk(25, 'through the gold door'), 'through the door');
  await must(bot, bot.walk(32, 'the coins'), 'the coins');
  coins(bot, score, 8, 'level 1 before the exit', 2);
  if (bot.sim.ci.meter[20] !== 2) throw new Error(`level 1: expected one spare gold key (counter 2), got ${bot.sim.ci.meter[20]}`);
  await leave(bot, bot.walk(43, 'the exit'), 'the exit');
}

/** 2. The Spare Fits: the spare from level 1 opens the door at once; a new key waits behind it. */
export async function spareFits(bot: StarterBot): Promise<void> {
  const score = bot.sim.ci.score;
  if (bot.sim.ci.meter[20] !== 2) throw new Error(`level 2 started with gold counter ${bot.sim.ci.meter[20]}, not the spare`);
  await must(bot, bot.walk(15, 'the gold door'), 'to the door');
  await must(bot, bot.walk(17, 'through the gold door'), 'through the door');
  await must(bot, bot.walk(21, 'the new key'), 'to the new key');
  await must(bot, bot.walk(26, 'the coins'), 'the coins');
  await must(bot, bot.walk(36, 'the last coins'), 'the last coins');
  coins(bot, score, 10, 'level 2 before the exit', 1);
  await leave(bot, bot.walk(43, 'the exit'), 'the exit');
}

/** 3. Not That Key: bump the green door holding a gold key, climb for the green key, open the green door, then the gold door. */
export async function notThat(bot: StarterBot): Promise<void> {
  const score = bot.sim.ci.score;
  await bump(bot, 24, 'green door');
  await must(bot, bot.walk(16, 'the ladder'), 'back to the ladder');
  await must(bot, bot.walk(15, 'the ladder'), 'onto the ladder');
  await must(bot, bot.climb('up', 2, 'up the ladder'), 'climb');
  await must(bot, bot.walk(22, 'the green key'), 'along the ledge to the green key');
  await must(bot, bot.walk(16, 'the ladder again'), 'back along the ledge');
  await must(bot, bot.walk(15, 'the ladder'), 'onto the ladder');
  await must(bot, bot.climb('down', 8, 'down the ladder'), 'down the ladder');
  await must(bot, bot.walk(23, 'the green door'), 'to the door');
  await must(bot, bot.walk(25, 'through the green door'), 'through the green door');
  await must(bot, bot.walk(33, 'the gold door'), 'to the gold door');
  await must(bot, bot.walk(35, 'through the gold door'), 'through the gold door');
  await must(bot, bot.walk(39, 'the coins'), 'the coins');
  coins(bot, score, 8, 'level 3 before the exit', 1);
  await leave(bot, bot.walk(43, 'the exit'), 'the exit');
}
