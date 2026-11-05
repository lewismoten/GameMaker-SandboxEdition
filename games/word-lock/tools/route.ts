// The way through the game, as orders for the bot (kit/starter/bot.ts): the keys a person
// would press, level by level, taking every coin on the way. Each sign's lesson is shown once,
// including the mistake: in level 2 the exit lock is tried with no words left, because there is no tray.
import { SCAN } from '../../kit/starter/ids';
import type { Result, StarterBot } from '../../kit/starter/bot';
import { WORDS } from '../src/wordBlocks';

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

/** Words carried now (the counter holds one more than it shows). */
const carried = (bot: StarterBot): number => bot.sim.ci.meter[WORDS] - 1;

/** Every coin is 10 points and every word 25: a level that should give `n` coins (and `words` words) must have. */
function coins(bot: StarterBot, from: number, n: number, what: string, words: number): void {
  const got = (bot.sim.ci.score - from - words * 25) / 10;
  if (got !== n) throw new Error(`${what}: ${got} of ${n} coins`);
}

/** Walks into a lock that is still shut, as a person would to see what it does, and checks it did not open or take anything. */
async function bump(bot: StarterBot, col: number, held: number, what: string): Promise<void> {
  await must(bot, bot.walk(col - 1, `the ${what}`), `to the ${what}`);
  bot.sim.press(SCAN.right);
  const r = await bot.wait(30);
  bot.sim.release(SCAN.right);
  if (r) throw new Error(`bumping the ${what}: ${r}`);
  if (bot.px.x >= col * 20) throw new Error(`the ${what} let the hero through with too few words`);
  if (carried(bot) !== held) throw new Error(`the ${what} took words it should not have (${carried(bot)} of ${held})`);
  bot.say(`bumped the ${what} with ${held} words, still shut`);
}

/** 1. Pay to Pass: three words, the first lock takes them, the tray gives them back, the second lock takes them again. */
export async function payToPass(bot: StarterBot): Promise<void> {
  const score = bot.sim.ci.score;
  await must(bot, bot.walk(9, 'the first word'), 'to the first word');
  await must(bot, bot.walk(13, 'the last word'), 'along the words');
  if (carried(bot) !== 3) throw new Error(`expected 3 words, have ${carried(bot)}`);
  await must(bot, bot.walk(20, 'through the first lock'), 'through the first lock');
  if (carried(bot) !== 0) throw new Error(`the first lock should take all 3 (have ${carried(bot)})`);
  await must(bot, bot.walk(22, 'the tray'), 'to the tray');
  if (carried(bot) !== 3) throw new Error(`the tray should give 3 back (have ${carried(bot)})`);
  await must(bot, bot.walk(33, 'the coins'), 'along the coins');
  await must(bot, bot.walk(36, 'through the second lock'), 'through the second lock');
  if (carried(bot) !== 0) throw new Error(`the second lock should take all 3 (have ${carried(bot)})`);
  await must(bot, bot.walk(42, 'the coins'), 'the last coins');
  coins(bot, score, 9, 'level 1 before the exit', 3);
  await leave(bot, bot.walk(45, 'the exit'), 'the exit');
}

/** 2. No Tray: three words, the first lock, a bump at the exit lock with none left, then the ledge's three words and the exit lock. */
export async function noTray(bot: StarterBot): Promise<void> {
  const score = bot.sim.ci.score;
  if (carried(bot) !== 0) throw new Error(`level 2 should start with no words (have ${carried(bot)})`);
  await must(bot, bot.walk(13, 'the words'), 'along the words');
  if (carried(bot) !== 3) throw new Error(`expected 3 words, have ${carried(bot)}`);
  await must(bot, bot.walk(19, 'through the first lock'), 'through the first lock');
  if (carried(bot) !== 0) throw new Error(`the first lock should take all 3 (have ${carried(bot)})`);
  await must(bot, bot.walk(25, 'the coins'), 'along the coins');
  await bump(bot, 44, 0, 'exit lock');
  await must(bot, bot.walk(26, 'the ladder'), 'back to the ladder');
  await must(bot, bot.walk(27, 'the ladder'), 'onto the ladder');
  await must(bot, bot.climb('up', 2, 'up the ladder'), 'climb');
  await must(bot, bot.walk(36, 'the ledge words'), 'along the ledge');
  if (carried(bot) !== 3) throw new Error(`expected 3 words, have ${carried(bot)}`);
  await must(bot, bot.walk(28, 'the ladder'), 'back along the ledge');
  await must(bot, bot.walk(27, 'the ladder'), 'onto the ladder');
  await must(bot, bot.climb('down', 8, 'down the ladder'), 'down the ladder');
  await must(bot, bot.walk(43, 'the coins'), 'the coins');
  coins(bot, score, 7, 'level 2 before the exit', 6);
  await must(bot, bot.walk(43, 'the lock'), 'to the exit lock');
  await leave(bot, bot.walk(45, 'through the lock'), 'the lock that is the exit');
}
