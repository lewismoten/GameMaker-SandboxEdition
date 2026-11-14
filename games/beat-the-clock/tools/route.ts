// The way through the game, as orders for the bot (kit/starter/bot.ts): the keys a person
// would press, level by level, taking every coin on the way. It acts out each lesson once,
// the mistake included:
//   level 1: read the signs and dawdle until the bar is dark and the gate has shut, push on
//            into it and find it solid, walk into the clock door, then run the level in time
//   level 2: reach the gate while it is shut, wait for the bar to fill and the gate to open, go
// The checks here fail if the gate, the lamp or the bar does anything else.
import type { Result, StarterBot } from '../../kit/starter/bot';
import { LOOP_GATE, RACE_GATE, RESTART_X, buildLevels, type Level } from '../src/levels';
import { LOOP_ROUND, RACE_TOTAL, SEGMENTS } from '../src/timing';

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

const { levels } = buildLevels();

/** What block kind a map cell of `name` is showing right now. */
function showing(bot: StarterBot, l: Level, name: string): string {
  const shown = bot.sim.w.blkmap[l.book.n(name)];
  for (const [n, i] of l.book.index) if (i === shown) return n;
  return '?';
}
const gateIs = (bot: StarterBot, l: Level) => (showing(bot, l, 'gate.open.top.m') === 'gate.shut.top.m' ? 'shut' : 'open');
/** How many segments of the bar are lit (green or thin orange). */
const lit = (bot: StarterBot, l: Level) => Array.from({ length: SEGMENTS }, (_, i) => showing(bot, l, `seg${i}.on`)).filter((n) => !n.endsWith('.off')).length;

/** Waits (a tick at a time, like a person watching) until the gate is `state`; fails if it takes more than `max` ticks. */
async function waitForGate(bot: StarterBot, l: Level, state: 'open' | 'shut', max: number): Promise<void> {
  for (let i = 0; i < max && gateIs(bot, l) !== state; i++) await must(bot, bot.wait(1), `waiting for the gate to be ${state}`);
  if (gateIs(bot, l) !== state) throw new Error(`the gate never became ${state} in ${max} ticks`);
}

/** Pushes right for a second and a half: the hero must not get past `col`. */
async function pushOn(bot: StarterBot, col: number, what: string): Promise<void> {
  bot.sim.press(77);
  await must(bot, bot.wait(28), what);
  bot.sim.release(77);
  if (bot.px.x >= (col + 1) * 20) throw new Error(`${what}: the hero got past column ${col}`);
}

/** 1. Beat the Clock: too slow once, the gate shut; the clock door; then in time. */
export async function beatTheClock(bot: StarterBot): Promise<void> {
  const l = levels[0];
  if (lit(bot, l) !== SEGMENTS) throw new Error('the bar should start full');
  // read the bar's sign, wander on, read the gate's sign, and stay there looking at things
  await must(bot, bot.walk(7, 'the bar sign'), 'to the first sign');
  await must(bot, bot.wait(50), 'reading the sign');
  await must(bot, bot.walk(25, 'the gate sign'), 'to the gate sign');
  await must(bot, bot.wait(30), 'reading the sign');
  await waitForGate(bot, l, 'shut', RACE_TOTAL + 60);
  if (lit(bot, l) !== 0) throw new Error('the bar should be dark when the gate shuts');
  bot.say(`the bar is dark and the gate has shut at tick ${bot.sim.ticks}`);
  await must(bot, bot.wait(30), 'looking at the gate');
  // up to the gate: it is solid
  await must(bot, bot.walk(RACE_GATE - 3, 'the gate'), 'to the gate');
  await pushOn(bot, RACE_GATE - 1, 'pushing on into the shut gate');
  await must(bot, bot.wait(40), 'looking at the shut gate');
  // the clock door: step in and the level starts again, with a full bar and an open gate
  const before = bot.sim.trail.length;
  await leave(bot, bot.walk(RESTART_X, 'the clock door'), 'the clock door');
  if (bot.sim.trail.length !== before + 1 || bot.sim.ticks > 10) throw new Error('the clock door should begin the level again');
  await must(bot, bot.wait(1), 'a moment');
  if (gateIs(bot, l) !== 'open' || lit(bot, l) !== SEGMENTS) throw new Error('after the clock door the bar should be full and the gate open');
  const began = bot.sim.ticks;
  // and now run, taking the coins
  await must(bot, bot.walk(RACE_GATE + 3, 'through the gate'), 'through the gate');
  const took = bot.sim.ticks - began;
  bot.say(`through the gate with ${RACE_TOTAL - took} ticks to spare`);
  if (took > RACE_TOTAL - 40) throw new Error(`too close to the clock: ${took} of ${RACE_TOTAL} ticks`);
  await must(bot, bot.walk(41, 'the exit sign'), 'to the exit sign');
  // 6 coins before the gate on the first go, then all 8
  if (bot.sim.ci.score !== 140) throw new Error(`level 1 should give 14 coins (140), not ${bot.sim.ci.score}`);
  await leave(bot, bot.walk(43, 'the exit'), 'the exit');
}

/** 2. Round and Round: the gate is shut when he gets there; the bar fills and it opens by itself. */
export async function roundAndRound(bot: StarterBot): Promise<void> {
  const l = levels[1];
  await must(bot, bot.walk(15, 'the first coins'), 'to the coins');
  await must(bot, bot.wait(40), 'reading the sign');
  await must(bot, bot.walk(LOOP_GATE - 3, 'the gate'), 'to the gate');
  // watch the bar go dark and the gate shut, as the sign says it will
  await waitForGate(bot, l, 'shut', LOOP_ROUND);
  if (lit(bot, l) !== 0) throw new Error('the bar should be dark when the gate shuts');
  bot.say(`shut at tick ${bot.sim.ticks}`);
  await pushOn(bot, LOOP_GATE - 1, 'pushing on into the shut gate');
  // wait: the bar fills all at once and the gate opens
  await waitForGate(bot, l, 'open', LOOP_ROUND);
  if (lit(bot, l) !== SEGMENTS) throw new Error('the bar should be full when the gate opens again');
  bot.say(`open again at tick ${bot.sim.ticks}`);
  await must(bot, bot.walk(LOOP_GATE + 3, 'through the gate'), 'through the gate');
  await must(bot, bot.walk(36, 'the coins'), 'to the coins');
  if (bot.sim.ci.score !== 230) throw new Error(`level 2 should add 9 coins (230 in all), not ${bot.sim.ci.score}`);
  await leave(bot, bot.walk(43, 'the exit'), 'the exit');
}
