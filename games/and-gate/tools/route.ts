// The way through the game, as orders for the bot (kit/starter/bot.ts): the keys a person
// would press, level by level, taking every coin on the way. Each sign's lesson is acted out
// once: in level 1 Kit turns one dial on and watches the spark die at the other (the mistake),
// then turns the second on and the lamp lights; in level 2 three dials, one up a ladder.
// The checks here fail if anything else happens.
import type { Result, StarterBot } from '../../kit/starter/bot';
import { SCAN } from '../../kit/starter/ids';
import { ORIGIN } from '../../kit/starter/map';
import { LIGHTS } from '../src/gateBlocks';
import { DIAL_OFF, DIAL_ON, FALLING, LAMP, LIGHT, SPARK } from '../src/monsters';

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

/** How many monsters number `n` are alive. */
export function alive(bot: StarterBot, n: number): number {
  return bot.sim.w.mm.filter((m) => m.monnum === n).length;
}

/** The level block columns (left edges, as fractions) of every spark alive. */
export function sparksAt(bot: StarterBot): number[] {
  const out: number[] = [];
  bot.sim.w.mm.forEach((m, i) => {
    if (m.monnum === SPARK) out.push(bot.sim.w.mi[i].curx[0] - ORIGIN + bot.sim.w.mi[i].curx[1] / 20);
  });
  return out;
}

/** Every coin is 10 points: a level that should give `n` coins must have. */
function coins(bot: StarterBot, from: number, n: number, what: string): void {
  const got = (bot.sim.ci.score - from) / 10;
  if (got !== n) {
    const left: string[] = [];
    const coin = bot.sim.w.bg.findIndex((b) => b.scorePts === 10);
    for (let y = 0; y < 100; y++) for (let x = 0; x < 100; x++) if (bot.sim.w.map[y * 100 + x] === coin) left.push(`${x - ORIGIN},${y - ORIGIN}`);
    throw new Error(`${what}: ${got} of ${n} coins; left at ${left.join(' ')}`);
  }
}

/** A person stopped at a sign for a moment to read it. */
const READ = 40;

/** Waits (a tick at a time) until `done()` or `max` ticks pass; says what it was waiting for if it never came. */
async function until(bot: StarterBot, done: () => boolean, max: number, what: string): Promise<void> {
  for (let i = 0; i < max; i++) {
    if (done()) return;
    await must(bot, bot.wait(1), what);
  }
  if (!done()) throw new Error(`${what}: never happened in ${max} ticks`);
}

/** The highest Kit has jumped so far in this run, as the top of his head in level pixels (the lamp's bottom edge is at 40). */
let apexTop = Infinity;

/** Jumps up under the dial hanging above the hero (a hop of Space, held for two ticks), noting how high he got. */
async function bump(bot: StarterBot, what: string): Promise<void> {
  bot.sim.press(SCAN.space);
  await must(bot, bot.wait(2), what);
  bot.sim.release(SCAN.space);
  for (let i = 0; i < 60; i++) {
    await must(bot, bot.wait(1), what);
    apexTop = Math.min(apexTop, bot.px.y - 20);
  }
  await must(bot, bot.land(), what);
  bot.say(`jumped, head at ${apexTop}px`);
  // the lamp has to be out of reach: even his highest jump leaves a block of sky under it
  if (apexTop < 60) throw new Error(`${what}: Kit could reach the lamp (head at ${apexTop}px)`);
}

/** Watches the sparks for as long as it takes one to run out of wire, and returns the furthest one got. */
async function watchSparks(bot: StarterBot, passed: number, max = 900): Promise<number> {
  let furthest = 0;
  let seenPast = false;
  for (let i = 0; i < max; i++) {
    await must(bot, bot.wait(1), 'watching a spark');
    const xs = sparksAt(bot);
    furthest = Math.max(furthest, ...xs, 0);
    if (xs.some((x) => x > passed)) seenPast = true;
    if (seenPast && !xs.some((x) => x > passed)) return furthest;
  }
  throw new Error('no spark ran past the first dial');
}

/** Takes the light at the foot of the post: Kit walks into it; it must have filled the counter. */
async function takeLight(bot: StarterBot, x: number): Promise<void> {
  await until(bot, () => alive(bot, LIGHT) === 1, 900, 'waiting for the light to settle');
  await must(bot, bot.walk(x, 'the light'), 'to the light');
  if (bot.sim.ci.meter[LIGHTS] < 2) throw new Error(`the light did not fill counter ${LIGHTS}: ${bot.sim.ci.meter[LIGHTS]}`);
}

/** 1. Both Together: one dial on and the spark dies at the next; then both on and the lamp lights. */
export async function bothTogether(bot: StarterBot): Promise<void> {
  const score = bot.sim.ci.score;
  await must(bot, bot.wait(20), 'the level starts');
  await must(bot, bot.walk(6, 'the wire sign'), 'to the first sign');
  await must(bot, bot.wait(READ), 'reading');
  await must(bot, bot.walk(11.5, 'the first dial'), 'to the first dial');
  await must(bot, bot.wait(READ), 'reading the dial sign');
  await bump(bot, 'bumping the first dial');
  if (alive(bot, DIAL_ON) !== 1 || alive(bot, DIAL_OFF) !== 1) throw new Error('level 1: one dial should be on and one off');
  // the mistake, once: the spark runs on and dies at the dial that is off
  await must(bot, bot.walk(16.5, 'the second dial'), 'under the second dial');
  const furthest = await watchSparks(bot, 13);
  if (furthest > 17.3) throw new Error(`level 1: a spark got past the dial that is off (${furthest.toFixed(1)})`);
  if (alive(bot, LAMP) !== 1 || alive(bot, FALLING) + alive(bot, LIGHT) !== 0) throw new Error('level 1: the lamp should still be dark');
  bot.say(`One dial on: the spark stopped at ${furthest.toFixed(1)}, the lamp stayed dark`);
  await must(bot, bot.wait(READ), 'reading the sign about both');
  await bump(bot, 'bumping the second dial');
  if (alive(bot, DIAL_OFF) !== 0) throw new Error('level 1: both dials should be on');
  await until(bot, () => alive(bot, LAMP) === 0, 900, 'the spark reaching the lamp');
  bot.say('Both dials on: the lamp is lit');
  await must(bot, bot.walk(21, 'the coins'), 'to the coins');
  await must(bot, bot.walk(24.5, 'under the post'), 'to the post');
  await takeLight(bot, 23);
  await must(bot, bot.walk(26, 'the light sign'), 'to the sign');
  await must(bot, bot.wait(READ), 'reading');
  await must(bot, bot.walk(33, 'the coins'), 'to the coins');
  coins(bot, score, 5, 'level 1 before the gate');
  await leave(bot, bot.walk(36, 'the gate'), 'the gate');
}

/** 2. All Three: three dials, one up a ladder; every one must be on. */
export async function allThree(bot: StarterBot): Promise<void> {
  const score = bot.sim.ci.score;
  await must(bot, bot.wait(20), 'the level starts');
  await must(bot, bot.walk(5, 'the first dial'), 'to the first dial');
  await must(bot, bot.wait(READ), 'reading');
  await bump(bot, 'bumping the first dial');
  await must(bot, bot.walk(9, 'the ladder'), 'to the ladder');
  await must(bot, bot.wait(READ), 'reading the climbing sign');
  await must(bot, bot.climb('up', 2, 'up the ladder'), 'up the ladder');
  await must(bot, bot.walk(16.6, 'along the ledge'), 'along the ledge');
  if (alive(bot, DIAL_ON) !== 2 || alive(bot, DIAL_OFF) !== 1) throw new Error('level 2: two dials should be on, one off');
  await must(bot, bot.walk(20, 'the third dial'), 'to the third dial');
  await must(bot, bot.wait(READ), 'reading the sign about staying on');
  if (alive(bot, LAMP) !== 1) throw new Error('level 2: the lamp should still be dark with a dial off');
  await bump(bot, 'bumping the third dial');
  if (alive(bot, DIAL_OFF) !== 0) throw new Error('level 2: all three dials should be on');
  await until(bot, () => alive(bot, LAMP) === 0, 1500, 'the spark reaching the lamp');
  await must(bot, bot.walk(23.5, 'under the post'), 'to the post');
  await takeLight(bot, 24);
  await must(bot, bot.walk(27, 'the light sign'), 'to the sign');
  await must(bot, bot.wait(READ), 'reading');
  await must(bot, bot.walk(36.5, 'the coins'), 'to the coins');
  coins(bot, score, 8, 'level 2 before the gate');
  await leave(bot, bot.walk(39, 'the gate'), 'the gate');
}

export { ORIGIN };
