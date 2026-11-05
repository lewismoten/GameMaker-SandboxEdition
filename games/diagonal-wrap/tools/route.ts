// The way through the game, as orders for the bot (kit/starter/bot.ts): the keys a person would press, level by level.
// The bot holds Down the whole way and taps Left or Right to stay on the road, as a person does; it never reads the
// map, only where the road is (src/course.ts). It acts out each lesson once, the mistake included:
//   level 1: walks into the hedge (stopped), runs down the road past the map's edge and comes in at the top, once
//   level 2: the same road tilted: it wraps three times and crosses the right edge once, and the bot counts the ticks
//            it took: about three times as many as level 1
import type { Result, StarterBot } from '../../kit/starter/bot';
import { SCAN } from '../../kit/starter/ids';
import { MAP, STRAIGHT, TILTED, Y0, leftAt, type Course } from '../src/course';

/** A person's look at what just happened, in ticks (about a second and a half). */
const LOOK = 40;
/** Every coin is 10 points. */
const COIN = 10;

/** What the bot has seen of the run so far: the row it is on (counting every lap), and the wraps it crossed. */
export interface Run {
  /** Pixels run down the course since the entrance's top (u * 20). */
  uPix: number;
  y: number;
  x: number;
  edges: { bottom: number; right: number };
  ticks: number;
}

export function startRun(bot: StarterBot): Run {
  const p = bot.sim.pos;
  return { uPix: (p.y - Y0) * 20 + p.sy, y: p.y * 20 + p.sy, x: p.x * 20 + p.sx, edges: { bottom: 0, right: 0 }, ticks: 0 };
}

/** The shortest signed way from a to b round a map `MAP * 20` pixels around. */
const around = (a: number, b: number): number => ((((b - a) % (MAP * 20)) + MAP * 30) % (MAP * 20)) - MAP * 10;

async function step(bot: StarterBot, run: Run): Promise<Result> {
  const r = await bot.tick();
  if (r) return r;
  const p = bot.sim.pos;
  const y = p.y * 20 + p.sy;
  const x = p.x * 20 + p.sx;
  if (y < run.y - MAP * 10) run.edges.bottom++; // off the bottom, in at the top
  if (x < run.x - MAP * 10) run.edges.right++; // off the right edge, in on the left
  run.uPix += around(run.y, y);
  run.y = y;
  run.x = x;
  run.ticks++;
  return undefined;
}

/** Holds Down, tapping Left and Right to stay in the middle of the road, until row `toU` (counting every lap). */
export async function drive(bot: StarterBot, c: Course, run: Run, toU: number, what: string): Promise<Result> {
  const held = { left: false, right: false };
  const set = (k: 'left' | 'right', on: boolean) => {
    if (held[k] === on) return;
    held[k] = on;
    if (on) bot.sim.press(SCAN[k]);
    else bot.sim.release(SCAN[k]);
  };
  bot.sim.press(SCAN.down);
  for (let t = 0; t < 8000 && run.uPix < toU * 20; t++) {
    const aim = (leftAt(c, Math.floor(run.uPix / 20) + 1) + 2) * 20; // the middle of the road a row ahead
    const d = around(run.x, aim);
    set('right', d > 6 || (held.right && d > 2));
    set('left', d < -6 || (held.left && d < -2));
    const r = await step(bot, run);
    if (r) return (bot.sim.releaseAll(), r);
  }
  bot.sim.releaseAll();
  if (run.uPix < toU * 20) return `drive to row ${toU} (${what}) stopped at ${(run.uPix / 20).toFixed(1)}`;
  bot.say(`at ${what}`);
  return undefined;
}

async function pause(bot: StarterBot, run: Run, ticks: number): Promise<Result> {
  for (let i = 0; i < ticks; i++) {
    const r = await step(bot, run);
    if (r) return r;
  }
  return undefined;
}

async function must(bot: StarterBot, r: Promise<Result>, what: string): Promise<void> {
  const out = await r;
  if (out) throw new Error(`${what}: ${out}\n${bot.log.slice(-8).join('\n')}`);
}

/** The last order of a level: it must take the hero through a door (to the next level or the ending). */
async function leave(bot: StarterBot, r: Promise<Result>, what: string): Promise<void> {
  const out = await r;
  if (out !== 'link' && out !== 'end') throw new Error(`${what}: ${out ?? 'still here'}\n${bot.log.slice(-8).join('\n')}`);
}

/** Walks into the hedge on the left until he stops, and returns where. */
async function bumpHedge(bot: StarterBot, run: Run, c: Course): Promise<void> {
  bot.sim.press(SCAN.left);
  let still = 0;
  let last = run.x;
  for (let t = 0; t < 200 && still < 6; t++) {
    await must(bot, step(bot, run), 'into the hedge');
    still = run.x === last ? still + 1 : 0;
    last = run.x;
  }
  bot.sim.release(SCAN.left);
  const road = leftAt(c, Math.floor(run.uPix / 20));
  if (still < 6 || run.x < road * 20 - 4) throw new Error(`the hedge should stop him at the road's left edge (x ${road * 20}), not at x ${run.x}`);
  bot.say(`stopped by the hedge at x ${run.x}`);
}

/** Ticks level 1 took, which level 2's count is compared with. */
let ticks1 = 0;

/** 1. Straight On: stopped by the hedge, then down the road, over the map's edge and in at the top. */
export async function straightOn(bot: StarterBot): Promise<void> {
  const c = STRAIGHT;
  const score = bot.sim.ci.score;
  const run = startRun(bot);
  await must(bot, pause(bot, run, 20), 'a beat');
  await must(bot, drive(bot, c, run, 2, 'the first sign'), 'to the first sign');
  await bumpHedge(bot, run, c);
  await must(bot, pause(bot, run, LOOK), 'reading');
  await must(bot, drive(bot, c, run, 41, 'the edge sign'), 'to the edge sign');
  await must(bot, pause(bot, run, LOOK), 'reading');
  await must(bot, drive(bot, c, run, 54, 'the sign past the edge'), 'over the edge');
  if (run.edges.bottom !== 1) throw new Error(`he should have crossed the bottom edge once, not ${run.edges.bottom} times`);
  await must(bot, pause(bot, run, LOOK), 'reading');
  await must(bot, drive(bot, c, run, 84, 'the last coin'), 'down the road');
  const got = (bot.sim.ci.score - score) / COIN;
  if (got !== 6) throw new Error(`level 1 coins: ${got} of 6 so far`);
  ticks1 = run.ticks;
  await leave(bot, drive(bot, c, run, 130, 'the doors'), 'the doors');
}

/** 2. Tilted: the same road, three times round the map. */
export async function tilted(bot: StarterBot): Promise<void> {
  const c = TILTED;
  const score = bot.sim.ci.score;
  const run = startRun(bot);
  await must(bot, pause(bot, run, 20), 'a beat');
  await must(bot, drive(bot, c, run, 2, 'the tilt sign'), 'to the tilt sign');
  await must(bot, pause(bot, run, LOOK), 'reading');
  await must(bot, drive(bot, c, run, 37, 'the lap 1 sign'), 'lap 1');
  await must(bot, pause(bot, run, LOOK), 'reading');
  await must(bot, drive(bot, c, run, 139, 'the lap 2 sign'), 'lap 2');
  if (run.edges.bottom !== 1) throw new Error(`one bottom edge so far, not ${run.edges.bottom}`);
  await must(bot, pause(bot, run, LOOK), 'reading');
  await must(bot, drive(bot, c, run, 238, 'the lap 3 sign'), 'lap 3');
  if (run.edges.bottom !== 2) throw new Error(`two bottom edges so far, not ${run.edges.bottom}`);
  await must(bot, pause(bot, run, LOOK), 'reading');
  await must(bot, drive(bot, c, run, 283, 'the last coin'), 'the last stretch');
  if (run.edges.bottom !== 3) throw new Error(`he should have crossed the bottom edge three times, not ${run.edges.bottom}`);
  if (run.edges.right !== 1) throw new Error(`he should have crossed the right edge once, not ${run.edges.right}`);
  await must(bot, pause(bot, run, LOOK), 'reading');
  const got = (bot.sim.ci.score - score) / COIN;
  if (got < 15) throw new Error(`level 2 coins: ${got}`);
  const ratio = run.ticks / ticks1;
  if (ratio < 2.5) throw new Error(`level 2 should take about 3 times as long as level 1: ${run.ticks} ticks against ${ticks1}`);
  bot.say(`level 2 took ${run.ticks} ticks, ${ratio.toFixed(1)} times level 1's ${ticks1}`);
  await leave(bot, drive(bot, c, run, 330, 'the doors'), 'the doors');
}
