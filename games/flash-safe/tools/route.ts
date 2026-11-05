// The way through the game, as orders for the bot (kit/starter/bot.ts): the keys a person
// would press, level by level, taking every coin on the way. It acts out each lesson once:
//   level 1: read the signs, walk into the first burr (a beep, the ouch face, a "-5" that rises,
//            five hit points), then jump over the other two
//   level 2: read the signs and walk past the two lamps; each lamp's clock is checked
//   level 3: read the signs and walk under the storm; the sky's clock is checked
// Every tick is checked: each lamp and the sky change on the tick their blocks say, in order.
import type { Result, StarterBot } from '../../kit/starter/bot';
import { BURR_X, buildLevels, type Level } from '../src/levels';
import { BURR, POPFIVE } from '../src/monsters';
import { BLINK_OFF, BLINK_ON, PULSE_STEP, SKY_CALM, SKY_FIRST, SKY_HOLD, SKY_STEP, THORN_HURT } from '../src/timing';

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

/** Waits (a tick at a time) until `done()`; fails after `max` ticks. */
async function until(bot: StarterBot, done: () => boolean, what: string, max = 500): Promise<void> {
  for (let i = 0; i < max && !done(); i++) await must(bot, bot.wait(1), what);
  if (!done()) throw new Error(`${what}: never happened`);
}

/** How many monsters number `n` are alive. */
const alive = (bot: StarterBot, n: number) => bot.sim.w.mm.filter((m) => m.monnum === n).length;

/** 1. Hit Without a Flash. */
export async function hitWithoutAFlash(bot: StarterBot): Promise<void> {
  const score = bot.sim.ci.score;
  await must(bot, bot.walk(6, 'the first sign'), 'to the first sign');
  await must(bot, bot.wait(45), 'reading the sign');
  await must(bot, bot.walk(11, 'the second sign'), 'to the second sign');
  await must(bot, bot.wait(60), 'reading the sign');
  if (alive(bot, BURR) !== 3) throw new Error(`there should be 3 burrs, not ${alive(bot, BURR)}`);
  // what the signs teach, on purpose and once: walk into the first burr and watch what a hit is
  await must(bot, bot.walk(BURR_X[0] - 2, 'the first burr'), 'to the first burr');
  const hp0 = bot.sim.ci.hitpts;
  await must(bot, bot.walk(BURR_X[0] + 1, 'through the first burr'), 'into the first burr');
  await must(bot, bot.wait(4), 'the hit');
  const lost = hp0 - bot.sim.ci.hitpts;
  if (lost !== -THORN_HURT) throw new Error(`a burr should take ${-THORN_HURT} hit points, not ${lost}`);
  if (alive(bot, BURR) !== 2) throw new Error('the burr should be gone after the hit');
  if (alive(bot, POPFIVE) !== 1) throw new Error('the number -5 should be rising');
  bot.say(`hit: hit points ${hp0} -> ${bot.sim.ci.hitpts} at tick ${bot.sim.ticks}, the number is rising`);
  await must(bot, bot.wait(LOOK), 'looking at the number');
  await until(bot, () => alive(bot, POPFIVE) === 0, 'the number rising away', 200);
  // the other two burrs: jump over them
  const hp1 = bot.sim.ci.hitpts;
  await must(bot, bot.walk(BURR_X[1] - 2, 'the second burr'), 'to the second burr');
  await must(bot, bot.jump('right', BURR_X[1] + 2), 'over the second burr');
  await must(bot, bot.walk(BURR_X[2] - 2, 'the third burr'), 'to the third burr');
  await must(bot, bot.jump('right', BURR_X[2] + 2), 'over the third burr');
  if (bot.sim.ci.hitpts !== hp1) throw new Error('jumping over the burrs cost hit points');
  await must(bot, bot.walk(30, 'the last sign'), 'to the last sign');
  await must(bot, bot.wait(60), 'reading the sign');
  if (bot.sim.ci.score - score !== 4 * COIN) throw new Error(`level 1 should give 4 coins, not ${(bot.sim.ci.score - score) / COIN}`);
  await leave(bot, bot.walk(41, 'the exit'), 'the exit');
}

/** 2. Slow and Small. */
export async function slowAndSmall(bot: StarterBot): Promise<void> {
  const l = levels[1];
  const score = bot.sim.ci.score;
  const seenA = watch(bot, () => moodOf(bot, l, 'lampA.start'));
  const seenB = watch(bot, () => moodOf(bot, l, 'lampB.start'));
  await must(bot, bot.walk(6, 'the first sign'), 'to the first sign');
  await must(bot, bot.wait(60), 'reading the sign');
  await must(bot, bot.walk(11, 'the first lamp'), 'to the first lamp');
  await must(bot, bot.wait(50), 'watching the lamp blink');
  await must(bot, bot.walk(15, 'the second sign'), 'to the second sign');
  await must(bot, bot.wait(60), 'reading the sign');
  await must(bot, bot.walk(19, 'the second lamp'), 'to the second lamp');
  await must(bot, bot.wait(50), 'watching the lamp pulse');
  await must(bot, bot.walk(25, 'the third sign'), 'to the third sign');
  await must(bot, bot.wait(60), 'reading the sign');
  await must(bot, bot.walk(33, 'the last sign'), 'to the last sign');
  await must(bot, bot.wait(60), 'reading the sign');
  inOrder(
    seenA,
    [
      ['on', BLINK_ON],
      ['off', BLINK_OFF],
    ],
    BLINK_OFF,
    'lamp A',
  );
  inOrder(
    seenB,
    [1, 2, 3, 4, 5, 0].map((k) => [`s${k}`, PULSE_STEP] as [string, number]),
    PULSE_STEP,
    'lamp B',
  );
  if (seenA.length < 8 || seenB.length < 8) throw new Error('the lamps should have changed several times');
  if (bot.sim.ci.score - score !== 4 * COIN) throw new Error(`level 2 should give 4 coins, not ${(bot.sim.ci.score - score) / COIN}`);
  await leave(bot, bot.walk(41, 'the exit'), 'the exit');
}

/** 3. Storm, Held. */
export async function stormHeld(bot: StarterBot): Promise<void> {
  const l = levels[2];
  const score = bot.sim.ci.score;
  const seen = watch(bot, () => moodOf(bot, l, 'st.sky.start'));
  await must(bot, bot.walk(6, 'the first sign'), 'to the first sign');
  await must(bot, bot.wait(70), 'reading the sign');
  await must(bot, bot.walk(11, 'the second sign'), 'to the second sign');
  await must(bot, bot.wait(70), 'reading the sign');
  await must(bot, bot.walk(20, 'under the bolt'), 'to the bolt');
  // stand and watch a whole lift, hold and settle
  await until(bot, () => seen.filter(([m]) => m === 'hold').length >= 1, 'waiting for the sky to lift', 400);
  await until(bot, () => seen.filter(([m]) => m === 'settle').length >= 1, 'waiting for it to settle', 100);
  await must(bot, bot.wait(LOOK), 'looking at the quiet sky');
  await must(bot, bot.walk(33, 'the far coins'), 'to the far coins');
  inOrder(
    seen,
    [
      ['lift', SKY_STEP],
      ['hold', SKY_HOLD],
      ['settle', SKY_STEP],
      ['calm', SKY_CALM],
    ],
    SKY_FIRST,
    'the sky',
  );
  if (bot.sim.ci.score - score !== 4 * COIN) throw new Error(`level 3 should give 4 coins, not ${(bot.sim.ci.score - score) / COIN}`);
  await leave(bot, bot.walk(41, 'the exit'), 'the exit');
}
