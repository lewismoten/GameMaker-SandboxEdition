// The way through the game, as orders for the bot (kit/starter/bot.ts): the keys a person
// would press, level by level, taking every pickup on the way. Each level acts out its lesson once:
// level 1 takes coins and watches the score rise; level 2 takes coins and gems, then walks into the
// rock and pays for it; level 3 takes ten coins and finds the lives unchanged, then a heart adds one.
import type { Result, StarterBot } from '../../kit/starter/bot';
import { GEM_POINTS, ROCK_POINTS } from '../src/pickups';

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

/** The score must be `want` points above `from`. */
function scored(bot: StarterBot, from: number, want: number, what: string): void {
  const got = bot.sim.ci.score - from;
  if (got !== want) throw new Error(`${what}: scored ${got}, wanted ${want}`);
  bot.say(`${what}: score +${got}`);
}

/** Climbs the ladder at column `col` to the ledge's row 2 and walks along the ledge to column `to`. */
async function upAndAlong(bot: StarterBot, col: number, to: number): Promise<void> {
  await must(bot, bot.walk(col, 'the ladder'), 'to the ladder');
  await must(bot, bot.climb('up', 2, 'up the ladder'), 'climb');
  await must(bot, bot.walk(to, 'along the ledge'), 'along the ledge');
}

/** 1. Coins Add Points: six coins on the ground, five along the ledge, 110 in all. */
export async function coinsAddPoints(bot: StarterBot): Promise<void> {
  const score = bot.sim.ci.score;
  await must(bot, bot.walk(16, 'the coins'), 'the ground coins');
  scored(bot, score, 60, 'six coins');
  await upAndAlong(bot, 19, 26);
  scored(bot, score, 110, 'eleven coins');
  await must(bot, bot.walk(30, 'off the ledge'), 'off the ledge');
  await leave(bot, bot.walk(43, 'the exit'), 'the exit');
}

/** 2. Some Are Worth More: four coins, three gems (50 each), the rock (minus 20), three more coins. */
export async function worthMore(bot: StarterBot): Promise<void> {
  const score = bot.sim.ci.score;
  await must(bot, bot.walk(14, 'the coins'), 'the coins');
  scored(bot, score, 40, 'four coins');
  await upAndAlong(bot, 22, 30);
  scored(bot, score, 40 + 3 * GEM_POINTS, 'three gems');
  await must(bot, bot.walk(33, 'off the ledge'), 'off the ledge');
  const before = bot.sim.ci.score;
  await must(bot, bot.walk(40, 'through the rock'), 'through the rock');
  scored(bot, before, ROCK_POINTS, 'the rock');
  await must(bot, bot.walk(45, 'the coins'), 'the last coins');
  scored(bot, score, 40 + 3 * GEM_POINTS + ROCK_POINTS + 30, 'level 2');
  await leave(bot, bot.walk(49, 'the exit'), 'the exit');
}

/** 3. Points Are Not Lives: ten coins leave the lives alone, then the heart adds one. */
export async function heartsAddLives(bot: StarterBot): Promise<void> {
  const score = bot.sim.ci.score;
  const lives = bot.sim.ci.lives;
  await must(bot, bot.walk(20, 'the coins'), 'the coins');
  scored(bot, score, 100, 'ten coins');
  if (bot.sim.ci.lives !== lives) throw new Error(`ten coins changed the lives: ${lives} to ${bot.sim.ci.lives}`);
  bot.say(`still ${lives} lives`);
  await upAndAlong(bot, 27, 32);
  if (bot.sim.ci.lives !== lives + 1) throw new Error(`the heart did not add a life: ${lives} to ${bot.sim.ci.lives}`);
  scored(bot, score, 100, 'the heart (no points)');
  bot.say(`now ${bot.sim.ci.lives} lives`);
  await must(bot, bot.walk(36, 'off the ledge'), 'off the ledge');
  await leave(bot, bot.walk(49, 'the exit'), 'the exit');
}
