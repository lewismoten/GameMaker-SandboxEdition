// The way through the game, as orders for the bot (kit/starter/bot.ts): the keys a person
// would press, level by level, taking every coin on the way. A person watches a monster that
// walks a path and jumps when the gap is right; the bot does the same by trying a jump after
// waiting a little, and taking the first wait that gets across without a hit.
import type { Result, StarterBot } from '../../kit/starter/bot';
import { ORIGIN } from '../../kit/starter/map';

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

/** Every coin is 10 points and every pop 50: a level that should give `n` coins (and how many `pops`) must have. */
function coins(bot: StarterBot, from: number, n: number, what: string, pops = 0): void {
  const got = (bot.sim.ci.score - from - pops * 50) / 10;
  if (got !== n) {
    const left: string[] = [];
    const coin = bot.sim.w.bg.findIndex((b) => b.scorePts === 10);
    for (let y = 0; y < 100; y++) for (let x = 0; x < 100; x++) if (bot.sim.w.map[y * 100 + x] === coin) left.push(`${x - ORIGIN},${y - ORIGIN}`);
    throw new Error(`${what}: ${got} of ${n} coins; left at ${left.join(' ')}`);
  }
}

/**
 * Jumps from where the hero stands, steering right to column `to`, after waiting the fewest
 * ticks (a person watching the monster) that lets him land past it with no hit points lost.
 */
async function hop(bot: StarterBot, to: number, what: string): Promise<void> {
  const hp = bot.sim.ci.hitpts;
  for (let wait = 0; wait <= 240; wait += 4) {
    const saved = bot.snapshot();
    let out = await bot.wait(wait);
    if (!out) out = await bot.jump('right', to);
    if (!out && bot.sim.ci.hitpts === hp && bot.px.x >= to * 20 - 6) return bot.say(`hopped ${what} after ${wait}, score ${bot.sim.ci.score}, x ${bot.px.x}`);
    if (out) throw new Error(`${what}: ${out}`);
    bot.restore(saved);
  }
  throw new Error(`${what}: no way across`);
}

/** The score a level starts from, for the check on its coins. */
const start = (bot: StarterBot) => bot.sim.ci.score;

/** 1. Walk and Hurt: hop over the walking gumdrop and the snail, taking the coins above them. */
export async function walkAndHurt(bot: StarterBot): Promise<void> {
  const score = start(bot);
  await must(bot, bot.walk(10, 'the gumdrop'), 'to the gumdrop');
  await hop(bot, 14, 'the gumdrop');
  await hop(bot, 18, 'past the gumdrop');
  await must(bot, bot.walk(31, 'the snail'), 'to the snail');
  await hop(bot, 35, 'the snail');
  await hop(bot, 38, 'past the snail');
  coins(bot, score, 8, 'level 1 before the exit');
  await leave(bot, bot.walk(43, 'the exit'), 'the exit');
}

/** 2. Pop and Lives: drop onto the mint gumdrops in the first pit, hop the walking one, drop onto the next pair. */
export async function popAndLives(bot: StarterBot): Promise<void> {
  const score = start(bot);
  await must(bot, bot.walk(14, 'the first pit'), 'into the first pit');
  await must(bot, bot.jump('left', 13), 'back onto the other one');
  await must(bot, bot.jump('right', 16), 'out of the first pit');
  await must(bot, bot.walk(24, 'the gumdrop'), 'to the gumdrop');
  await hop(bot, 28, 'the gumdrop');
  await hop(bot, 32, 'past the gumdrop');
  await must(bot, bot.walk(36, 'the second pit'), 'into the second pit');
  await must(bot, bot.jump('left', 35), 'back onto the other one');
  await must(bot, bot.jump('right', 38), 'out of the second pit');
  coins(bot, score, 8, 'level 2 before the exit', 4);
  await leave(bot, bot.walk(43, 'the exit'), 'the exit');
}

export { ORIGIN };
