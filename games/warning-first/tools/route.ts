// The way through the game, as orders for the bot (kit/starter/bot.ts): the keys a person
// would press, level by level, taking every coin on the way. It acts out each lesson once,
// the mistake included:
//   level 1: read the signs, then stand on the first vent through its rumble and take its puff
//            (a few hit points); after that wait for each puff to end and cross at once
//   level 2: read the signs, stand on the first bridge while it flickers and fall to the mat,
//            hop out, then cross each bridge while it is solid
// Every tick is checked: each vent and plank changes on the tick its block says, in order.
import type { Result, StarterBot } from '../../kit/starter/bot';
import { BRIDGE_W, BRIDGE_X, GROUND, PIT_ROWS, VENT_X, buildLevels, ventBlock, type Level } from '../src/levels';
import { FLICKER, GONE, PLANK_FIRST, PUFF, REST, RUMBLE, SOLID, VENT_FIRST } from '../src/timing';

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

/** The mood a kind of block is showing right now (its name's last part: start, rest, rumble, puff, solid, flicker, gone). */
function moodOf(bot: StarterBot, l: Level, name: string): string {
  const shown = bot.sim.w.blkmap[l.book.n(name)];
  for (const [n, i] of l.book.index) if (i === shown) return n.split('.').pop() as string;
  return '?';
}

/** Follows the clocks: calls `look` after every tick of the sim and records each change of its answer: [mood, tick]. Checks nothing yet; see `inOrder`. */
function watch(bot: StarterBot, look: () => string): [string, number][] {
  const seen: [string, number][] = [[look(), bot.sim.ticks]];
  const sim = bot.sim as unknown as { tick: () => Promise<unknown> };
  const orig = sim.tick.bind(sim);
  sim.tick = async () => {
    const r = await orig();
    const v = look();
    if (seen[seen.length - 1][0] !== v) seen.push([v, bot.sim.ticks]);
    return r;
  };
  return seen;
}

/** The moods seen must come in `cycle` order, each as long as its block says (give or take 2 ticks); `first` is the opening length. */
function inOrder(seen: [string, number][], cycle: [string, number][], first: number, what: string): void {
  const names = cycle.map(([n]) => n);
  seen.forEach(([m, t], i) => {
    if (i === 0) return;
    const [pm, pt] = seen[i - 1];
    const k = names.indexOf(pm === 'start' ? names[names.length - 1] : pm);
    const want = pm === 'start' ? first : cycle[k][1];
    const next = names[(k + 1) % names.length];
    if (m !== next && !(pm === 'start' && m === names[0])) throw new Error(`${what}: ${pm} was followed by ${m}, wanted ${next}`);
    if (Math.abs(t - pt - want) > 2) throw new Error(`${what}: ${pm} lasted ${t - pt} ticks, wanted ${want}`);
  });
}

/** Ticks since the last change in `seen`. */
const since = (bot: StarterBot, seen: [string, number][]) => bot.sim.ticks - seen[seen.length - 1][1];

/** Waits (a tick at a time) until `done()`; fails after `max` ticks. */
async function until(bot: StarterBot, done: () => boolean, what: string, max = 500): Promise<void> {
  for (let i = 0; i < max && !done(); i++) await must(bot, bot.wait(1), what);
  if (!done()) throw new Error(`${what}: never happened`);
}

/** 1. Rumble, Then Puff. */
export async function rumbleThenPuff(bot: StarterBot): Promise<void> {
  const l = levels[0];
  const score = bot.sim.ci.score;
  const mood = (k: number) => moodOf(bot, l, ventBlock(k, 'a', 'start'));
  const seen = VENT_X.map((_, k) => watch(bot, () => mood(k)));
  const cycle: [string, number][] = [
    ['rumble', RUMBLE],
    ['puff', PUFF],
    ['rest', REST],
  ];
  await must(bot, bot.walk(6, 'the first sign'), 'to the first sign');
  await must(bot, bot.wait(45), 'reading the sign');
  await must(bot, bot.walk(11, 'the second sign'), 'to the second sign');
  await must(bot, bot.wait(45), 'reading the sign');
  // what the first sign teaches, on purpose and once: stand on the first vent through the rumble and take the puff
  await must(bot, bot.walk(VENT_X[0] - 2, 'the first vent'), 'to the first vent');
  const hp0 = bot.sim.ci.hitpts;
  await until(bot, () => mood(0) === 'rumble', 'waiting for the first rumble');
  bot.say(`the first vent rumbles at tick ${bot.sim.ticks}`);
  await must(bot, bot.walk(VENT_X[0], 'on the first vent'), 'onto the first vent');
  await until(bot, () => mood(0) === 'puff', 'waiting for the puff');
  await until(bot, () => mood(0) === 'rest', 'taking the puff');
  const lost = hp0 - bot.sim.ci.hitpts;
  if (lost < 1 || lost > 12) throw new Error(`the puff should sting a little, not ${lost} hit points`);
  bot.say(`stung by the puff: hit points ${hp0} -> ${bot.sim.ci.hitpts} at tick ${bot.sim.ticks}`);
  await must(bot, bot.wait(LOOK), 'looking at the sting');
  // from here on he waits for each puff to end, then crosses
  const hp1 = bot.sim.ci.hitpts;
  await must(bot, bot.walk(VENT_X[0] + 2, 'past the first vent'), 'off the first vent');
  for (let k = 1; k < VENT_X.length; k++) {
    await must(bot, bot.walk(VENT_X[k] - 3, `the vent ${k + 1}`), `to the vent ${k + 1}`);
    await until(bot, () => mood(k) === 'puff', `waiting for puff ${k + 1}`);
    await until(bot, () => mood(k) === 'rest', `waiting for puff ${k + 1} to end`);
    await must(bot, bot.wait(8), 'a breath');
    await must(bot, bot.walk(VENT_X[k] + 2, `past the vent ${k + 1}`), `across the vent ${k + 1}`);
    if (bot.sim.ci.hitpts !== hp1) throw new Error(`crossing vent ${k + 1} cost hit points (${hp1} -> ${bot.sim.ci.hitpts})`);
    if (mood(k) === 'rumble' || mood(k) === 'puff') throw new Error(`vent ${k + 1} was ${mood(k)} when he got across: too slow`);
  }
  seen.forEach((s, k) => inOrder(s, cycle, VENT_FIRST[k], `vent ${k + 1}`));
  if (bot.sim.ci.score - score !== 4 * COIN) throw new Error(`level 1 should give 4 coins, not ${(bot.sim.ci.score - score) / COIN}`);
  await leave(bot, bot.walk(37, 'the exit'), 'the exit');
}

/** 2. Flicker, Then Gone. */
export async function flickerThenGone(bot: StarterBot): Promise<void> {
  const l = levels[1];
  const score = bot.sim.ci.score;
  const deaths = bot.sim.deaths;
  const mood = (k: number) => moodOf(bot, l, `p${k}.start`);
  const seen = BRIDGE_X.map((_, k) => watch(bot, () => mood(k)));
  const cycle: [string, number][] = [
    ['flicker', FLICKER],
    ['gone', GONE],
    ['solid', SOLID],
  ];
  const hp = bot.sim.ci.hitpts;
  const left = BRIDGE_X[0];
  await must(bot, bot.walk(7, 'the first sign'), 'to the first sign');
  await must(bot, bot.wait(45), 'reading the sign');
  await must(bot, bot.walk(left - 1, 'the edge of the first bridge'), 'to the first bridge');
  // what the sign teaches, on purpose and once: stay on the planks through the flicker and fall to the mat
  await until(bot, () => ['start', 'solid'].includes(mood(0)) && since(bot, seen[0]) < 30, 'waiting for the bridge to be solid', 400);
  await must(bot, bot.walk(left + 2, 'out on the bridge'), 'out on the bridge');
  const y0 = bot.px.y;
  await until(bot, () => mood(0) === 'flicker', 'standing on the planks');
  bot.say(`the planks flicker at tick ${bot.sim.ticks}, and he stays`);
  await until(bot, () => bot.px.y > y0 + 20, 'falling', 160);
  await must(bot, bot.land(), 'landing on the mat');
  await must(bot, bot.wait(LOOK), 'looking at where he is');
  if (bot.sim.ci.hitpts !== hp || bot.sim.deaths !== deaths) throw new Error('the fall cost something');
  bot.say(`fell to the mat at tick ${bot.sim.ticks}, nothing lost`);
  // hop out: walk to the pit's left wall and jump up and over it
  await must(bot, bot.walk(left, 'the pit wall'), 'to the pit wall');
  await must(bot, bot.jump('left', left - 1), 'out of the pit');
  if (bot.px.y > (GROUND - 1) * 20 + 4) throw new Error(`still in the pit (y ${bot.px.y})`);
  await must(bot, bot.wait(LOOK), 'catching his breath');
  // then do as the sign said: cross each bridge while it is solid and has time left
  const crossing = 70;
  const left0 = () => (mood(0) === 'start' ? PLANK_FIRST[0] : SOLID) - since(bot, seen[0]);
  await until(bot, () => ['start', 'solid'].includes(mood(0)) && left0() >= crossing, 'waiting for the first bridge', 600);
  await must(bot, bot.walk(left + BRIDGE_W + 2, 'the island'), 'across the first bridge');
  if (bot.px.y > (GROUND - 1) * 20 + 4) throw new Error('fell off the first bridge');
  const right = BRIDGE_X[1];
  const left1 = () => (mood(1) === 'start' ? PLANK_FIRST[1] : SOLID) - since(bot, seen[1]);
  await must(bot, bot.walk(right - 1, 'the island edge'), 'to the second bridge');
  await until(bot, () => ['start', 'solid'].includes(mood(1)) && left1() >= crossing, 'waiting for the second bridge', 600);
  await must(bot, bot.walk(right + BRIDGE_W + 2, 'the far bank'), 'across the second bridge');
  if (bot.px.y > (GROUND - 1) * 20 + 4) throw new Error('fell off the second bridge');
  if (bot.sim.ci.hitpts !== hp) throw new Error('crossing cost hit points');
  seen.forEach((s, k) => inOrder(s, cycle, k === 0 ? PLANK_FIRST[0] : PLANK_FIRST[1], `bridge ${k + 1}`));
  await must(bot, bot.walk(30, 'the coins'), 'to the coins');
  if (bot.sim.ci.score - score !== 4 * COIN) throw new Error(`level 2 should give 4 coins, not ${(bot.sim.ci.score - score) / COIN}`);
  await leave(bot, bot.walk(33, 'the exit'), 'the exit');
  if (PIT_ROWS.length !== 2) throw new Error('the pit changed');
}
