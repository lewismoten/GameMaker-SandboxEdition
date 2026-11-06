// The way through the game, as orders for the bot (kit/starter/bot.ts): the keys a person would
// press, level by level.
//   level 1: the pictures come up (the sim turns the pages), then the bot reads the first sign,
//            stands under the menu thumbnail, reads the other two and walks into the door
//   level 2: the diagram comes up, then the bot reads the three signs and walks into the last door
// The mistake this game shows is on its pictures: the first level's second menu picture is too busy
// for the game's words to be read.
import type { Result, StarterBot } from '../../kit/starter/bot';
import { DOOR_ONE, DOOR_TWO, SIGNS_ONE, SIGNS_TWO } from '../src/levels';

/** Runs an order; anything but carrying on (a scene change, getting stuck) is an error. */
async function must(bot: StarterBot, r: Promise<Result>, what: string): Promise<void> {
  const out = await r;
  if (out) throw new Error(`${what}: ${out}\n${bot.log.slice(-8).join('\n')}`);
}

/** The last order of a scene: it must take the hero through a link (to another scene or the ending). */
async function leave(bot: StarterBot, r: Promise<Result>, what: string): Promise<void> {
  const out = await r;
  if (out !== 'link' && out !== 'end') throw new Error(`${what}: ${out ?? 'still here'}\n${bot.log.slice(-8).join('\n')}`);
}

/** Reads each sign in turn (walks to the sign's left post and waits), then walks into the door. */
async function readAndLeave(bot: StarterBot, signs: number[], door: number, ticks: number[]): Promise<void> {
  for (let i = 0; i < signs.length; i++) {
    await must(bot, bot.walk(signs[i], `sign ${i + 1}`), `to sign ${i + 1}`);
    await must(bot, bot.wait(ticks[i]), `reading sign ${i + 1}`);
  }
  await leave(bot, bot.walk(door, 'the door'), 'the door');
}

/** 1. A Menu Picture. */
export const aMenuPicture = (bot: StarterBot) => readAndLeave(bot, SIGNS_ONE, DOOR_ONE, [60, 50, 50]);

/** 2. A Demo That Plays Itself. */
export const aDemoThatPlaysItself = (bot: StarterBot) => readAndLeave(bot, SIGNS_TWO, DOOR_TWO, [50, 60, 60]);
