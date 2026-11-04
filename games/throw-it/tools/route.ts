// The way through the game, as orders for the bot (kit/starter/bot.ts): the keys a person
// would press, level by level, taking every coin on the way. Each sign's lesson is acted out,
// the mistake included, once: level 1's first star falls short of a gumdrop too far away, and
// level 2's first star flies the wrong way. The checks here fail if a throw does anything else.
import type { Result, StarterBot } from '../../kit/starter/bot';
import { ORIGIN } from '../../kit/starter/map';
import { GUARD, POP_SCORE, STAR, TARGET } from '../src/monsters';
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

/** Every coin is 10 points and every pop 50: a level that should give `n` coins (and how many `pops`) must have. */
function coins(bot: StarterBot, from: number, n: number, what: string, pops: number): void {
  const got = (bot.sim.ci.score - from - pops * POP_SCORE) / 10;
  if (got !== n) {
    const left: string[] = [];
    const coin = bot.sim.w.bg.findIndex((b) => b.scorePts === 10);
    for (let y = 0; y < 100; y++) for (let x = 0; x < 100; x++) if (bot.sim.w.map[y * 100 + x] === coin) left.push(`${x - ORIGIN},${y - ORIGIN}`);
    throw new Error(`${what}: ${got} of ${n} coins; left at ${left.join(' ')}`);
  }
}

/** A throw must have popped exactly one `kind`, scoring its 50 points, and left no star flying. */
function popped(bot: StarterBot, kind: number, before: { score: number; left: number }, what: string): void {
  if (alive(bot, kind) !== before.left - 1) throw new Error(`${what}: the star should have popped one (${before.left} -> ${alive(bot, kind)})`);
  if (bot.sim.ci.score - before.score !== POP_SCORE) throw new Error(`${what}: a pop should score ${POP_SCORE}; score ${before.score} -> ${bot.sim.ci.score}`);
  if (alive(bot, STAR)) throw new Error(`${what}: a star is still flying`);
}

/** A throw must have missed: nothing popped and no points. */
function missed(bot: StarterBot, kind: number, before: { score: number; left: number }, what: string): void {
  if (alive(bot, kind) !== before.left || bot.sim.ci.score !== before.score) throw new Error(`${what}: the star was meant to miss`);
  if (alive(bot, STAR)) throw new Error(`${what}: a star is still flying`);
}

/** 1. Throw a Star: pop the near gumdrop; throw from too far to the second, then close in and pop it. */
export async function throwAStar(bot: StarterBot): Promise<void> {
  const score = bot.sim.ci.score;
  const stand = () => ({ score: bot.sim.ci.score, left: alive(bot, TARGET) });
  // the first sign says Enter throws: read it, face the gumdrop (Kit starts facing right) and throw
  await must(bot, bot.walk(10, 'the first gumdrop'), 'to the first gumdrop');
  let before = stand();
  await throwStar(bot, 'at the near gumdrop');
  popped(bot, TARGET, before, 'the first star');
  // the second sign says a star flies only so far: the next gumdrop is too far, so the star falls short
  await must(bot, bot.walk(22, 'the far gumdrop'), 'to the second sign');
  before = stand();
  await throwStar(bot, 'from too far');
  missed(bot, TARGET, before, 'the star from too far');
  // closer, and it lands
  await must(bot, bot.walk(29, 'closer'), 'closer to the far gumdrop');
  before = stand();
  await throwStar(bot, 'from close by');
  popped(bot, TARGET, before, 'the second star');
  coins(bot, score, 6, 'level 1 before the exit', 2);
  await leave(bot, bot.walk(43, 'the exit'), 'the exit');
}

/** 2. The Narrow Way: a star thrown the wrong way misses; face the grump, throw, and the way opens. */
export async function narrowWay(bot: StarterBot): Promise<void> {
  const score = bot.sim.ci.score;
  const stand = () => ({ score: bot.sim.ci.score, left: alive(bot, GUARD) });
  await must(bot, bot.walk(18, 'the tunnel'), 'to the tunnel');
  // facing the wrong way: one step back left, then a throw (it flies left)
  await must(bot, bot.walk(17, 'a step back'), 'a step back');
  let before = stand();
  await throwStar(bot, 'the wrong way');
  missed(bot, GUARD, before, 'the star thrown the wrong way');
  // face it (walk toward it) and throw
  await must(bot, bot.walk(21, 'the tunnel mouth'), 'to the tunnel mouth');
  before = stand();
  await throwStar(bot, 'at the grump');
  popped(bot, GUARD, before, 'the star at the grump');
  await must(bot, bot.walk(36, 'through the tunnel'), 'through the tunnel');
  coins(bot, score, 6, 'level 2 before the exit', 1);
  await leave(bot, bot.walk(43, 'the exit'), 'the exit');
}

export { ORIGIN };
