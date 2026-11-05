// The way through the game, as orders for the bot (kit/starter/bot.ts): the keys a person would press, level by level.
// It acts out each lesson once, the mistake included:
//   level 1 (the room): the four arrows walk (and the hero's sequence is the one for that key), Space does nothing,
//            he walks into the table (stopped), goes round it by the rug for its four corner coins, and out by the door
//   level 2 (the roads): north off the meadow's edge into the woods (a link lands him in the middle of it), its three
//            coins, back south into the meadow (links go both ways), east to the pond for three coins and north to the
//            village, into the house's wall (stopped) and then its door, the shop's three coins, out its back door to the
//            village (a door goes back too), in again and out by the shop's exit door
import type { Result, StarterBot } from '../../kit/starter/bot';
import { ORIGIN } from '../../kit/starter/map';
import { SCAN, SEQ } from '../../kit/starter/ids';
import { COINS_ONE, TABLE, area, type Area } from '../src/levels';

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

/** After a link: he must be standing on the middle of `a` (its landing cell), in the idle pose. */
function landed(bot: StarterBot, a: Area, what: string): void {
  const want = { x: (a.landing[0] - ORIGIN) * 20, y: (a.landing[1] - ORIGIN) * 20 };
  const p = bot.px;
  if (p.x !== want.x || p.y !== want.y) throw new Error(`${what}: he should land on ${a.title}'s middle (${want.x}, ${want.y}), not at ${p.x}, ${p.y}`);
  if (sequenceOf(bot) !== SEQ.idle) throw new Error(`${what}: he should arrive in the idle pose, not sequence ${sequenceOf(bot)}`);
  bot.say(`landed in the middle of the ${a.title}`);
}

/** 1. The Room: four arrows, Space does nothing, the table stops him, round it by the rug and out by the door. */
export async function room(bot: StarterBot): Promise<void> {
  const score = bot.sim.ci.score;
  await must(bot, bot.wait(LOOK), 'looking round the room');
  // what the ARROWS sign teaches: each arrow walks him its way, and his sequence (his picture) is that arrow's
  for (const key of ['down', 'right', 'up', 'left'] as Key[]) {
    await face(bot, key);
    await must(bot, bot.wait(BEAT), 'a beat');
  }
  await must(bot, bot.climb('down', 8, ''), 'down to row 8');
  await must(bot, bot.climb('up', 7, ''), 'back to row 7');
  await must(bot, bot.walk(3, 'where he started'), 'back to the start');
  // Space has nothing to do in a room with no gravity
  const at = bot.px;
  bot.sim.press(SCAN.space);
  await must(bot, bot.wait(2), 'Space');
  bot.sim.release(SCAN.space);
  await must(bot, bot.wait(LOOK), 'watching Space do nothing');
  if (bot.px.x !== at.x || bot.px.y !== at.y) throw new Error(`Space should do nothing; he moved from ${at.x},${at.y} to ${bot.px.x},${bot.px.y}`);
  bot.say('pressed Space: nothing happened');
  // the FURNITURE sign: walk into the table, and he is stopped
  const stop = await bump(bot, 'right', 'into the table');
  if (stop.x > (TABLE.x - 1) * 20 + 4) throw new Error(`the table should stop him at column ${TABLE.x - 1}; he reached x ${stop.x}`);
  bot.say(`stopped by the table at x ${stop.x}`);
  await must(bot, bot.wait(LOOK), 'looking at the table');
  // round it: up the near side of the rug, down the far side, the four corner coins on the way
  const [[left, top], , [, bottom], [right]] = [COINS_ONE[0], COINS_ONE[1], COINS_ONE[2], COINS_ONE[3]];
  await must(bot, bot.climb('up', top, 'up beside the table'), 'up');
  await must(bot, bot.walk(left, 'the first coin'), 'left');
  await must(bot, bot.climb('down', bottom, 'down the near side'), 'down');
  await must(bot, bot.walk(right, 'along under the table'), 'along');
  await must(bot, bot.climb('up', top, 'up the far side'), 'up');
  coins(bot, score, 4, "the room's coins");
  await must(bot, bot.wait(BEAT), 'a beat');
  // out by the door in the right-hand wall
  await must(bot, bot.climb('down', 7, 'level with the door'), 'down');
  await must(bot, bot.walk(24, 'the door'), 'to the door');
  await through(bot, bot.walk(25, 'through the door'), 'the door');
  landed(bot, area('meadow'), "the room's door");
}

/** Walks to world column `col` and then row `row` (or the other way round), through links if one fires. */
async function via(bot: StarterBot, first: 'col' | 'row', col: number, row: number, what: string): Promise<Result> {
  const rows = () => bot.climb(row < bot.px.y / 20 ? 'up' : 'down', row, what);
  const cols = () => bot.walk(col, what);
  const [a, b] = first === 'col' ? [cols, rows] : [rows, cols];
  const r = await a();
  if (r) return r;
  return b();
}

/** 2. The Four Roads: off the edge into the next area, both ways, a door in and out, then out of the level. */
export async function roads(bot: StarterBot): Promise<void> {
  const score = bot.sim.ci.score;
  const [meadow, woods, village, pond, shop] = ['meadow', 'woods', 'village', 'pond', 'shop'].map(area);
  await must(bot, bot.wait(LOOK), 'looking at the meadow');
  // north off the meadow's edge: a link lands him in the middle of the woods
  await through(bot, bot.climb('up', meadow.rt + 1, 'the north edge'), 'north edge');
  landed(bot, woods, 'north into the woods');
  await must(bot, bot.wait(LOOK), 'looking at the woods');
  // the woods' three coins, in a row to the west of the road
  await must(bot, bot.climb('down', woods.rt + 7, 'down the road'), 'down');
  await must(bot, bot.walk(woods.rl + 2, 'the last coin'), 'west');
  coins(bot, score, 3, 'the woods coins');
  await must(bot, bot.walk(woods.rl + 8, 'back to the road'), 'east');
  // south off the woods' edge: links go both ways, and he comes back into the middle of the meadow
  await through(bot, bot.climb('down', woods.rt + 9, 'the south edge'), 'south edge');
  landed(bot, meadow, 'south into the meadow');
  await must(bot, bot.wait(LOOK), 'looking at the meadow again');
  // east off the meadow's edge, into the pond
  await through(bot, bot.walk(meadow.rl + 15, 'the east edge'), 'east edge');
  landed(bot, pond, 'east into the pond');
  // the pond's coins along its south shore
  await must(bot, bot.climb('down', pond.rt + 8, 'down to the shore'), 'down');
  await must(bot, bot.walk(pond.rl + 13, 'along the shore'), 'east');
  coins(bot, score, 6, 'the pond coins');
  await must(bot, bot.wait(BEAT), 'a beat');
  await must(bot, bot.walk(pond.rl + 8, 'back to the road'), 'west');
  // north off the pond's edge into the village
  await through(bot, bot.climb('up', pond.rt + 1, 'the north edge'), 'pond north edge');
  landed(bot, village, 'north into the village');
  await must(bot, bot.wait(LOOK), 'looking at the village');
  // the house's wall is solid: walk into it, then go and use its door
  await must(bot, bot.walk(village.rl + 7, 'under the house wall'), 'west');
  const stop = await bump(bot, 'up', 'into the house wall');
  if (stop.y > (village.rt + 3) * 20 + 4) throw new Error(`the wall should stop him below its row; he reached y ${stop.y}`);
  bot.say(`stopped by the house wall at y ${stop.y}`);
  await must(bot, bot.wait(LOOK), 'looking at the house');
  await must(bot, bot.walk(village.rl + 8, 'in front of the door'), 'east');
  await through(bot, bot.climb('up', village.rt + 2, 'the door'), 'the house door');
  landed(bot, shop, 'through the house door');
  // the shop's three coins, then out its back door: a door goes back too
  await must(bot, via(bot, 'row', shop.rl + 3, shop.rt + 6, 'the first coin'), 'first coin');
  await must(bot, bot.climb('down', shop.rt + 7, 'down'), 'down');
  await must(bot, bot.walk(shop.rl + 13, 'the second coin'), 'east');
  await must(bot, bot.climb('up', shop.rt + 2, 'up the east side'), 'up');
  coins(bot, score, 9, 'the shop coins');
  await must(bot, bot.climb('down', shop.rt + 7, 'down'), 'down');
  await must(bot, bot.walk(shop.rl + 8, 'the back door'), 'west');
  await through(bot, bot.climb('down', shop.rt + 9, 'the back door'), 'the back door');
  landed(bot, village, 'back out into the village');
  await must(bot, bot.wait(LOOK), 'looking at the house from outside');
  // in again, and out by the shop's exit door
  await through(bot, bot.climb('up', village.rt + 2, 'the door again'), 'the door again');
  landed(bot, shop, 'in again');
  await through(bot, bot.walk(shop.rl + 15, 'the exit door'), 'the exit door');
}
