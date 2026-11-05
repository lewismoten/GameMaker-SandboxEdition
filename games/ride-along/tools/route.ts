// The way through the game, as orders for the bot (kit/starter/bot.ts): the keys a person would press, level by
// level. Each sign's lesson is acted out, the mistake included, once: in the rocket the ship is flown straight
// into the first gate of rocks and held there (its push goes on, the rock holds it) until the arrows steer it
// round. The checks here fail if anything else happens. In the flying levels the bot steers with Left and Right
// only, from the path in levels.ts (Up, Down and Space are each tried once, to see what they do).
import { SCAN } from '../../kit/starter/ids';
import type { Result, StarterBot } from '../../kit/starter/bot';
import { BOAT_PATH, LILIES, LOG_GATES, ROCK_GATES, SHIP_PATH, STARS, pathAt } from '../src/levels';
import { BOAT_DRIFT, BOAT_STROKE, SHIP_DRIFT, SHIP_FAST, SHIP_SLOW } from '../src/rideChars';

/** Runs an order; anything but carrying on (a scene change, getting stuck) is an error. */
async function must(bot: StarterBot, r: Promise<Result>, what: string): Promise<void> {
  const out = await r;
  if (out) throw new Error(`${what}: ${out}\n${bot.log.slice(-8).join('\n')}`);
}

/** The last order of a level: it must take the vehicle through the exit (to the next level or the ending). */
async function leave(bot: StarterBot, r: Promise<Result>, what: string): Promise<void> {
  const out = await r;
  if (out !== 'link' && out !== 'end') throw new Error(`${what}: ${out ?? `still here at ${(bot.px.x / 20).toFixed(1)}, ${(bot.px.y / 20).toFixed(1)}`}\n${bot.log.slice(-8).join('\n')}`);
}

/** A person stopped at a sign for a moment to read it. */
const READ = 40;

/** 1. Climb In: on foot, up to the ledge for four coins (Space jumps here), then to the rocket. */
export async function climbIn(bot: StarterBot): Promise<void> {
  await must(bot, bot.walk(9.5, 'the first sign'), 'to the first sign');
  await must(bot, bot.wait(READ), 'reading');
  await must(bot, bot.walk(15, 'the ledge sign'), 'to the ledge sign');
  await must(bot, bot.wait(READ), 'reading');
  const score = bot.sim.ci.score;
  await must(bot, bot.walk(15.5, 'under the ledge'), 'under the ledge');
  await must(bot, bot.jump('right', 17.5), 'jumping to the ledge');
  if (bot.px.y > 6 * 20 + 2) throw new Error(`level 1: Space should jump up to the ledge (y ${bot.px.y})`);
  await must(bot, bot.walk(21.2, 'along the ledge'), 'along the ledge');
  if (bot.sim.ci.score < score + 30) throw new Error(`level 1: expected the ledge's coins, score ${score} to ${bot.sim.ci.score}`);
  await must(bot, bot.walk(24, 'the rocket sign'), 'to the rocket sign');
  await must(bot, bot.wait(READ), 'reading');
  await must(bot, bot.walk(30, 'the last sign'), 'to the last sign');
  await must(bot, bot.wait(READ), 'reading');
  await leave(bot, bot.walk(36, 'the rocket'), 'the rocket');
  if (bot.sim.ci.score !== 40) throw new Error(`level 1: expected the ledge's four coins (40), score ${bot.sim.ci.score}`);
}

/** The vehicle's bottom block row (its top edge in blocks, decimals and all). */
const rowOf = (bot: StarterBot): number => bot.px.y / 20;

/**
 * Steers with Left and Right alone, each tick, to follow `path` (columns by row), until the vehicle's row reaches
 * `toRow` or a scene change. A person eases off the keys within about a quarter block of the line.
 */
async function fly(bot: StarterBot, path: [number, number][], toRow: number): Promise<Result> {
  let dir = 0;
  for (let t = 0; t < 4000 && rowOf(bot) > toRow; t++) {
    const row = rowOf(bot);
    const want = pathAt(path, row - 1.5) * 20; // looks a block and a half ahead, so a rock never holds it for good
    const next = bot.px.x < want - 5 ? 1 : bot.px.x > want + 5 ? -1 : 0;
    if (next !== dir) {
      bot.sim.release(dir > 0 ? SCAN.right : SCAN.left);
      if (next) bot.sim.press(next > 0 ? SCAN.right : SCAN.left);
      dir = next;
    }
    const r = await bot.tick();
    if (r) return (bot.sim.releaseAll(), r);
  }
  bot.sim.releaseAll();
  return undefined;
}

/** Holds `key` for `ticks` and says how many pixels up the vehicle went. */
async function rise(bot: StarterBot, key: number | undefined, ticks: number): Promise<number> {
  const y0 = bot.px.y;
  if (key) bot.sim.press(key);
  await must(bot, bot.wait(ticks), 'holding a key');
  if (key) bot.sim.release(key);
  return y0 - bot.px.y;
}

/** 2. Lift Off: nothing pressed and it rises; Up and Down change how fast; Space does nothing; the first gate stops it; then the gates, the stars and the bay. */
export async function liftOff(bot: StarterBot): Promise<void> {
  let stars = 0;
  const up = await rise(bot, undefined, 30);
  if (Math.abs(up - 30 * SHIP_DRIFT) > 8) throw new Error(`level 2: with no key held the rocket should rise ${30 * SHIP_DRIFT}px in 30 ticks, it rose ${up}`);
  bot.say(`idle: rose ${up}px in 30 ticks`);
  await must(bot, fly(bot, SHIP_PATH, 56), 'to the first sign');
  const space = await rise(bot, SCAN.space, 12);
  if (space > 12 * SHIP_DRIFT + 8) throw new Error(`level 2: Space should do nothing in a rocket, it rose ${space}px in 12 ticks`);
  const fast = await rise(bot, SCAN.up, 12);
  const slow = await rise(bot, SCAN.down, 12);
  if (fast < 12 * SHIP_FAST - 8 || slow > 12 * SHIP_SLOW + 8 || slow < 4) throw new Error(`level 2: Up should rise ~${12 * SHIP_FAST}px and Down ~${12 * SHIP_SLOW}px in 12 ticks; got ${fast} and ${slow}`);
  bot.say(`up ${fast}px, down ${slow}px, space ${space}px in 12 ticks`);
  // the mistake: hold still straight into the first gate of rocks. The push goes on, the rock holds the rocket.
  const gate = ROCK_GATES[0].y;
  await must(bot, fly(bot, SHIP_PATH, 50), 'to the gate');
  const x0 = bot.px.x;
  let still = 0;
  for (let t = 0, last = bot.px.y; t < 400 && still < 25; t++) {
    await must(bot, bot.wait(1), 'into the rocks');
    still = bot.px.y === last ? still + 1 : 0;
    last = bot.px.y;
  }
  await must(bot, bot.wait(30), 'still pushing');
  if (still < 25 || Math.abs(rowOf(bot) - (gate + 2)) > 0.7) throw new Error(`level 2: a rock should hold the rocket at row ${gate + 2} (row ${rowOf(bot).toFixed(1)}, still ${still})`);
  if (Math.abs(bot.px.x - x0) > 8) throw new Error('level 2: the rocket drifted sideways into the rocks');
  bot.say(`held by the rocks at row ${rowOf(bot).toFixed(1)}`);
  // the fix: steer left into the gap and it is away again
  const target = ROCK_GATES[0].gaps[0][0] * 20 + 20;
  bot.sim.press(SCAN.left);
  for (let t = 0; t < 120 && bot.px.x > target; t++) await must(bot, bot.wait(1), 'steering');
  bot.sim.release(SCAN.left);
  const y1 = bot.px.y;
  await must(bot, bot.wait(20), 'rising again');
  if (bot.px.y > y1 - 20) throw new Error('level 2: steered clear of the rock, the rocket should be rising again');
  await leave(bot, fly(bot, SHIP_PATH, 0), 'the bay');
  // every star on the way, except the one or two the mistake flew past on the wrong side of the shaft
  stars = (bot.sim.ci.score - 40) / 10;
  if (stars < STARS.length - 2) throw new Error(`level 2: the bot should catch the stars on its path (${STARS.length - 2} of ${STARS.length} at least), it caught ${stars}`);
  bot.say(`caught ${stars} of ${STARS.length} stars`);
}

/** 3. Down the River: the same in a canoe: slower, and Space is a stroke that goes faster for a moment. */
export async function downTheRiver(bot: StarterBot): Promise<void> {
  const start = bot.sim.ci.score;
  const avg = (BOAT_DRIFT[0] + BOAT_DRIFT[1]) / 2;
  const up = await rise(bot, undefined, 40);
  if (Math.abs(up - 40 * avg) > 8) throw new Error(`level 3: with no key held the canoe should rise ~${40 * avg}px in 40 ticks, it rose ${up}`);
  bot.say(`idle: rose ${up}px in 40 ticks`);
  await must(bot, fly(bot, BOAT_PATH, 52), 'to the paddle sign');
  const stroke = await rise(bot, SCAN.space, 6);
  if (stroke < 6 * BOAT_STROKE - 6) throw new Error(`level 3: a paddle stroke should rise ~${6 * BOAT_STROKE}px, it rose ${stroke}`);
  bot.say(`stroke: rose ${stroke}px in 6 ticks`);
  await must(bot, fly(bot, BOAT_PATH, LOG_GATES[0].y + 1), 'to the logs');
  await leave(bot, fly(bot, BOAT_PATH, 0), 'the dock');
  const lilies = (bot.sim.ci.score - start) / 10;
  if (lilies !== LILIES.length) throw new Error(`level 3: the bot should catch all ${LILIES.length} lilies, it caught ${lilies}`);
  bot.say(`caught ${lilies} lilies`);
}
