// The way through the game, as orders for the bot (kit/starter/bot.ts): the keys a person would press, level by
// level. It acts out each lesson once, the mistake included:
//   level 1: Space jumps and gravity brings Kit back; he walks into the wall (stopped), jumps over it, hops up
//            to the ledge for its five coins and walks off the end, and gravity pulls him down to the ground
//   level 2: he walks up and down as well as sideways, presses Space (nothing happens), walks into the wall
//            (stopped), walks around it, walks the deck for its five coins and off the end (nothing falls)
import type { Result, StarterBot } from '../../kit/starter/bot';
import { SCAN } from '../../kit/starter/ids';
import { EXIT_X, GROUND, LEDGE_X, PATH_Y, ROUND_Y, WALL_X } from '../src/levels';

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
/** Every coin is 10 points. */
const COIN = 10;

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

function coins(bot: StarterBot, from: number, n: number, what: string): void {
  const got = (bot.sim.ci.score - from) / COIN;
  if (got !== n) throw new Error(`${what}: ${got} of ${n} coins`);
}

/** 1. Gravity On: jump and come back, bump the wall and jump it, climb to the ledge, walk off its end and fall. */
export async function gravityOn(bot: StarterBot): Promise<void> {
  const score = bot.sim.ci.score;
  await must(bot, bot.walk(6, 'the jump sign'), 'to the jump sign');
  // what the JUMP sign teaches, once: Space lifts him, gravity brings him back to where he stood
  const y0 = bot.px.y;
  bot.sim.press(SCAN.space);
  let top = y0;
  for (let t = 0; t < 30; t++) {
    if (t === 2) bot.sim.release(SCAN.space);
    const r = await bot.tick();
    if (r) throw new Error(`jumping: ${r}`);
    top = Math.min(top, bot.px.y);
  }
  await must(bot, bot.land(), 'coming down');
  if (top > y0 - 40) throw new Error(`Space should lift him over two blocks; he rose ${y0 - top} pixels`);
  if (bot.px.y !== y0) throw new Error(`gravity should bring him back to y ${y0}, not ${bot.px.y}`);
  bot.say(`jumped ${y0 - top} pixels and gravity brought him back to the ground at tick ${bot.sim.ticks}`);
  await must(bot, bot.wait(LOOK), 'watching');
  // the WALL sign: walk into it first, and he is stopped
  await must(bot, bot.walk(12, 'the wall sign'), 'to the wall sign');
  const stop = await bump(bot, 'right', 'into the wall');
  if (stop.x > (WALL_X - 1) * 20 + 4) throw new Error(`the wall should stop him at column ${WALL_X - 1}; he reached x ${stop.x}`);
  bot.say(`stopped by the wall at x ${stop.x}`);
  await must(bot, bot.wait(LOOK), 'looking at the wall');
  // ... then jump it
  await must(bot, bot.jump('right', WALL_X + 2), 'over the wall');
  if (bot.px.x < (WALL_X + 1) * 20) throw new Error(`still behind the wall at x ${bot.px.x}`);
  bot.say(`over the wall at x ${bot.px.x}`);
  // up to the ledge, along it for the five coins, and off the end: gravity pulls him down
  await must(bot, bot.walk(LEDGE_X[0] - 2, 'below the ledge'), 'to the ledge');
  await must(bot, bot.jump('right', LEDGE_X[0] + 1), 'up onto the ledge');
  if (bot.px.y >= (GROUND - 1) * 20) throw new Error(`he should be on the ledge, not at y ${bot.px.y}`);
  const onLedge = bot.px.y;
  await must(bot, bot.walk(LEDGE_X[1], 'the end of the ledge'), 'along the ledge');
  coins(bot, score, 5, 'level 1 coins');
  await must(bot, bot.wait(BEAT), 'looking down');
  const fall = bot.walk(LEDGE_X[1] + 3, 'off the ledge');
  await must(bot, fall, 'off the ledge');
  if (bot.px.y <= onLedge) throw new Error(`walking off the ledge should drop him; he is still at y ${bot.px.y}`);
  if (bot.px.y !== (GROUND - 1) * 20) throw new Error(`gravity should land him on the ground (y ${(GROUND - 1) * 20}), not y ${bot.px.y}`);
  bot.say(`fell from y ${onLedge} to the ground at y ${bot.px.y}`);
  await must(bot, bot.wait(LOOK), 'watching');
  await leave(bot, bot.walk(EXIT_X + 1, 'the exit'), 'the exit');
}

/** 2. Gravity Off: walk four ways, Space does nothing, the wall stops him, round it, over the deck and off it, nothing falls. */
export async function gravityOff(bot: StarterBot): Promise<void> {
  const score = bot.sim.ci.score;
  const row = (y: number) => Math.round(y / 20);
  await must(bot, bot.walk(5, 'the first sign'), 'to the first sign');
  // what the FOUR WAYS sign teaches: Down, then Up, as well as sideways
  await must(bot, bot.climb('down', PATH_Y + 2, 'walked down'), 'down');
  await must(bot, bot.wait(BEAT), 'a beat');
  await must(bot, bot.climb('up', PATH_Y, 'walked up'), 'up');
  if (row(bot.px.y) !== PATH_Y) throw new Error(`he should be back on row ${PATH_Y}, not at y ${bot.px.y}`);
  await must(bot, bot.wait(LOOK), 'watching');
  // the SPACE sign: Space does nothing, so he stays where he is
  await must(bot, bot.walk(9, 'the Space sign'), 'to the Space sign');
  const at = bot.px;
  bot.sim.press(SCAN.space);
  await must(bot, bot.wait(2), 'Space');
  bot.sim.release(SCAN.space);
  await must(bot, bot.wait(LOOK), 'watching Space do nothing');
  if (bot.px.x !== at.x || bot.px.y !== at.y) throw new Error(`Space should do nothing; he moved from ${at.x},${at.y} to ${bot.px.x},${bot.px.y}`);
  bot.say('pressed Space: nothing happened');
  // the wall: walk into it (stopped), then down, along and up around it
  await must(bot, bot.walk(WALL_X - 1, 'the wall'), 'to the wall');
  const stop = await bump(bot, 'right', 'into the wall');
  if (stop.x > (WALL_X - 1) * 20 + 4) throw new Error(`the wall should stop him at column ${WALL_X - 1}; he reached x ${stop.x}`);
  bot.say(`stopped by the wall at x ${stop.x}`);
  await must(bot, bot.wait(LOOK), 'looking at the wall');
  await must(bot, bot.climb('down', ROUND_Y, 'down past the wall'), 'down');
  await must(bot, bot.wait(BEAT), 'a beat');
  await must(bot, bot.walk(WALL_X + 1, 'past the wall'), 'along');
  await must(bot, bot.wait(BEAT), 'a beat');
  await must(bot, bot.climb('up', PATH_Y - 1, 'up beside the wall'), 'up');
  if (bot.px.x < WALL_X * 20) throw new Error(`he should be past the wall, at x ${bot.px.x}`);
  // the deck: five coins along row 4 of it, and off the end
  await must(bot, bot.walk(LEDGE_X[0] - 1, 'the deck'), 'to the deck');
  await must(bot, bot.walk(LEDGE_X[1] + 1, 'the end of the deck'), 'along the deck');
  coins(bot, score, 5, 'level 2 coins');
  const y = bot.px.y;
  await must(bot, bot.walk(LEDGE_X[1] + 4, 'off the deck'), 'off the deck');
  await must(bot, bot.wait(LOOK), 'watching nothing fall');
  if (bot.px.y !== y) throw new Error(`nothing should pull him off the deck; y ${y} -> ${bot.px.y}`);
  bot.say('walked off the deck and nothing fell');
  await must(bot, bot.climb('down', PATH_Y, 'back to the path'), 'down');
  await leave(bot, bot.walk(EXIT_X + 1, 'the exit'), 'the exit');
}
