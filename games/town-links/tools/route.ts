// The way through the game, as orders for the bot (kit/starter/bot.ts): the keys a person would press. It acts out each lesson
// once, the mistake included:
//   world map: the trail to the town block; stepping on it lands him at the town's south gate (not at the town's corner)
//   town: up the main street to the yard gate, which is locked (the mistake: he bumps it), then back out of the south gate:
//         the link lands him on the world map just below the town block (not where he started)
//   world map: the keys; back onto the town block, up to the gate (it opens) and in at the house door
//   house: out of the door again, to land in the yard just below it (not at the town gate), and in; the three coins; out by
//         the far door, which ends the game
import type { Result, StarterBot } from '../../kit/starter/bot';
import { ORIGIN } from '../../kit/starter/map';
import { SCAN, SEQ } from '../../kit/starter/ids';
import {
  HOUSE_COINS,
  HOUSE_LANDING,
  KEY_BLOCK,
  TOWN_BLOCK,
  TOWN_LANDING,
  TOWN_YARD,
  WORLD_BESIDE,
  type Spot,
} from '../src/levels';

type Key = 'left' | 'right' | 'up' | 'down';

async function must(bot: StarterBot, r: Promise<Result>, what: string): Promise<void> {
  const out = await r;
  if (out) throw new Error(`${what}: ${out}\n${bot.log.slice(-8).join('\n')}`);
}

/** An order that must take the hero through a link (to the next area, or to the ending). */
async function through(bot: StarterBot, r: Promise<Result>, what: string): Promise<void> {
  const out = await r;
  if (out !== 'link' && out !== 'end') throw new Error(`${what}: ${out ?? 'no link fired'}\n${bot.log.slice(-8).join('\n')}`);
}

/** A person's look at what just happened, in ticks (about a second and a half). */
const LOOK = 40;
/** A beat between one key and the next. */
const BEAT = 8;
/** Every coin is 10 points. */
const COIN = 10;

/** Which sequence the engine is playing (the hero's sequence for a key: SEQ.up, SEQ.down, and so on). */
const sequenceOf = (bot: StarterBot): number => (bot.sim as unknown as { w: { chr: { cseq: number } } }).w.chr.cseq;
const SEQ_OF: Record<Key, number> = { left: SEQ.left, right: SEQ.right, up: SEQ.up, down: SEQ.down };

/** Holds `key` until the hero stops moving (a wall), then lets go. Returns where he stopped (level pixels). */
async function bump(bot: StarterBot, key: Key, what: string): Promise<{ x: number; y: number }> {
  bot.sim.press(SCAN[key]);
  let still = 0;
  let last = bot.px;
  for (let t = 0; t < 600 && still < 6; t++) {
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

/** Holds `key` for a few ticks and checks the hero is playing that key's walking sequence (his picture faces that way). */
async function face(bot: StarterBot, key: Key): Promise<void> {
  const from = bot.px;
  bot.sim.press(SCAN[key]);
  await must(bot, bot.wait(12), `facing ${key}`);
  const seq = sequenceOf(bot);
  bot.sim.release(SCAN[key]);
  if (seq !== SEQ_OF[key]) throw new Error(`${key} should play sequence ${SEQ_OF[key]}, not ${seq}`);
  const p = bot.px;
  const moved = { left: from.x - p.x, right: p.x - from.x, up: from.y - p.y, down: p.y - from.y }[key];
  if (moved < 10) throw new Error(`${key} should walk him; he moved ${moved} pixels`);
  await must(bot, bot.land(), `stopping after ${key}`);
}

function coins(bot: StarterBot, from: number, n: number, what: string): void {
  const got = (bot.sim.ci.score - from) / COIN;
  if (got !== n) throw new Error(`${what}: ${got} of ${n} coins`);
}

/** After a link: he must be standing on `cell` (his landing cell), in the idle pose. */
function landed(bot: StarterBot, cell: Spot, what: string): void {
  const want = { x: (cell[0] - ORIGIN) * 20, y: (cell[1] - ORIGIN) * 20 };
  const p = bot.px;
  if (p.x !== want.x || p.y !== want.y) throw new Error(`${what}: he should land on (${want.x}, ${want.y}), not at ${p.x}, ${p.y}`);
  if (sequenceOf(bot) !== SEQ.idle) throw new Error(`${what}: he should arrive in the idle pose, not sequence ${sequenceOf(bot)}`);
  bot.say(`${what}: landed on the cell the link names`);
}

const lv = (s: Spot): [number, number] => [s[0] - ORIGIN, s[1] - ORIGIN];

/** From the town gate to the yard gate's foot, down the main street and along the cross street. */
async function toYardGate(bot: StarterBot): Promise<void> {
  await must(bot, bot.climb('up', 14, 'up the main street'), 'main street');
  await must(bot, bot.walk(21, 'along the cross street'), 'cross street');
  await must(bot, bot.climb('up', 11, 'up the path'), 'path to the gate');
}

/** The whole trip: world map, town, back to the world for a key, town, house, out and in, and out by the far door. */
export async function journey(bot: StarterBot): Promise<void> {
  const score = bot.sim.ci.score;
  const [tx, ty] = lv(TOWN_BLOCK);
  const [bx, by] = lv(WORLD_BESIDE);
  const [kx, ky] = lv(KEY_BLOCK);
  // the world map: along the trail, onto the town block
  await must(bot, bot.wait(LOOK), 'looking at the world map');
  await must(bot, bot.walk(tx, 'along the trail'), 'trail');
  await through(bot, bot.climb('up', ty, 'the town block'), 'town block');
  landed(bot, TOWN_LANDING, 'into the town');
  await must(bot, bot.wait(LOOK), 'looking at the town');
  // the town is bigger: to the yard gate, which is locked
  await toYardGate(bot);
  const stop = await bump(bot, 'up', 'into the locked gate');
  if (stop.y !== 11 * 20) throw new Error(`the gate should stop him on row 11; he reached y ${stop.y}`);
  bot.say('stopped by the locked gate');
  await must(bot, bot.wait(LOOK), 'reading the locked sign');
  // out by the south gate: a link that lands him on the world map below the town block
  await must(bot, bot.climb('down', 14, 'back down the path'), 'down');
  await must(bot, bot.walk(17, 'to the main street'), 'west');
  await through(bot, bot.climb('down', 25, 'the south gate'), 'south gate');
  landed(bot, WORLD_BESIDE, 'out to the world');
  await must(bot, bot.wait(LOOK), 'looking at the world again');
  // the key, and back
  await must(bot, bot.walk(kx, 'east along the land'), 'east');
  await must(bot, bot.climb('down', ky, 'down to the key'), 'down');
  if (bot.sim.ci.score - score !== 25) throw new Error(`the key should score 25; score went up by ${bot.sim.ci.score - score}`);
  await must(bot, bot.wait(BEAT), 'a beat');
  await must(bot, bot.climb('up', by, 'back up'), 'up');
  await must(bot, bot.walk(bx, 'back to the trail'), 'west');
  await through(bot, bot.climb('up', ty, 'the town block'), 'town block again');
  landed(bot, TOWN_LANDING, 'into the town again');
  // the gate opens to the key, and the house door is a link
  await toYardGate(bot);
  await must(bot, bot.climb('up', 7, 'through the gate and up the yard'), 'through the gate');
  await through(bot, bot.climb('up', lv(TOWN_YARD)[1] - 1, 'the house door'), 'house door');
  landed(bot, HOUSE_LANDING, 'into the house');
  await must(bot, bot.wait(LOOK), 'looking round the house');
  // out by the door again: he lands in the yard, outside the door he used
  await through(bot, bot.climb('down', 11, 'the door out'), 'house door out');
  landed(bot, TOWN_YARD, 'out of the house');
  await must(bot, bot.wait(LOOK), 'looking at the house from the yard');
  await through(bot, bot.climb('up', lv(TOWN_YARD)[1] - 1, 'the house door again'), 'house door again');
  landed(bot, HOUSE_LANDING, 'in again');
  // the three coins, then the far door
  const [[c1x, c1y], [c2x, c2y], [c3x, c3y]] = HOUSE_COINS.map(lv);
  await must(bot, bot.walk(c1x, 'west to the first coin'), 'west');
  await must(bot, bot.climb('up', c1y, 'the first coin'), 'up');
  await must(bot, bot.climb('down', c3y, 'down'), 'down');
  await must(bot, bot.walk(c3x, 'the third coin'), 'east');
  await must(bot, bot.climb('up', c2y, 'the second coin'), 'up');
  void c2x;
  const got = (bot.sim.ci.score - score - 25) / COIN;
  if (got !== 3) throw new Error(`the house's coins: ${got} of 3`);
  await must(bot, bot.climb('down', 5, 'level with the exit door'), 'down');
  await through(bot, bot.walk(17, 'the exit door'), 'exit door');
}
