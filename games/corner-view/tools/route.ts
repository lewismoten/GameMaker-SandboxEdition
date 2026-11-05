// The way through the game, as orders for the bot (kit/starter/bot.ts): the keys a person would press, level by
// level. It acts out each lesson once, the mistake included:
//   level 1: Kit walks straight into the diagonal wall of cubes (stopped), then goes round it in square steps:
//            up, right, up, right, up, right past its open top end, then down to the gold diamond. The arrows
//            only ever walk straight.
//   level 2: he walks into the stair of towers (stopped), goes round the front of it and on to the exit
import type { Result, StarterBot } from '../../kit/starter/bot';
import { SCAN } from '../../kit/starter/ids';
import { DIAGONAL, EXITS, STAIRS } from '../src/levels';

async function must(bot: StarterBot, r: Promise<Result>, what: string): Promise<void> {
  const out = await r;
  if (out) throw new Error(`${what}: ${out}\n${bot.log.slice(-8).join('\n')}`);
}

/** The last order of a level: it must take the hero through the door (to the next level or the ending). */
async function leave(bot: StarterBot, r: Promise<Result>, what: string): Promise<void> {
  const out = await r;
  if (out !== 'link' && out !== 'end') throw new Error(`${what}: ${out ?? 'still here'}\n${bot.log.slice(-8).join('\n')}`);
}

/** A person's look at what just happened, in ticks (about a second and a half). */
const LOOK = 40;
/** A beat between one key and the next. */
const BEAT = 8;

/** Holds `key` until the hero stops moving (a wall), then lets go. Returns where he stopped (level pixels). */
async function bump(bot: StarterBot, key: 'left' | 'right' | 'up' | 'down', what: string): Promise<{ x: number; y: number }> {
  bot.sim.press(SCAN[key]);
  let still = 0;
  let last = bot.px;
  for (let t = 0; t < 400 && still < 6; t++) {
    const r = await bot.tick();
    if (r) throw new Error(`${what}: ${r}`);
    const p = bot.px;
    still = p.x === last.x && p.y === last.y ? still + 1 : 0;
    last = p;
  }
  bot.sim.release(SCAN[key]);
  if (still < 6) throw new Error(`${what}: never stopped`);
  return last;
}

/** 1. The Corner Room: into the wall, then up and right in square steps, round its open top end, and down to the diamond. */
export async function cornerRoom(bot: StarterBot): Promise<void> {
  await must(bot, bot.wait(LOOK), 'reading');
  // the mistake, once: straight at the wall. Its cubes are solid, so he stops in front of the first one on his row
  const wallCol = DIAGONAL[3][0];
  const stop = await bump(bot, 'right', 'into the wall');
  if (stop.x > (wallCol - 1) * 20 + 4) throw new Error(`the cubes should stop him at column ${wallCol - 1}; he reached x ${stop.x}`);
  bot.say(`stopped by the wall at x ${stop.x}`);
  await must(bot, bot.wait(LOOK), 'looking at the wall');
  // round it: a diagonal wall asks for square steps, up one and right one, again and again
  for (const [c, r] of DIAGONAL.slice(3)) {
    await must(bot, bot.climb('up', r - 1, `up beside the cube at ${c}, ${r}`), 'up');
    await must(bot, bot.wait(BEAT), 'a beat');
    await must(bot, bot.walk(c, `over the cube at ${c}, ${r}`), 'right');
    await must(bot, bot.wait(BEAT), 'a beat');
  }
  const endCol = DIAGONAL[DIAGONAL.length - 1][0];
  await must(bot, bot.walk(endCol + 1, 'past the end of the wall'), 'past the end');
  await must(bot, bot.climb('down', EXITS[0][1], 'down the far side'), 'down');
  if (bot.px.x < (endCol + 1) * 20 - 4) throw new Error(`he should be past the wall, at x ${bot.px.x}`);
  await must(bot, bot.wait(LOOK), 'looking at the exit');
  await leave(bot, bot.walk(EXITS[0][0], 'the gold diamond'), 'the exit');
}

/** 2. Stairs of Towers: into the towers (stopped), round their front and on. */
export async function towers(bot: StarterBot): Promise<void> {
  const [leftCol, bottom] = STAIRS[0];
  await must(bot, bot.wait(LOOK), 'reading');
  const peak = STAIRS.reduce((a, t) => (t[2] > a[2] ? t : a));
  const stop = await bump(bot, 'left', 'into the stair');
  if (stop.x < (peak[0] + 1) * 20 - 4) throw new Error(`the stair should stop him at column ${peak[0] + 1}; he reached x ${stop.x}`);
  bot.say(`stopped by the stair at x ${stop.x}`);
  await must(bot, bot.wait(LOOK), 'looking at the stair');
  // down in front of the towers (he is drawn over everything: there is no behind), along, and back up to the gold diamond
  await must(bot, bot.walk(STAIRS[STAIRS.length - 1][0] + 1, 'past the stair'), 'right, past its end');
  await must(bot, bot.climb('down', bottom + 1, 'in front of the towers'), 'down');
  await must(bot, bot.wait(BEAT), 'a beat');
  await must(bot, bot.walk(leftCol - 1, 'past the stair'), 'along the front');
  await must(bot, bot.wait(LOOK), 'looking back');
  await must(bot, bot.climb('up', EXITS[1][1], 'back up to the exit row'), 'up');
  await leave(bot, bot.walk(EXITS[1][0], 'the gold diamond'), 'the exit');
}
