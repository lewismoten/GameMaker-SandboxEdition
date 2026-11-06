// The way through the game, as orders for the bot (kit/starter/bot.ts): the keys a person
// would press, level by level, taking every coin on the way. Each sign's lesson is acted out,
// the mistake included, once: in level 1 Kit walks into Big Bug first and is stung (it does not count
// as a hit), then throws from a step back, waiting for the bug to walk close. Each hit must move the bug
// exactly one stage on for 20 points (a throw that misses is just thrown again, as a person would), and
// the hurried stages must walk faster than the calm ones. Level 2 adds the tiny last face.
import type { Result, StarterBot } from '../../kit/starter/bot';
import { SCAN } from '../../kit/starter/ids';
import { ORIGIN } from '../../kit/starter/map';
import { CHAINS, HIT_SCORE, POOF, STAR, STING } from '../src/monsters';
import { SCAN_ENTER } from '../src/hero';

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

/** Ticks a star lives (monsters.ts STAR_LIFE) and the sparkle after it, so a throw has finished by then. */
const THROW_WATCH = 60;

/** Presses Enter like a person (a tap), then waits for the star to land or fizzle. */
export async function throwStar(bot: StarterBot, what: string): Promise<void> {
  bot.sim.press(SCAN_ENTER);
  await must(bot, bot.wait(3), 'throwing');
  bot.sim.release(SCAN_ENTER);
  await must(bot, bot.wait(THROW_WATCH), 'watching the star');
  bot.say(`threw a star ${what}, score ${bot.sim.ci.score}`);
}

/** Every coin is 10 points and every hit 20: a level that should give `n` coins must have. */
function coins(bot: StarterBot, from: number, n: number, hits: number, what: string): void {
  const got = (bot.sim.ci.score - from - hits * HIT_SCORE) / 10;
  if (got !== n) {
    const left: string[] = [];
    const coin = bot.sim.w.bg.findIndex((b) => b.scorePts === 10);
    for (let y = 0; y < 100; y++) for (let x = 0; x < 100; x++) if (bot.sim.w.map[y * 100 + x] === coin) left.push(`${x - ORIGIN},${y - ORIGIN}`);
    throw new Error(`${what}: ${got} of ${n} coins; left at ${left.join(' ')}`);
  }
}

/** The stage of the bug that is alive (a monster number in the chain, or POOF), or undefined if none. */
export function stageOf(bot: StarterBot, level: number): number | undefined {
  const { first, looks } = CHAINS[level];
  return bot.sim.w.mm.map((m) => m.monnum).find((n) => (n >= first && n < first + looks.length) || n === POOF);
}

/** Where the bug is, in blocks along the level (undefined when it is gone). */
function bugAt(bot: StarterBot, level: number): number | undefined {
  const { first, looks } = CHAINS[level];
  const i = bot.sim.w.mm.findIndex((x) => x.monnum >= first && x.monnum < first + looks.length);
  if (i < 0) return undefined;
  const m = bot.sim.w.mi[i]; // the live one: its block, then pixels into the block
  return m.curx[0] - ORIGIN + m.curx[1] / 20;
}

/** How far the bug walked, in pixels, over `ticks` ticks of waiting. */
async function watchWalk(bot: StarterBot, level: number, ticks: number): Promise<number> {
  let far = 0;
  let last = bugAt(bot, level);
  for (let i = 0; i < ticks; i++) {
    await must(bot, bot.wait(1), 'watching the bug');
    const x = bugAt(bot, level);
    if (x !== undefined && last !== undefined) far += Math.abs(x - last) * 20;
    last = x;
  }
  return far;
}

/** Throws at the bug until it has taken one more hit (waiting for it to walk close first); returns the throws that missed. */
async function oneHit(bot: StarterBot, level: number, hit: number): Promise<number> {
  const { first, looks } = CHAINS[level];
  const hits = looks.length;
  for (let miss = 0; miss < 14; miss++) {
    const score = bot.sim.ci.score;
    // wait (a person watches) until the bug is walking in close to the tunnel mouth
    let waited = 0;
    while ((bugAt(bot, level) ?? 99) > 27 && waited++ < 300) await must(bot, bot.wait(1), 'waiting for the bug');
    bot.say(`bug at ${bugAt(bot, level)?.toFixed(2)} kit ${(bot.px.x / 20).toFixed(2)}`);
    await throwStar(bot, `at the ${looks[hit]} bug, hit ${hit + 1}`);
    if (bot.sim.ci.score - score === HIT_SCORE) {
      const now = stageOf(bot, level);
      const want = hit + 1 < hits ? first + hit + 1 : undefined;
      if (now !== want) throw new Error(`level ${level + 1}: after hit ${hit + 1} the bug should be stage ${want} but is ${now}`);
      if (alive(bot, STAR)) throw new Error(`a star is still flying after hit ${hit + 1}`);
      return miss;
    }
    if (bot.sim.ci.score !== score) throw new Error(`a throw scored ${bot.sim.ci.score - score}, not ${HIT_SCORE}`);
    // missed (the bug had walked out of range): try again
  }
  throw new Error(`level ${level + 1}: hit ${hit + 1} never landed\n${bot.log.slice(-6).join('\n')}`);
}

/** Hits the bug all the way down; returns each look's measured walking speed (pixels a 50-tick look) and the misses. */
async function fight(bot: StarterBot, level: number, what: string): Promise<void> {
  const { looks } = CHAINS[level];
  const measured: Record<string, number> = {};
  let misses = 0;
  for (let hit = 0; hit < looks.length; hit++) {
    const look = looks[hit];
    if (!(look in measured)) measured[look] = (await watchWalk(bot, level, 60)) / 60;
    misses += await oneHit(bot, level, hit);
  }
  bot.say(
    `${what}: ${looks.length} hits, ${misses} misses; walked ${Object.entries(measured)
      .map(([k, v]) => `${k} ${v.toFixed(2)}`)
      .join(', ')} px a tick`,
  );
  if (stageOf(bot, level) !== undefined) throw new Error(`${what}: the bug is still there after ${looks.length} hits`);
  if (measured.calm !== undefined && measured.hurry !== undefined && !(measured.hurry > measured.calm * 1.5))
    throw new Error(`${what}: the hurried bug should walk faster than the calm one (${measured.hurry} vs ${measured.calm})`);
  if (measured.tiny !== undefined && !(measured.tiny > measured.hurry))
    throw new Error(`${what}: the tiny bug should be quickest (${measured.tiny} vs ${measured.hurry})`);
}

/** 1. Half Way: walk into the bug (it stings and counts nothing), step back, throw four stars as it walks close, then walk through. */
export async function halfWayLevel(bot: StarterBot): Promise<void> {
  const score = bot.sim.ci.score;
  await must(bot, bot.walk(10, 'the signs'), 'to the signs');
  await must(bot, bot.walk(21, 'the tunnel'), 'to the tunnel');
  // the sign says touching only stings: walk into it for a moment (it is solid, so Kit stops in front of it)
  const hp = bot.sim.ci.hitpts;
  const before = bot.sim.ci.score;
  bot.sim.press(SCAN.right);
  await must(bot, bot.wait(50), 'walking into the bug');
  bot.sim.release(SCAN.right);
  const lost = hp - bot.sim.ci.hitpts;
  bot.say(`walked into the bug: hit points ${hp} -> ${bot.sim.ci.hitpts}`);
  if (lost < STING) throw new Error(`walking into the bug should sting (at least ${STING}); hit points ${hp} -> ${bot.sim.ci.hitpts}`);
  if (stageOf(bot, 0) !== CHAINS[0].first || bot.sim.ci.score !== before) throw new Error('a touch must not count as a hit');
  // step back (turning to face it again), and throw
  await must(bot, bot.walk(18, 'a step back'), 'a step back');
  await must(bot, bot.walk(21, 'facing it'), 'facing the bug');
  await fight(bot, 0, 'level 1');
  await must(bot, bot.walk(35, 'through the tunnel'), 'through the tunnel');
  await must(bot, bot.walk(40, 'the coins'), 'the coins');
  coins(bot, score, 8, CHAINS[0].looks.length, 'level 1 before the exit');
  await leave(bot, bot.walk(43, 'the exit'), 'the exit');
}

/** 2. A Third Face: five stars; the last is a tiny new face that walks quickest. */
export async function aThirdFace(bot: StarterBot): Promise<void> {
  const score = bot.sim.ci.score;
  await must(bot, bot.walk(16, 'the signs'), 'to the signs');
  await must(bot, bot.walk(21, 'the tunnel'), 'to the tunnel');
  await fight(bot, 1, 'level 2');
  await must(bot, bot.walk(35, 'through the tunnel'), 'through the tunnel');
  await must(bot, bot.walk(41, 'the coins'), 'the coins');
  coins(bot, score, 7, CHAINS[1].looks.length, 'level 2 before the exit');
  await leave(bot, bot.walk(44, 'the exit'), 'the exit');
}

export { ORIGIN };
