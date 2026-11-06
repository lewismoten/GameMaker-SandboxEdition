// The way through the game, as orders for the bot (kit/starter/bot.ts): the keys a person
// would press, level by level, taking every coin on the way. Each sign's lesson is acted out,
// the mistake included, once: Kit stands under the nest and waits for a bird to hatch (it hatches
// more by itself), and in level 2 steps on the path nest, which stops. The checks here fail if anything else happens.
import type { Result, StarterBot } from '../../kit/starter/bot';
import { ORIGIN } from '../../kit/starter/map';
import { PATH_NEST_X, STAND } from '../src/levels';
import { BIRD, BLUEBIRD } from '../src/monsters';

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

/** Waits like a person, a look every half second, until `gone()`; false if it never happens. */
async function waitUntil(bot: StarterBot, gone: () => boolean, what: string): Promise<void> {
  let ticks = 0;
  for (; ticks < 1200 && !gone(); ticks += 3) await must(bot, bot.wait(3), what);
  if (!gone()) throw new Error(`${what}: never happened`);
  bot.say(`${what}: ${ticks} ticks`);
}

/** 1. A Nest: read the signs, stand under the shelf nest and watch it hatch a bird, then walk on (coins on the way, then the door). */
export async function aNest(bot: StarterBot): Promise<void> {
  const score = bot.sim.ci.score;
  await must(bot, bot.walk(8, 'the first sign'), 'to the first sign');
  await must(bot, bot.wait(READ), 'reading');
  await must(bot, bot.walk(17, 'the second sign'), 'to the second sign');
  await must(bot, bot.wait(READ), 'reading');
  await must(bot, bot.walk(23, 'under the nest'), 'to the nest');
  await waitUntil(bot, () => alive(bot, BIRD) > 0, 'waiting for a bird');
  await must(bot, bot.wait(50), 'watching it flutter');
  await waitUntil(bot, () => alive(bot, BIRD) >= 2, 'waiting for the next bird');
  await must(bot, bot.walk(36, 'on past the nest'), 'on past the nest');
  coins(bot, score, 6, 'level 1 before the exit');
  await leave(bot, bot.walk(43, 'the exit'), 'the exit');
}

/** 2. Empty Nest: the shelf nest hatches on; the nest on the path hatches blue birds until Kit steps on it. After that no more blue ones come. */
export async function emptyNest(bot: StarterBot): Promise<void> {
  const score = bot.sim.ci.score;
  await must(bot, bot.walk(8, 'the first sign'), 'to the first sign');
  await must(bot, bot.wait(READ), 'reading');
  await must(bot, bot.walk(15, 'the shelf nest'), 'under the shelf nest');
  await waitUntil(bot, () => alive(bot, BIRD) > 0, 'waiting for a yellow bird');
  await must(bot, bot.walk(26, 'the second sign'), 'to the second sign');
  await must(bot, bot.wait(READ), 'reading');
  await waitUntil(bot, () => alive(bot, BLUEBIRD) >= 2, 'waiting for blue birds from the path nest');
  const nest = bot.sim.w.map[(PATH_NEST_Y + ORIGIN) * 100 + PATH_NEST_X + ORIGIN];
  await must(bot, bot.walk(PATH_NEST_X + 1, 'over the path nest'), 'over the nest');
  if (bot.sim.w.map[(PATH_NEST_Y + ORIGIN) * 100 + PATH_NEST_X + ORIGIN] === nest)
    throw new Error('level 2: the nest should have turned into an empty nest when touched');
  bot.say('the path nest is empty');
  await waitUntil(bot, () => alive(bot, BLUEBIRD) === 0, 'waiting for the blue birds to go');
  await must(bot, bot.wait(SHELF_QUIET), 'a quiet moment');
  if (alive(bot, BLUEBIRD) !== 0) throw new Error('level 2: the emptied nest should hatch no more');
  await must(bot, bot.walk(40, 'on'), 'on past the nest');
  coins(bot, score, 6, 'level 2 before the exit');
  await leave(bot, bot.walk(43, 'the exit'), 'the exit');
}

/** Ticks to wait after the last blue bird goes: longer than the path nest's birth time, so a new one would show. */
const SHELF_QUIET = 90;
/** The row of the path nest (level coordinates). */
const PATH_NEST_Y = STAND;

export { ORIGIN };
