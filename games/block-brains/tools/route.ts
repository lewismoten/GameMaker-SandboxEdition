// The way through the game, as orders for the bot (kit/starter/bot.ts): the keys a person
// would press, taking every coin on the way. It acts out each lesson once, the mistake included:
//   1. read the signs, watch the lamps take their turns, walk into gate 1 while it is shut (it
//      stays shut), then go through each gate in its turn;
//   2. cross a sun gate, try the moon gate while it is shut, wait for it, and so on to the exit.
// Every tick is checked: each ring turns on the tick its block says, and a gate is open exactly
// while its lamp is lit.
import { SCAN } from '../../kit/starter/ids';
import type { Result, StarterBot } from '../../kit/starter/bot';
import { GATES_ONE, GATES_TWO, LAMPS_ONE, LAMPS_TWO, WIDTH, buildLevels, openOf, startOf } from '../src/levels';
import { SPELL, TURN } from '../src/timing';

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

/** Whether the cell that started as block `start` shows its ring's open block now. */
function isOpen(bot: StarterBot, level: number, ring: string, start: string): boolean {
  const book = levels[level].book;
  return bot.sim.w.blkmap[book.n(start)] === book.n(openOf(ring));
}

/** Waits (a tick at a time) until `open()` is `want`, giving up after `max` ticks. */
async function until(bot: StarterBot, open: () => boolean, want: boolean, what: string, max = 400): Promise<void> {
  for (let i = 0; i < max && open() !== want; i++) await must(bot, bot.tick(), what);
  if (open() !== want) throw new Error(`${what}: never ${want ? 'opened' : 'shut'}`);
}

/** Walks into a gate that is shut, as a person would to see what it does, and checks it did not let him through. */
async function bump(bot: StarterBot, col: number, what: string, open: () => boolean): Promise<void> {
  await must(bot, bot.walk(col - 1, `the ${what}`), `to the ${what}`);
  bot.sim.press(SCAN.right);
  for (let i = 0; i < 24; i++) {
    const r = await bot.tick();
    if (r) throw new Error(`bumping the ${what}: ${r}`);
    if (open()) break;
  }
  bot.sim.release(SCAN.right);
  if (!open() && bot.px.x >= col * 20) throw new Error(`the ${what} let the hero through while shut`);
  bot.say(`bumped the ${what}, shut`);
}

/** Walks across gate `col` once it is open: waits beside it, then goes through at once (the open turn is long enough). */
async function through(bot: StarterBot, col: number, what: string, open: () => boolean): Promise<void> {
  await must(bot, bot.walk(col - 2, `the ${what}`), `to the ${what}`);
  await until(bot, open, true, `waiting for the ${what}`);
  await must(bot, bot.walk(col + 2, `through the ${what}`), `through the ${what}`);
}

/** Follows a ring: it must stay open `open` ticks and shut `shut` ticks (give or take two). */
function watchRing(bot: StarterBot, shows: () => boolean, open: number, shut: number, what: string): () => void {
  let last = shows();
  let since = bot.sim.ticks;
  const scene = bot.sim.trail.length;
  const sim = bot.sim as unknown as { tick: () => Promise<unknown> };
  const orig = sim.tick.bind(sim);
  let first = true;
  sim.tick = async () => {
    const r = await orig();
    if (bot.sim.trail.length !== scene) return r; // left the level
    const v = shows();
    if (v !== last) {
      const gap = bot.sim.ticks - since;
      const want = last ? open : shut;
      if (!first && Math.abs(gap - want) > 2) throw new Error(`${what}: ${last ? 'open' : 'shut'} for ${gap} ticks, wanted ${want}`);
      first = false;
      last = v;
      since = bot.sim.ticks;
    }
    return r;
  };
  return () => {
    sim.tick = orig;
  };
}

/** Level 1: Take Your Turn. */
export async function takeYourTurn(bot: StarterBot): Promise<void> {
  const score = bot.sim.ci.score;
  const gates = GATES_ONE.map((_, k) => () => isOpen(bot, 0, `gate${k}`, startOf(`gate${k}`, 3, k)));
  const lamps = LAMPS_ONE.map((_, k) => () => isOpen(bot, 0, `lamp${k}`, startOf(`lamp${k}`, 3, k)));
  const stops = gates.map((g, k) => watchRing(bot, g, TURN, 2 * TURN, `gate ${k + 1}`));
  // a gate is open exactly while its lamp is lit
  const sim = bot.sim as unknown as { tick: () => Promise<unknown> };
  const orig = sim.tick.bind(sim);
  const scene = bot.sim.trail.length;
  sim.tick = async () => {
    const r = await orig();
    if (bot.sim.trail.length !== scene) return r;
    gates.forEach((g, k) => {
      if (g() !== lamps[k]()) throw new Error(`gate ${k + 1} and its lamp disagree at tick ${bot.sim.ticks}`);
    });
    if (gates.filter((g) => g()).length !== 1) throw new Error(`exactly one gate should be open at tick ${bot.sim.ticks}`);
    return r;
  };
  await must(bot, bot.walk(6, 'the first sign'), 'to the first sign');
  await must(bot, bot.wait(45), 'reading the sign');
  await must(bot, bot.walk(10, 'the lamps'), 'to the lamps');
  await must(bot, bot.wait(3 * TURN + LOOK), 'watching the lamps take turns');
  await must(bot, bot.walk(16, 'the second sign'), 'to the second sign');
  await must(bot, bot.wait(45), 'reading the sign');
  // the mistake, on purpose: try gate 1 while it is shut
  await until(bot, gates[0], false, 'gate 1 to shut');
  await bump(bot, GATES_ONE[0], 'first gate', gates[0]);
  // then go through each in its turn
  for (let k = 0; k < 3; k++) await through(bot, GATES_ONE[k], `gate ${k + 1}`, gates[k]);
  await must(bot, bot.walk(GATES_ONE[2] + 6, 'the coins'), 'to the coins');
  if (bot.sim.ci.score - score !== 5 * COIN) throw new Error(`the level should give 5 coins, not ${(bot.sim.ci.score - score) / COIN}`);
  await leave(bot, bot.walk(WIDTH - 3, 'the exit'), 'the exit');
  sim.tick = orig;
  stops.forEach((s) => s());
}

/** Level 2: Out of Step. */
export async function outOfStep(bot: StarterBot): Promise<void> {
  const score = bot.sim.ci.score;
  const sun = () => isOpen(bot, 1, 'sun.gate', startOf('sun.gate', 2, 0));
  const moon = () => isOpen(bot, 1, 'moon.gate', startOf('moon.gate', 2, 1));
  const sunLamp = () => isOpen(bot, 1, 'sun.lamp', startOf('sun.lamp', 2, 0));
  const moonLamp = () => isOpen(bot, 1, 'moon.lamp', startOf('moon.lamp', 2, 1));
  const stops = [watchRing(bot, sun, SPELL, SPELL, 'the sun'), watchRing(bot, moon, SPELL, SPELL, 'the moon')];
  const sim = bot.sim as unknown as { tick: () => Promise<unknown> };
  const orig = sim.tick.bind(sim);
  const scene = bot.sim.trail.length;
  sim.tick = async () => {
    const r = await orig();
    if (bot.sim.trail.length !== scene) return r;
    if (sun() === moon()) throw new Error(`sun and moon should take turns, tick ${bot.sim.ticks}`);
    if (sun() !== sunLamp() || moon() !== moonLamp()) throw new Error(`a lamp and its gate disagree at tick ${bot.sim.ticks}`);
    return r;
  };
  void LAMPS_TWO;
  await must(bot, bot.walk(6, 'the first sign'), 'to the first sign');
  await must(bot, bot.wait(45), 'reading the sign');
  await must(bot, bot.walk(11, 'the lamps'), 'to the lamps');
  await must(bot, bot.wait(2 * SPELL + LOOK), 'watching the sun and moon take turns');
  await must(bot, bot.walk(13, 'the second sign'), 'to the second sign');
  await must(bot, bot.wait(45), 'reading the sign');
  await through(bot, GATES_TWO[0], 'first sun gate', sun);
  // the mistake, on purpose: the moon gate is shut while the sun gate is open
  await until(bot, moon, false, 'the moon gate to shut');
  await bump(bot, GATES_TWO[1], 'moon gate', moon);
  await through(bot, GATES_TWO[1], 'moon gate', moon);
  await through(bot, GATES_TWO[2], 'second sun gate', sun);
  await through(bot, GATES_TWO[3], 'second moon gate', moon);
  await must(bot, bot.walk(GATES_TWO[3] + 6, 'the coins'), 'to the coins');
  if (bot.sim.ci.score - score !== 5 * COIN) throw new Error(`the level should give 5 coins, not ${(bot.sim.ci.score - score) / COIN}`);
  await leave(bot, bot.walk(WIDTH - 3, 'the exit'), 'the exit');
  sim.tick = orig;
  stops.forEach((s) => s());
}
