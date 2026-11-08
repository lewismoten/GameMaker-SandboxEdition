// The way through the game, as orders for the bot (kit/starter/bot.ts): the keys a person would
// press, level by level, taking every coin on the way. It acts out each lesson once, the mistake included:
//   level 1: read the signs, stand still on the sand and watch it ripple and give way, drop into the hole,
//            jump out, then keep walking across without stopping
//   level 2: read the signs, rest on each stone (they never sink), stop on the dark wet sand and see it give
//            way much sooner than dry sand, jump out and hurry to the next stone
// Every tick of a stand is checked: the sand under the hero goes down its chain one link a touch.
import type { Result, StarterBot } from '../../kit/starter/bot';
import { ORIGIN } from '../../kit/starter/map';
import { GROUND_ONE, GROUND_TWO, SAND_ONE, SAND_TWO, STONES, WET_TWO, buildLevels, holeOf, linksOf, type Level } from '../src/levels';

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

/** A person's look at what just happened, in ticks (about a second and a half). */
const LOOK = 28;
/** Every coin is 10 points. */
const COIN = 10;

const { levels } = buildLevels();

/** The name of the block at level cell (x, y) right now. */
function cellName(bot: StarterBot, l: Level, x: number, y: number): string {
  const v = bot.sim.w.map[(ORIGIN + y) * 100 + ORIGIN + x];
  for (const [n, i] of l.book.index) if (i === v) return n;
  return String(v);
}

/**
 * Stands still on sand until it gives way and the hero drops a block, then checks the drop came after about
 * as many ticks as the chain has links still to go (standing touches the block under you once a tick).
 */
async function standAndSink(bot: StarterBot, l: Level, kind: 'sand' | 'wet', col: number, ground: number): Promise<number> {
  const before = cellName(bot, l, col, ground);
  const at = Number(before.split('.')[1]);
  if (!before.startsWith(`${kind}.`) || Number.isNaN(at)) throw new Error(`expected ${kind} under the hero, found ${before}`);
  const y0 = bot.px.y;
  const t0 = bot.sim.ticks;
  for (let i = 0; i < 200 && bot.px.y === y0; i++) await must(bot, bot.wait(1), 'standing on the sand');
  const took = bot.sim.ticks - t0;
  const left = linksOf(kind) - at;
  if (bot.px.y === y0) throw new Error(`the ${kind} never gave way`);
  if (Math.abs(took - left) > 4) throw new Error(`the ${kind} gave way after ${took} ticks; its chain had ${left} links to go`);
  if (cellName(bot, l, col, ground) !== holeOf(kind)) throw new Error(`the ${kind} became ${cellName(bot, l, col, ground)}, not its hole`);
  await must(bot, bot.land(), 'dropping into the hole');
  if (bot.px.y !== (ground - 1) * 20 + 20) throw new Error(`the hole should be one block deep (y ${y0} -> ${bot.px.y})`);
  bot.say(`the ${kind} gave way after ${took} ticks; she is in the hole`);
  return took;
}

/** 1. Don't Stand Still. */
export async function dontStandStill(bot: StarterBot): Promise<void> {
  const l = levels[0];
  const G = GROUND_ONE;
  const score = bot.sim.ci.score;
  const hp = bot.sim.ci.hitpts;
  await must(bot, bot.walk(6, 'the first sign'), 'to the first sign');
  await must(bot, bot.wait(45), 'reading the sign');
  await must(bot, bot.walk(11, 'the second sign'), 'to the second sign');
  await must(bot, bot.wait(45), 'reading the sign');
  // what the first sign says, once: stand still on the sand and it sinks
  const spot = SAND_ONE[0] + 1;
  await must(bot, bot.walk(spot, 'onto the sand'), 'onto the sand');
  await standAndSink(bot, l, 'sand', spot, G);
  await must(bot, bot.wait(LOOK), 'looking at the hole');
  // and what the second says: jump out and keep walking
  await must(bot, bot.jump('right', spot + 2), 'jumping out');
  const y = bot.px.y;
  if (y !== (G - 1) * 20) throw new Error(`she should be back on top of the sand (y ${y})`);
  await must(bot, bot.walk(SAND_ONE[1] + 2, 'across the sand'), 'across the sand');
  for (let x = spot + 1; x <= SAND_ONE[1]; x++) if (cellName(bot, l, x, G).endsWith('.hole')) throw new Error(`walking on, the sand at column ${x} gave way`);
  await must(bot, bot.walk(28, 'the coins'), 'to the coins');
  if (bot.sim.ci.hitpts !== hp) throw new Error('the sand cost hit points');
  if (bot.sim.ci.score - score !== 4 * COIN) throw new Error(`level 1 should give 4 coins, not ${(bot.sim.ci.score - score) / COIN}`);
  await leave(bot, bot.walk(32, 'the exit'), 'the exit');
}

/** 2. Stepping Stones. */
export async function steppingStones(bot: StarterBot): Promise<void> {
  const l = levels[1];
  const G = GROUND_TWO;
  const score = bot.sim.ci.score;
  const hp = bot.sim.ci.hitpts;
  await must(bot, bot.walk(5, 'the first sign'), 'to the first sign');
  await must(bot, bot.wait(45), 'reading the sign');
  await must(bot, bot.walk(10, 'the second sign'), 'to the second sign');
  await must(bot, bot.wait(45), 'reading the sign');
  // rest on the first two stones: they never sink
  for (const s of STONES.slice(0, 2)) {
    await must(bot, bot.walk(s, `the stone at ${s}`), 'to a stone');
    const y = bot.px.y;
    await must(bot, bot.wait(LOOK * 2), 'resting on the stone');
    if (bot.px.y !== y || cellName(bot, l, s, G) !== 'stone') throw new Error(`the stone at ${s} sank`);
    bot.say(`rested on the stone at ${s}`);
  }
  // the mistake, once: stop on the wet sand, and it gives way much sooner than dry sand did
  const spot = WET_TWO[0] + 1;
  await must(bot, bot.walk(spot, 'onto the wet sand'), 'onto the wet sand');
  const took = await standAndSink(bot, l, 'wet', spot, G);
  if (took >= linksOf('sand') - 8) throw new Error(`wet sand should give way sooner than dry (${took} ticks)`);
  await must(bot, bot.wait(LOOK), 'looking at the hole');
  await must(bot, bot.jump('right', spot + 2), 'jumping out');
  // then hurry to the last stone, and on across the dry sand to the door
  await must(bot, bot.walk(STONES[2], 'the last stone'), 'to the last stone');
  await must(bot, bot.wait(LOOK), 'a breath on the stone');
  await must(bot, bot.walk(SAND_TWO[1] + 2, 'off the sand'), 'off the sand');
  if (bot.sim.ci.hitpts !== hp) throw new Error('the sand cost hit points');
  if (bot.sim.ci.score - score !== 3 * COIN) throw new Error(`level 2 should give 3 coins, not ${(bot.sim.ci.score - score) / COIN}`);
  await leave(bot, bot.walk(42, 'the exit'), 'the exit');
}
