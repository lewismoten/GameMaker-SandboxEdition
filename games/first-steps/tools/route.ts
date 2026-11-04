// The way through the game, as orders for the bot (kit/starter/bot.ts): the keys a person
// would press, level by level, taking every coin on the way.
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

/** Every coin is 10 points: a level that should give `coins` must have. */
function coins(bot: StarterBot, from: number, n: number, what: string): void {
  const got = (bot.sim.ci.score - from) / 10;
  if (got !== n) throw new Error(`${what}: ${got} of ${n} coins`);
}

/** 1. Walk, Jump, Fall: along the signs, over the wall, up the step, off the edge and through the door. */
export async function walkJumpFall(bot: StarterBot): Promise<void> {
  const score = bot.sim.ci.score;
  await must(bot, bot.walk(27, 'the coins'), 'walk');
  await must(bot, bot.walk(33, 'the wall'), 'to the wall');
  await must(bot, bot.walk(38, 'over the wall'), 'over the wall');
  await must(bot, bot.walk(47, 'the plateau'), 'up the step');
  await must(bot, bot.walk(51, 'the drop'), 'off the edge');
  coins(bot, score, 14, 'level 1 before the door');
  await leave(bot, bot.walk(56, 'the door'), 'the door');
}

/** 2. Climb and Fall: up the ladder, across the island, down the drops and through the door. */
export async function climbAndFall(bot: StarterBot): Promise<void> {
  const score = bot.sim.ci.score;
  await must(bot, bot.walk(14, 'the ladder'), 'to the ladder');
  await must(bot, bot.climb('up', 7, 'up the ladder'), 'climb');
  await must(bot, bot.walk(29, 'the island'), 'across the island');
  await must(bot, bot.walk(38, 'the low island'), 'down');
  await must(bot, bot.walk(43, 'the ground'), 'down again');
  coins(bot, score, 16, 'level 2 before the door');
  await leave(bot, bot.walk(47, 'the door'), 'the door');
}
