// The way through the game, as orders for the bot (kit/starter/bot.ts): the keys a person would press, level by level.
//   level 1 (round corners): along the straights and round the four corners, down to the finish line
//   level 2 (diagonals): up the diagonal in steps (right, up, right, up), along the top, down the other diagonal, to the line
//   level 3 (road and ground): along the road across grass, sand and a bridge; up the crossroads and back, down the T and
//            back; into the water beside the bridge (stopped), and on over the bridge to the finish
// Every block he stops on must be a piece of road (or a triangle beside a diagonal), so the route is the road.
import type { Result, StarterBot } from '../../kit/starter/bot';

import { SCAN, SEQ } from '../../kit/starter/ids';
import { buildLevels, type Spot } from '../src/levels';

type Key = 'left' | 'right' | 'up' | 'down';

const LOOK = 40;
const BEAT = 8;
const levels = buildLevels().levels;

async function must(bot: StarterBot, r: Promise<Result>, what: string): Promise<void> {
  const out = await r;
  if (out) throw new Error(`${what}: ${out}\n${bot.log.slice(-8).join('\n')}`);
}

/** An order that must take the hero through a link (to the next level, or to the ending). */
async function through(bot: StarterBot, r: Promise<Result>, what: string): Promise<void> {
  const out = await r;
  if (out !== 'link' && out !== 'end') throw new Error(`${what}: ${out ?? 'no link fired'}\n${bot.log.slice(-8).join('\n')}`);
}

const sequenceOf = (bot: StarterBot): number => (bot.sim as unknown as { w: { chr: { cseq: number } } }).w.chr.cseq;

/** The level block he is standing on (the block his middle is over). */
const cell = (bot: StarterBot): Spot => [Math.floor((bot.px.x + 10) / 20), Math.floor((bot.px.y + 10) / 20)];

/** He must be standing on a block of road: its name has to be one of these. */
const ROAD = /^(road|corner|bend|diag|tip|cross|tee|bridge|finish)/;
function onRoad(bot: StarterBot, level: number, what: string): void {
  const [x, y] = cell(bot);
  const name = levels[level].map.at(x, y);
  if (!ROAD.test(name)) throw new Error(`${what}: he should be on the road, but block ${x},${y} is ${name}`);
}

/** After a link: he must be on the first block of the level, in the idle pose. */
function landed(bot: StarterBot, level: number): void {
  const [sx, sy] = levels[level].start;
  const p = bot.px;
  if (p.x !== sx * 20 || p.y !== sy * 20) throw new Error(`he should start level ${level + 1} at ${sx * 20}, ${sy * 20}, not ${p.x}, ${p.y}`);
  if (sequenceOf(bot) !== SEQ.idle) throw new Error(`he should arrive in the idle pose, not sequence ${sequenceOf(bot)}`);
  bot.say(`on the first block of level ${level + 1}`);
}

/** Holds `key` until the hero stops moving (a wall, the water), then lets go. */
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

/** Goes to block column `x`, then row `y` (the road's corner), checking he is on road at the end. */
async function along(bot: StarterBot, level: number, x: number, y: number, what: string): Promise<void> {
  const [cx, cy] = cell(bot);
  if (x !== cx) await must(bot, bot.walk(x, what), what);
  if (y > cy) await must(bot, bot.climb('down', y, what), what);
  if (y < cy) await must(bot, bot.climb('up', y, what), what);
  onRoad(bot, level, what);
}

/** Walks a diagonal in steps: across one block, then up or down one, `n` times. */
async function stairs(bot: StarterBot, level: number, n: number, dy: 1 | -1, what: string): Promise<void> {
  for (let i = 0; i < n; i++) {
    const [x, y] = cell(bot);
    await must(bot, bot.walk(x + 1, what), what);
    await must(bot, bot.climb(dy === 1 ? 'down' : 'up', y + dy, what), what);
    onRoad(bot, level, what);
  }
}

/** 1. Round Corners. */
export async function corners(bot: StarterBot): Promise<void> {
  await must(bot, bot.wait(LOOK), 'looking at the first level');
  const L = 0;
  await along(bot, L, 8, 2, 'the first corner');
  bot.say('round the first corner');
  await must(bot, bot.wait(BEAT), 'a beat');
  await along(bot, L, 8, 5, 'down to the second');
  await along(bot, L, 14, 5, 'along to the third');
  await must(bot, bot.wait(BEAT), 'a beat');
  await along(bot, L, 14, 9, 'down to the fourth');
  await along(bot, L, 9, 9, 'back along the road');
  await must(bot, bot.wait(BEAT), 'a beat');
  await through(bot, bot.climb('down', 13, 'the finish line'), 'the finish line');
  landed(bot, 1);
}

/** 2. Diagonals. */
export async function diagonals(bot: StarterBot): Promise<void> {
  await must(bot, bot.wait(LOOK), 'looking at the second level');
  const L = 1;
  await along(bot, L, 5, 10, 'the first bend');
  await must(bot, bot.wait(BEAT), 'a beat');
  await stairs(bot, L, 4, -1, 'up the diagonal');
  await must(bot, bot.wait(LOOK), 'looking down from the top');
  await along(bot, L, 14, 6, 'along the top');
  await stairs(bot, L, 4, 1, 'down the other diagonal');
  await must(bot, bot.wait(BEAT), 'a beat');
  await through(bot, bot.walk(22, 'the finish line'), 'the finish line');
  landed(bot, 2);
}

/** 3. Road and Ground. */
export async function ground(bot: StarterBot): Promise<void> {
  await must(bot, bot.wait(LOOK), 'looking at the third level');
  const L = 2;
  await along(bot, L, 3, 6, 'the crossroads');
  // up the north road and back: a crossroads goes four ways
  await along(bot, L, 3, 2, 'up the crossroads');
  await along(bot, L, 3, 6, 'back to the crossroads');
  await along(bot, L, 7, 6, 'on to the blend block');
  await must(bot, bot.wait(BEAT), 'a beat');
  // the T: south down its branch and back
  await along(bot, L, 11, 6, 'the T');
  await along(bot, L, 11, 10, 'down the T');
  await along(bot, L, 11, 6, 'back to the T');
  // the bridge: the water beside it stops him
  await along(bot, L, 14, 6, 'out on the bridge');
  const stop = await bump(bot, 'down', 'into the water');
  if (stop.y > 6 * 20 + 6) throw new Error(`the water should stop him on the bridge; he reached y ${stop.y}`);
  bot.say(`stopped by the water at y ${stop.y}`);
  await must(bot, bot.wait(LOOK), 'looking at the water');
  await through(bot, bot.walk(19, 'the finish line'), 'the finish line');
}


