// The way through the game, as orders for the bot (kit/starter/bot.ts): the keys a person
// would press, level by level, taking every coin on the way. Each sign's lesson is acted out,
// the mistake included, once: in level 1 Kit walks into Big Bug first and is stung (it does not count
// as a hit), then throws five stars from a step back; each must be one hit, and level 2 checks that
// the bug's picture (one light fewer each time) follows the hits. The checks fail if a throw does anything else.
import type { Result, StarterBot } from '../../kit/starter/bot';
import { SCAN } from '../../kit/starter/ids';
import { ORIGIN } from '../../kit/starter/map';
import { HITS, HIT_SCORE, LAMPED, PLAIN, POOF, STAR, STING } from '../src/monsters';
import { BUG_X } from '../src/levels';
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
function coins(bot: StarterBot, from: number, n: number, what: string): void {
  const got = (bot.sim.ci.score - from - HITS * HIT_SCORE) / 10;
  if (got !== n) {
    const left: string[] = [];
    const coin = bot.sim.w.bg.findIndex((b) => b.scorePts === 10);
    for (let y = 0; y < 100; y++) for (let x = 0; x < 100; x++) if (bot.sim.w.map[y * 100 + x] === coin) left.push(`${x - ORIGIN},${y - ORIGIN}`);
    throw new Error(`${what}: ${got} of ${n} coins; left at ${left.join(' ')}`);
  }
}

/** Which stage of the bug is alive (a monster number from `first` to `first + HITS - 1`, or POOF), or undefined if none. */
export function stageOf(bot: StarterBot, first: number): number | undefined {
  return bot.sim.w.mm.map((m) => m.monnum).find((n) => (n >= first && n < first + HITS) || n === POOF);
}

/** Throws at the bug `HITS` times, and after each one the bug must be exactly one stage on and the score 20 higher. */
async function fiveHits(bot: StarterBot, first: number, what: string): Promise<void> {
  for (let hit = 1; hit <= HITS; hit++) {
    const score = bot.sim.ci.score;
    await throwStar(bot, `at ${what}, hit ${hit}`);
    const now = stageOf(bot, first);
    // the fifth hit leaves the puff, and it is gone (18 ticks) by the time the throw has been watched
    const want = hit < HITS ? first + hit : undefined;
    if (now !== want) throw new Error(`${what}: after hit ${hit} the bug should be stage ${want} but is ${now}`);
    if (bot.sim.ci.score - score !== HIT_SCORE) throw new Error(`${what}: hit ${hit} should score ${HIT_SCORE}; score ${score} -> ${bot.sim.ci.score}`);
    if (alive(bot, STAR)) throw new Error(`${what}: a star is still flying after hit ${hit}`);
  }
  if (stageOf(bot, first) !== undefined) throw new Error(`${what}: the bug is still there after five hits`);
}

/** 1. Five Hits: walk into the bug (it stings and counts nothing), step back, throw five stars, then walk through. */
export async function fiveHitsLevel(bot: StarterBot): Promise<void> {
  const score = bot.sim.ci.score;
  await must(bot, bot.walk(10, 'the signs'), 'to the signs');
  await must(bot, bot.walk(23, 'the tunnel'), 'to the tunnel');
  // the sign says touching only stings: walk into it for a moment (it is solid, so Kit stops in front of it)
  const hp = bot.sim.ci.hitpts;
  const before = bot.sim.ci.score;
  bot.sim.press(SCAN.right);
  await must(bot, bot.wait(20), 'walking into the bug');
  bot.sim.release(SCAN.right);
  const lost = hp - bot.sim.ci.hitpts;
  bot.say(`walked into the bug: hit points ${hp} -> ${bot.sim.ci.hitpts}`);
  if (lost < STING) throw new Error(`walking into the bug should sting (at least ${STING}); hit points ${hp} -> ${bot.sim.ci.hitpts}`);
  if (stageOf(bot, PLAIN) !== PLAIN || bot.sim.ci.score !== before) throw new Error('a touch must not count as a hit');
  // step back (turning to face it again), and throw
  await must(bot, bot.walk(18, 'a step back'), 'a step back');
  await must(bot, bot.walk(21, 'facing it'), 'facing the bug');
  await fiveHits(bot, PLAIN, 'the plain bug');
  await must(bot, bot.walk(36, 'through the tunnel'), 'through the tunnel');
  coins(bot, score, 8, 'level 1 before the exit');
  await leave(bot, bot.walk(43, 'the exit'), 'the exit');
}

/** 2. Count the Lights: throw five stars; the bug's picture has one light fewer after each (a different monster number each time). */
export async function countTheLights(bot: StarterBot): Promise<void> {
  const score = bot.sim.ci.score;
  await must(bot, bot.walk(16, 'the signs'), 'to the signs');
  await must(bot, bot.walk(29, 'the tunnel'), 'to the tunnel');
  await fiveHits(bot, LAMPED, 'the lamped bug');
  await must(bot, bot.walk(TUNNEL_END, 'through the tunnel'), 'through the tunnel');
  coins(bot, score, 7, 'level 2 before the exit');
  await leave(bot, bot.walk(44, 'the exit'), 'the exit');
}

const TUNNEL_END = BUG_X[1] + 7;
export { ORIGIN };
