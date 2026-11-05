// The way through the game, as orders for the bot (kit/starter/bot.ts): the keys a person would press, level
// by level, taking every coin on the way. Each sign's lesson is acted out, the mistake included, once. Level 1
// walks into the tower and straight through it (a picture is not solid). Level 2 walks past the houses, leans
// on the brick wall (solid in every place it stands) and only then jumps it.
import type { Result, StarterBot } from '../../kit/starter/bot';
import { SCAN } from '../../kit/starter/ids';
import { TOWER_X, VILLAGE_X, WALL_X } from '../src/levels';
import { TOWER } from '../src/pictures';

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

/** Every coin is 10 points: points taken since `from` must be `n` coins. */
function coins(bot: StarterBot, from: number, n: number, what: string): void {
  const got = (bot.sim.ci.score - from) / 10;
  if (got !== n) throw new Error(`${what}: ${got} of ${n} coins`);
}

/** 1. One Big Picture: the sign says a picture is not solid, so Kit walks into the tower and out of its far side without jumping. */
export async function oneBigPicture(bot: StarterBot): Promise<void> {
  const score = bot.sim.ci.score;
  await must(bot, bot.walk(TOWER_X - 2, 'the tower'), 'to the tower');
  // the mistake, once: expecting the tower to be a wall. Held right for a moment he is inside it, not stopped
  bot.sim.press(SCAN.right);
  await must(bot, bot.wait(30), 'into the tower');
  bot.sim.release(SCAN.right);
  const inside = bot.px.x;
  if (inside < (TOWER_X + 1) * 20) throw new Error(`the tower stopped Kit at ${inside / 20}`);
  bot.say('inside the tower picture');
  await must(bot, bot.walk(TOWER_X + TOWER.w + 1, 'the far side of the tower'), 'through the tower');
  const jumped = bot.log.some((l) => l.startsWith('jumped'));
  if (jumped) throw new Error('the bot jumped on the way through the tower');
  await must(bot, bot.walk(26, 'the coins'), 'the coins');
  await must(bot, bot.walk(31, 'the high coins'), 'the high coins');
  await must(bot, bot.jump('right', 32), 'the high coins jump');
  coins(bot, score, 6, 'level 1');
  await leave(bot, bot.walk(42, 'the door'), 'the door');
}

/** 2. Use It Again: past the houses (also scenery, also walked through), then the wall: bump, then jump. */
export async function useItAgain(bot: StarterBot): Promise<void> {
  const score = bot.sim.ci.score;
  await must(bot, bot.walk(VILLAGE_X - 1, 'the village'), 'to the village');
  await must(bot, bot.walk(VILLAGE_X + 3, 'through the houses'), 'through the houses');
  const raised = bot.px.y;
  await must(bot, bot.walk(VILLAGE_X + 10, 'through the houses'), 'through the houses');
  if (bot.px.y !== raised) throw new Error('Kit climbed onto the houses; they are only pictures');
  await must(bot, bot.walk(18, 'the high coins'), 'the high coins');
  await must(bot, bot.jump('right', 21), 'the high coins jump');
  await must(bot, bot.walk(WALL_X - 2, 'the wall'), 'to the wall');
  // the mistake, once: the brick wall is brick everywhere it stands, so walking at it gets nowhere
  const before = bot.px.x;
  bot.sim.press(SCAN.right);
  await must(bot, bot.wait(30), 'leaning on the wall');
  bot.sim.release(SCAN.right);
  if (bot.px.x >= WALL_X * 20 || bot.px.x < before) throw new Error(`the wall did not stop Kit (${bot.px.x / 20})`);
  bot.say('stopped by the wall');
  await must(bot, bot.walk(WALL_X + 2, 'over the wall'), 'over the wall');
  await must(bot, bot.walk(43, 'the coins'), 'the coins');
  coins(bot, score, 6, 'level 2');
  await leave(bot, bot.walk(56, 'the door'), 'the door');
}


