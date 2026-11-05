// The way through the game, as orders for the bot (kit/starter/bot.ts): the keys a person would
// press, level by level, along the signs and over every coin to the door. The pictures and the
// cartoon need no keys: they come up by themselves when a level begins or the door is taken,
// and picturesCheck.ts asserts they are on the disk, in the right slots, in the right sizes.
// (There is no mistake to make here: nothing in this game hurts.)
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

/** Every coin is 10 points: a level that should give `n` coins must have. */
function coins(bot: StarterBot, from: number, n: number, what: string): void {
  const got = (bot.sim.ci.score - from) / 10;
  if (got !== n) {
    const left: string[] = [];
    const coin = bot.sim.w.bg.findIndex((b) => b.scorePts === 10);
    for (let y = 0; y < 100; y++) for (let x = 0; x < 100; x++) if (bot.sim.w.map[y * 100 + x] === coin) left.push(`${x - ORIGIN},${y - ORIGIN}`);
    throw new Error(`${what}: ${got} of ${n} coins; left at ${left.join(' ')}`);
  }
}

/** A level: along its four boards, over its nine coins, then the door. */
async function room(bot: StarterBot, name: string): Promise<void> {
  const score = bot.sim.ci.score;
  await must(bot, bot.walk(19, 'the first boards'), `${name}: along the boards`);
  await must(bot, bot.walk(33, 'the coins'), `${name}: on to the last board`);
  coins(bot, score, 9, `${name} before the door`);
  await leave(bot, bot.walk(43, 'the door'), `${name}: the door`);
}

export const aPictureFirst = (bot: StarterBot) => room(bot, 'A Picture First');
export const aCartoonBetween = (bot: StarterBot) => room(bot, 'A Cartoon Between');
export const keepItShort = (bot: StarterBot) => room(bot, 'Keep It Short');
