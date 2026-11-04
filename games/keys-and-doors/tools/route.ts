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

/** 1. One Key, One Door: bump the shut door, climb for the key, come back and open it. */
export async function oneKey(bot: StarterBot): Promise<void> {
  const score = bot.sim.ci.score;
  await bump(bot, 28, 'locked door');
  await must(bot, bot.walk(20, 'the ladder'), 'back to the ladder');
  await must(bot, bot.walk(19, 'the ladder'), 'onto the ladder');
  await must(bot, bot.climb('up', 2, 'up the ladder'), 'climb');
  await must(bot, bot.walk(26, 'the key'), 'along the ledge to the key');
  await must(bot, bot.walk(20, 'the ladder again'), 'back along the ledge');
  await must(bot, bot.walk(19, 'the ladder'), 'onto the ladder');
  await must(bot, bot.climb('down', 8, 'down the ladder'), 'down the ladder');
  await must(bot, bot.walk(27, 'the locked door'), 'to the door');
  await must(bot, bot.walk(29, 'through the door'), 'through the door');
  await must(bot, bot.walk(37, 'the coins'), 'the coins');
  coins(bot, score, 8, 'level 1 before the exit', 1);
  await leave(bot, bot.walk(43, 'the exit'), 'the exit');
}

/** 2. Two Keys, One Door: one key, a bump (not enough), up the ladder for the second, then the door. */
export async function twoOfAKind(bot: StarterBot): Promise<void> {
  const score = bot.sim.ci.score;
  await must(bot, bot.walk(12, 'the first key'), 'to the first key');
  await bump(bot, 29, 'gold door');
  await must(bot, bot.walk(22, 'the ladder'), 'back to the ladder');
  await must(bot, bot.walk(23, 'the ladder'), 'onto the ladder');
  await must(bot, bot.climb('up', 2, 'up the ladder'), 'climb');
  await must(bot, bot.walk(15, 'the second key'), 'along the ledge to the second key');
  await must(bot, bot.walk(22, 'the ladder again'), 'back along the ledge');
  await must(bot, bot.walk(23, 'the ladder'), 'onto the ladder');
  await must(bot, bot.climb('down', 8, 'down the ladder'), 'down the ladder');
  await must(bot, bot.walk(28, 'the gold door'), 'to the door');
  await must(bot, bot.walk(30, 'through the gold door'), 'through the door');
  await must(bot, bot.walk(38, 'the coins'), 'the coins');
  coins(bot, score, 8, 'level 2 before the exit', 2);
  await leave(bot, bot.walk(43, 'the exit'), 'the exit');
}

/** 3. Two Keys, Two Doors: the gold key and door, up the ladder for the silver key and back, the silver door. */
export async function twoDoors(bot: StarterBot): Promise<void> {
  const score = bot.sim.ci.score;
  await must(bot, bot.walk(10, 'the gold key'), 'to the gold key');
  await must(bot, bot.walk(13, 'the gold door'), 'to the gold door');
  await must(bot, bot.walk(16, 'through the gold door'), 'through the gold door');
  await must(bot, bot.walk(17, 'the ladder'), 'to the ladder');
  await must(bot, bot.climb('up', 2, 'up the ladder'), 'climb');
  await must(bot, bot.walk(8, 'the silver key'), 'back along the ledge');
  await must(bot, bot.walk(16, 'the ladder again'), 'to the ladder again');
  await must(bot, bot.walk(17, 'the ladder'), 'onto the ladder');
  await must(bot, bot.climb('down', 8, 'down the ladder'), 'down the ladder');
  await must(bot, bot.walk(33, 'the silver door'), 'to the silver door');
  await must(bot, bot.walk(35, 'through the silver door'), 'through the silver door');
  await must(bot, bot.walk(42, 'the coins'), 'the coins');
  coins(bot, score, 11, 'level 2 before the exit', 2);
  await leave(bot, bot.walk(45, 'the exit'), 'the exit');
}
