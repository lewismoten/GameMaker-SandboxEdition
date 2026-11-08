// The way through the game, as orders for the bot (kit/starter/bot.ts): the keys a person would press, level by
// level. It acts out each lesson once, the mistake included:
//   level 1: Kit walks straight into the diagonal wall of cubes (stopped), then goes round it in square steps:
//            up, right, up, right, up, right past its open top end, then down to the gold diamond. The arrows
//            only ever walk straight.
//   level 2: he walks into the stair of towers (stopped), goes round the front of it and on to the exit
//   level 3: each arrow walks a diagonal. He goes straight left by tapping Left then Down, twice; holds Right into the
//            lower right wall (it walks lower right, so he stops); then Up (upper right) to the gold diamond
import type { Result, StarterBot } from '../../kit/starter/bot';
import { SCAN } from '../../kit/starter/ids';
import { DIAGONAL, EXITS, STAIRS, START } from '../src/levels';

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

/** Holds `key` for `ticks` ticks (a tap is a few), then lets go; returns what the game said, if anything. */
async function hold(bot: StarterBot, key: 'left' | 'right' | 'up' | 'down', ticks: number): Promise<Result> {
  bot.sim.press(SCAN[key]);
  let out: Result;
  for (let t = 0; t < ticks && !out; t++) out = await bot.tick();
  bot.sim.release(SCAN[key]);
  return out ?? (await bot.wait(4));
}

/** 3. The Diamond Floor: straight left with two taps in turn, into a wall the wrong way, then the diagonals to the gold diamond. */
export async function diamondFloor(bot: StarterBot): Promise<void> {
  const home = { x: START[0] * 20, y: START[1] * 20 };
  await must(bot, bot.wait(LOOK), 'reading');
  // to go straight left take Left (upper left) and Down (lower left) in turn: across 40, no up or down
  for (let i = 0; i < 2; i++) {
    await must(bot, hold(bot, 'left', 5), 'left tap');
    await must(bot, hold(bot, 'down', 5), 'down tap');
  }
  const p = bot.px;
  if (p.x > home.x - 36 || Math.abs(p.y - home.y) > 6)
    throw new Error(`two taps in turn should go straight left; he went from ${home.x},${home.y} to ${p.x},${p.y}`);
  bot.say(`straight left to ${p.x}, ${p.y}`);
  await must(bot, bot.wait(LOOK), 'looking');
  // the mistake, once: Right is lower right, straight into the lower right wall
  const stop = await bump(bot, 'right', 'into the wall');
  if (stop.y < p.y + 20) throw new Error(`Right should go lower right; he went from ${p.y} to ${stop.y}`);
  bot.say(`Right walked lower right, stopped at ${stop.x}, ${stop.y}`);
  await must(bot, bot.wait(LOOK), 'looking at the wall');
  // Up is upper right: from the wall's foot it runs the length of the room to the gold diamond
  await leave(bot, hold(bot, 'up', 200), 'the gold diamond');
}
