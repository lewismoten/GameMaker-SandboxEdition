// The way through the game, as orders for the bot (kit/starter/bot.ts): the keys a person
// would press, level by level, taking every coin on the way. Each sign's lesson is acted out:
// the bot walks into Pip, and into the group, and the checks here fail unless each one opens
// the right talk scene and the hero comes back to the room a few blocks past the friend.
// (There is no mistake to make here: nothing in this game hurts, and a friend always talks.)
import type { Result, StarterBot } from '../../kit/starter/bot';
import { ORIGIN } from '../../kit/starter/map';
import { DOT_X, PIP2_X, PIP_X } from '../src/levels';

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

/**
 * Walks into a friend standing in column `x`, from `from` blocks away: the walk must end in the talk's
 * scene (`talkScene`); then one tick takes the hero back to `levelScene`, `back` blocks past the friend.
 */
async function talkTo(bot: StarterBot, x: number, talkScene: number, levelScene: number, who: string, backAt = x + 3): Promise<void> {
  const out = await bot.walk(x, `${who}`);
  if (out !== 'link') throw new Error(`walking into ${who}: ${out ?? 'nothing happened'}\n${bot.log.slice(-8).join('\n')}`);
  if (bot.sim.scene !== talkScene) throw new Error(`${who}'s talk should be scene ${talkScene}, got ${bot.sim.scene}`);
  bot.say(`${who} talks (scene ${talkScene})`);
  const back = await bot.tick();
  if (back !== 'link' || bot.sim.scene !== levelScene) throw new Error(`${who}'s talk should lead back to scene ${levelScene}: ${back} ${bot.sim.scene}`);
  const at = bot.sim.pos.x - ORIGIN;
  if (at < backAt - 1 || at > backAt + 1) throw new Error(`after ${who}'s talk Kit stands at column ${at}, meant to be near ${backAt}`);
  await must(bot, bot.land(), 'landing after the talk');
  bot.say(`back in the room at column ${at}`);
}

/** 1. Two Voices: along the boards, into Pip (a talk of two), past him to the door. */
export async function twoVoices(bot: StarterBot): Promise<void> {
  const score = bot.sim.ci.score;
  await must(bot, bot.walk(22, 'the boards'), 'along the boards');
  await talkTo(bot, PIP_X, 4, 6, 'Pip');
  await must(bot, bot.walk(38, 'the coins'), 'past Pip');
  coins(bot, score, 9, 'level 1 before the door');
  await leave(bot, bot.walk(43, 'the door'), 'the door');
}

/** 2. A Crowd: into the group (Pip is first), a talk of four across two cards, past all three to the door. */
export async function crowd(bot: StarterBot): Promise<void> {
  const score = bot.sim.ci.score;
  await must(bot, bot.walk(22, 'the boards'), 'along the boards');
  await talkTo(bot, PIP2_X, 5, 7, 'the group', DOT_X + 3);
  await must(bot, bot.walk(41, 'the coins'), 'past the group');
  coins(bot, score, 9, 'level 2 before the door');
  await leave(bot, bot.walk(45, 'the door'), 'the door');
}
