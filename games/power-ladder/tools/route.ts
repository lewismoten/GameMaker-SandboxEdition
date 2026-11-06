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

/** 1. Small Key, Big Door: the bronze key, a bump at the silver door (shut), the silver key up the ladder, then both doors. */
export async function smallKeyBigDoor(bot: StarterBot): Promise<void> {
  const score = bot.sim.ci.score;
  await must(bot, bot.walk(9, 'the bronze key'), 'to the bronze key');
  await bump(bot, 27, 'silver door');
  await must(bot, bot.walk(15, 'the ladder'), 'back to the ladder');
  await must(bot, bot.walk(14, 'the ladder'), 'onto the ladder');
  await must(bot, bot.climb('up', 2, 'up the ladder'), 'climb');
  await must(bot, bot.walk(21, 'the silver key'), 'along the ledge to the silver key');
  await must(bot, bot.walk(15, 'the ladder again'), 'back along the ledge');
  await must(bot, bot.walk(14, 'the ladder'), 'onto the ladder');
  await must(bot, bot.climb('down', 8, 'down the ladder'), 'down the ladder');
  await must(bot, bot.walk(26, 'the silver door'), 'to the silver door');
  await must(bot, bot.walk(28, 'through the silver door'), 'through the silver door');
  await must(bot, bot.walk(31, 'the coins'), 'the coins');
  await must(bot, bot.walk(36, 'the bronze door'), 'to the bronze door');
  await must(bot, bot.walk(38, 'through the bronze door'), 'through the bronze door (paid with the change)');
  await must(bot, bot.walk(41, 'the coins'), 'the coins');
  coins(bot, score, 9, 'level 1 before the exit', 2);
  await leave(bot, bot.walk(43, 'the exit'), 'the exit');
}

/** 2. One Gold Key: up the ladder for the gold key, then through the bronze door and the silver door. */
export async function oneGoldKey(bot: StarterBot): Promise<void> {
  const score = bot.sim.ci.score;
  await must(bot, bot.walk(9, 'the ladder'), 'to the ladder');
  await must(bot, bot.walk(8, 'the ladder'), 'onto the ladder');
  await must(bot, bot.climb('up', 2, 'up the ladder'), 'climb');
  await must(bot, bot.walk(15, 'the gold key'), 'along the ledge to the gold key');
  await must(bot, bot.walk(9, 'the ladder again'), 'back along the ledge');
  await must(bot, bot.walk(8, 'the ladder'), 'onto the ladder');
  await must(bot, bot.climb('down', 8, 'down the ladder'), 'down the ladder');
  await must(bot, bot.walk(24, 'the bronze door'), 'to the bronze door');
  await must(bot, bot.walk(26, 'through the bronze door'), 'through the bronze door');
  await must(bot, bot.walk(29, 'the coins'), 'the coins');
  await must(bot, bot.walk(34, 'the silver door'), 'to the silver door');
  await must(bot, bot.walk(36, 'through the silver door'), 'through the silver door');
  await must(bot, bot.walk(41, 'the coins'), 'the coins');
  coins(bot, score, 10, 'level 2 before the exit', 1);
  await leave(bot, bot.walk(43, 'the exit'), 'the exit');
}

/** 3. Keys Add Up: the bronze key, a bump at the gold door (shut), the silver key up the ladder, then the door. */
export async function keysAddUp(bot: StarterBot): Promise<void> {
  const score = bot.sim.ci.score;
  await must(bot, bot.walk(9, 'the bronze key'), 'to the bronze key');
  await bump(bot, 30, 'gold door');
  await must(bot, bot.walk(14, 'the ladder'), 'back to the ladder');
  await must(bot, bot.walk(13, 'the ladder'), 'onto the ladder');
  await must(bot, bot.climb('up', 2, 'up the ladder'), 'climb');
  await must(bot, bot.walk(20, 'the silver key'), 'along the ledge to the silver key');
  await must(bot, bot.walk(14, 'the ladder again'), 'back along the ledge');
  await must(bot, bot.walk(13, 'the ladder'), 'onto the ladder');
  await must(bot, bot.climb('down', 8, 'down the ladder'), 'down the ladder');
  await must(bot, bot.walk(29, 'the gold door'), 'to the gold door');
  await must(bot, bot.walk(31, 'through the gold door'), 'through the gold door');
  await must(bot, bot.walk(37, 'the coins'), 'the coins');
  coins(bot, score, 8, 'level 3 before the exit', 2);
  await leave(bot, bot.walk(43, 'the exit'), 'the exit');
}
