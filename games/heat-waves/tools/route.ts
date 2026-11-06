// The way through the game, as orders for the bot (kit/starter/bot.ts): the keys a person
// would press, level by level. Each sign's lesson is acted out once and checked:
//   level 1: Kit reads the left sign while the hills sway. Left of the rock the three rows of hills
//            always show the same picture of their ring (the mistake: they sway together, like jelly);
//            right of it each row is one picture behind the row under it (the wobble climbs). Every
//            hills block turns every SWAY_TICKS ticks and comes round its 6 pictures. Then he walks on.
//   level 2: two puddles (two monsters each) lie on the long road. Kit walks along it; each block of
//            them comes onto the screen as the view runs ahead, then hides before he is near it.
//   level 3: the evening: the hills blocks never change, and Kit walks to the last door.
// The checks here fail if anything else happens.
import type { Result, StarterBot } from '../../kit/starter/bot';
import { ORIGIN } from '../../kit/starter/map';
import { buildLevels } from '../src/levels';
import { MIRAGE } from '../src/monsters';
import { DOOR_COL, GROUND_ROW, HAZE_ROWS, LAG, LONG, LONG_SIGNS, PUDDLES, ROCK_COLS, START, SWAY, SWAY_TICKS } from '../src/view';

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

/** A person stopped at a sign for a moment to read it. */
const READ = 40;
/** A left column and a right column of level 1's hills, either side of the rock. */
const LEFT_COL = 2;
const RIGHT_COL = 10;

const { levels } = buildLevels();
/** Each level's block names by number, to tell which picture of its ring a hills block is on. */
const namesOf = levels.map((l) => new Map([...l.st.book.index].map(([name, n]) => [n, name])));

/** The block shown at a level cell right now: the map holds the block's first look, and the engine's block table (blkmap) holds what it has turned into since. */
export const blockAt = (bot: StarterBot, x: number, y: number): number => bot.sim.w.blkmap[bot.sim.w.map[(y + ORIGIN) * 100 + x + ORIGIN]];

/** Which picture (0 to 5) of its ring the hills block at (x, y) shows, or -1 when it is no ring. */
function frameAt(bot: StarterBot, level: number, x: number, y: number): number {
  const m = /^w\d\d\.(\d)$/.exec(namesOf[level].get(blockAt(bot, x, y)) ?? '');
  return m ? Number(m[1]) : -1;
}

/** The three rows' pictures at column x, top to bottom. */
const column = (bot: StarterBot, level: number, x: number): number[] => HAZE_ROWS.map((y) => frameAt(bot, level, x, y));

/** Watches level 1's hills for `ticks` ticks: the left rows always together, the right ones each a picture behind the row under it. */
async function watchWobble(bot: StarterBot, ticks: number): Promise<string> {
  let changes = 0;
  let last = column(bot, 0, RIGHT_COL)[2];
  const seen = new Set<number>();
  const n = SWAY.length;
  for (let i = 0; i < ticks; i++) {
    await must(bot, bot.wait(1), 'watching the hills');
    const left = column(bot, 0, LEFT_COL);
    const right = column(bot, 0, RIGHT_COL);
    if (left.some((f) => f < 0 || f !== left[0])) throw new Error(`level 1: the left rows should sway together, saw pictures ${left}`);
    if (right[1] !== (right[2] - LAG + n) % n || right[0] !== (right[1] - LAG + n) % n)
      throw new Error(`level 1: each right row should be ${LAG} picture behind the row under it, saw ${right}`);
    if (right[2] !== last) changes++;
    last = right[2];
    seen.add(right[2]);
  }
  const want = ticks / SWAY_TICKS;
  if (Math.abs(changes - want) > 2) throw new Error(`level 1: the hills should change every ${SWAY_TICKS} ticks (about ${want} in ${ticks}), saw ${changes}`);
  if (seen.size !== n) throw new Error(`level 1: the ring should show ${n} pictures, saw ${seen.size}`);
  return `${changes} changes in ${ticks} ticks, ${seen.size} pictures`;
}

/** 1. The Wobble: the same ring, laid two ways. */
export async function theWobble(bot: StarterBot): Promise<void> {
  await must(bot, bot.land(), 'standing on the road');
  await must(bot, bot.wait(READ), 'reading the left sign');
  bot.say(`hills: ${await watchWobble(bot, 72)}`);
  await must(bot, bot.walk(ROCK_COLS[1] + 3, 'the right sign'), 'to the right sign');
  await must(bot, bot.wait(READ), 'reading the right sign');
  await leave(bot, bot.walk(DOOR_COL, 'the exit'), 'the exit');
}

/** The puddle blocks still on the road (not jumped down out of sight), by column. */
function puddles(bot: StarterBot): number[] {
  const w = bot.sim.w;
  const out: number[] = [];
  for (let mm = 0; mm < w.mm.length; mm++) {
    if (w.mm[mm].monnum !== MIRAGE && w.mm[mm].monnum !== MIRAGE + 1) continue;
    const { curx, cury } = w.mi[mm];
    if (cury[0] - ORIGIN <= GROUND_ROW) out.push(curx[0] - ORIGIN);
  }
  return out.sort((a, b) => a - b);
}

/** The level columns the view shows now (its left one and the 15 after it). */
const inView = (bot: StarterBot, x: number): boolean => {
  const left = bot.sim.w.mx - ORIGIN;
  return x >= left && x < left + 16;
};

/** 2. The Mirage: walk the long road; each puddle shows up ahead and hides before Kit gets there. */
export async function theMirage(bot: StarterBot): Promise<void> {
  const all = PUDDLES.flatMap((x) => [x, x + 1]);
  await must(bot, bot.land(), 'standing on the road');
  if (puddles(bot).join() !== all.join()) throw new Error(`level 2: puddles should lie on columns ${all}, saw ${puddles(bot)}`);
  await must(bot, bot.wait(READ), 'reading the first sign');
  const seen = new Set<number>();
  const gone = new Map<number, number>();
  for (let col = START[0] + 1; col <= LONG.door - 2; col++) {
    await must(bot, bot.walk(col), `walking along the road (${col})`);
    const here = puddles(bot);
    for (const x of here) if (inView(bot, x)) seen.add(x);
    for (const x of all) if (!here.includes(x) && !gone.has(x)) gone.set(x, col);
    if (here.some((x) => Math.abs(x - col) < 3)) throw new Error(`level 2: Kit at ${col} is too close to a puddle at ${here}`);
    if (col === LONG_SIGNS.mirage + 1) await must(bot, bot.wait(READ), 'reading the second sign');
  }
  for (const x of all) {
    if (!seen.has(x)) throw new Error(`level 2: the puddle block at ${x} was never on the screen`);
    if (!gone.has(x)) throw new Error(`level 2: the puddle block at ${x} never hid`);
  }
  bot.say(`each puddle block was seen, then hid: ${all.map((x) => `${x} when Kit was at ${gone.get(x)}`).join(', ')}`);
  await leave(bot, bot.walk(LONG.door, 'the exit'), 'the exit');
}

/** 3. Cool Evening: the hills hold still. */
export async function coolEvening(bot: StarterBot): Promise<void> {
  await must(bot, bot.land(), 'standing on the road');
  const at = () => HAZE_ROWS.map((y) => blockAt(bot, RIGHT_COL, y)).join();
  const start = at();
  await must(bot, bot.wait(READ), 'reading the left sign');
  await must(bot, bot.walk(10, 'the right sign'), 'to the right sign');
  await must(bot, bot.wait(READ), 'reading the right sign');
  if (at() !== start) throw new Error('level 3: the hills blocks should not change in the evening');
  await leave(bot, bot.walk(DOOR_COL, 'the exit'), 'the exit');
}
