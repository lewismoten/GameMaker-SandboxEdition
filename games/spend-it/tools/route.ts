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

/** Money (counter 3) holds one more than the coins carried. */
const money = (bot: StarterBot) => bot.sim.ci.meter[3] - 1;

/** Walks into the stall while there is too little money and checks nothing happened (no coins taken, hero still in front). */
async function bump(bot: StarterBot, col: number, what: string): Promise<void> {
  const before = money(bot);
  await must(bot, bot.walk(col - 1, `the ${what}`), `to the ${what}`);
  bot.sim.press(SCAN.right);
  const r = await bot.wait(30);
  bot.sim.release(SCAN.right);
  if (r) throw new Error(`bumping the ${what}: ${r}`);
  if (bot.px.x >= col * 20) throw new Error(`the ${what} let the hero through with too little money`);
  if (money(bot) !== before) throw new Error(`the ${what} took money it should not have`);
  bot.say(`bumped the ${what}: nothing happened`);
}

/** Pays at the stall: walks in, and checks the price came off and the key is in hand. */
async function pay(bot: StarterBot, col: number, price: number, what: string): Promise<void> {
  const before = money(bot);
  await must(bot, bot.walk(col - 1, `the ${what}`), `to the ${what}`);
  await must(bot, bot.walk(col + 2, `through the ${what}`), `through the ${what}`);
  if (money(bot) !== before - price) throw new Error(`${what}: money ${before} became ${money(bot)}, expected ${before - price}`);
}

/** 1. A Key For 3 Coins: two coins, a bump at the stall, the ladder for two more, pay, the door. */
export async function keyFor3(bot: StarterBot): Promise<void> {
  await must(bot, bot.walk(12, 'the first coins'), 'the first coins');
  if (money(bot) !== 2) throw new Error(`level 1: expected 2 coins before the stall, got ${money(bot)}`);
  await bump(bot, 16, 'stall');
  await must(bot, bot.walk(19, 'the ladder'), 'back to the ladder');
  await must(bot, bot.walk(20, 'the ladder'), 'onto the ladder');
  await must(bot, bot.climb('up', 5, 'up the ladder'), 'climb');
  await must(bot, bot.walk(24, 'the coins'), 'along the ledge to the coins');
  if (money(bot) !== 4) throw new Error(`level 1: expected 4 coins, got ${money(bot)}`);
  await must(bot, bot.walk(21, 'the ladder again'), 'back along the ledge');
  await must(bot, bot.walk(20, 'the ladder'), 'onto the ladder');
  await must(bot, bot.climb('down', 8, 'down the ladder'), 'down the ladder');
  await pay(bot, 16, 3, 'stall');
  if (bot.sim.ci.meter[20] !== 2) throw new Error(`level 1: expected one gold key (counter 2), got ${bot.sim.ci.meter[20]}`);
  await must(bot, bot.walk(33, 'the gold door'), 'to the door');
  await must(bot, bot.walk(35, 'through the gold door'), 'through the door');
  await leave(bot, bot.walk(44, 'the exit'), 'the exit');
}

/** 2. Save Up: three coins, the ladder for two more, the stall wants five, the door. */
export async function saveUp(bot: StarterBot): Promise<void> {
  if (money(bot) !== 1) throw new Error(`level 2 started with money ${money(bot)}, not the 1 coin left over`);
  await must(bot, bot.walk(11, 'the coins'), 'the coins');
  await must(bot, bot.walk(13, 'the ladder'), 'to the ladder');
  await must(bot, bot.walk(14, 'the ladder'), 'onto the ladder');
  await must(bot, bot.climb('up', 5, 'up the ladder'), 'climb');
  await must(bot, bot.walk(19, 'the coins'), 'along the ledge to the coins');
  await must(bot, bot.walk(15, 'the ladder again'), 'back along the ledge');
  await must(bot, bot.walk(14, 'the ladder'), 'onto the ladder');
  await must(bot, bot.climb('down', 8, 'down the ladder'), 'down the ladder');
  if (money(bot) !== 6) throw new Error(`level 2: expected 6 money (5 coins and 1 left over), got ${money(bot)}`);
  await pay(bot, 25, 5, 'stall');
  await must(bot, bot.walk(33, 'the gold door'), 'to the door');
  await must(bot, bot.walk(35, 'through the gold door'), 'through the door');
  await leave(bot, bot.walk(44, 'the exit'), 'the exit');
}
