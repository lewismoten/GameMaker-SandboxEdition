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

/** The whole level: six coins on the path, both keys, a bump at the heart stall with nothing left, the ladder's two coins, the heart, the gates, the exit. */
export async function shop(bot: StarterBot): Promise<void> {
  await must(bot, bot.walk(17, 'the street coins'), 'the street coins');
  if (money(bot) !== 6) throw new Error(`expected 6 coins on the path, got ${money(bot)}`);
  await must(bot, bot.walk(29, 'the first stall'), 'into the shop');
  await pay(bot, 30, 3, 'gold key stall');
  await pay(bot, 34, 3, 'silver key stall');
  if (bot.sim.ci.meter[20] !== 2 || bot.sim.ci.meter[21] !== 2) throw new Error('expected a gold and a silver key');
  await bump(bot, 38, 'heart stall');
  await must(bot, bot.walk(19, 'the ladder'), 'back to the ladder');
  await must(bot, bot.walk(18, 'the ladder'), 'onto the ladder');
  await must(bot, bot.climb('up', 5, 'up the ladder'), 'climb');
  await must(bot, bot.walk(22, 'the coins'), 'along the ledge to the coins');
  if (money(bot) !== 2) throw new Error(`expected 2 coins, got ${money(bot)}`);
  await must(bot, bot.walk(19, 'the ladder again'), 'back along the ledge');
  await must(bot, bot.walk(18, 'the ladder'), 'onto the ladder');
  await must(bot, bot.climb('down', 8, 'down the ladder'), 'down the ladder');
  await pay(bot, 38, 2, 'heart stall');
  if (money(bot) !== 0) throw new Error(`expected every coin spent, got ${money(bot)}`);
  if (bot.sim.ci.lives !== 4) throw new Error(`expected a fourth life, got ${bot.sim.ci.lives}`);
  await must(bot, bot.walk(47, 'the silver gate'), 'to the silver gate');
  await must(bot, bot.walk(49, 'through the silver gate'), 'through the silver gate');
  await must(bot, bot.walk(51, 'through the gold gate'), 'through the gold gate');
  await leave(bot, bot.walk(54, 'the exit'), 'the exit');
}
