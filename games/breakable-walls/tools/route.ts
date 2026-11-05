// The way through the game, as orders for the bot (kit/starter/bot.ts): the keys a person
// would press, level by level, taking every coin on the way. It acts out each lesson once and the
// checks here fail unless each does what its sign says:
//   level 1: bump the one-wide wall (the two crates at Kit's height turn to rubble; the two above stay),
//            then the two-wide wall (one bump breaks one column; the second column takes a second bump)
//   level 2: stand in the stuck coin for a moment (the score climbs every tick and the coin stays), walk
//            on through ordinary coins (each pays once and is gone), then bump the crate wall
//   level 3: walk through five spinning gems (each is gone whichever frame it was caught in), bump the
//            crate wall and take the gems behind it
import type { Result, StarterBot } from '../../kit/starter/bot';
import { ORIGIN } from '../../kit/starter/map';
import { GEM_PAY, STUCK_PAY } from '../src/breakBlocks';
import { GROUND, L1, L2, L3, buildLevels } from '../src/levels';

const names = (() => {
  const { book } = buildLevels();
  return [...book.index].map(([n]) => n);
})();

/** The name of the block at level column `bx`, row `by`, in what the engine is playing. */
function at(bot: StarterBot, bx: number, by: number): string {
  return names[bot.sim.w.map[(ORIGIN + by) * 100 + ORIGIN + bx]] ?? '?';
}

function expect(bot: StarterBot, bx: number, by: number, want: string, what: string): void {
  const got = at(bot, bx, by);
  if (got !== want) throw new Error(`${what}: block ${bx},${by} is ${got}, expected ${want}`);
}

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

/** Every coin is 10 points and every gem is 25: the score a level should have given. */
function score(bot: StarterBot, from: number, want: number, what: string): void {
  const got = bot.sim.ci.score - from;
  if (got !== want) throw new Error(`${what}: scored ${got}, expected ${want}`);
  bot.say(`${what}: scored ${got}`);
}

/** A person's look at what just happened, in ticks (about a second and a half). */
const LOOK = 40;
const TOP = GROUND - 1 - (L1.rows - 1);

/** 1. Bump a Crate: a one-wide wall, then a two-wide one. */
export async function bumpACrate(bot: StarterBot): Promise<void> {
  const from = bot.sim.ci.score;
  await must(bot, bot.walk(L1.wallA - 1, 'the first wall'), 'to the first wall');
  expect(bot, L1.wallA, GROUND - 1, 'crate', 'before the bump');
  await must(bot, bot.walk(L1.wallA + 1, 'through the first wall'), 'through the first wall');
  await must(bot, bot.wait(LOOK), 'watching the rubble');
  expect(bot, L1.wallA, GROUND - 1, 'rubble', "the crate at Kit's feet");
  expect(bot, L1.wallA, GROUND - 2, 'rubble', "the crate at Kit's head");
  expect(bot, L1.wallA, GROUND - 3, 'crate', 'a crate above his head stays');
  expect(bot, L1.wallA, TOP, 'crate', 'the top crate stays');
  await must(bot, bot.walk(L1.wallB - 1, 'the second wall'), 'to the second wall');
  await must(bot, bot.walk(L1.wallB, 'into the second wall'), 'into the second wall');
  expect(bot, L1.wallB, GROUND - 1, 'rubble', 'the near column breaks');
  expect(bot, L1.wallB + 1, GROUND - 1, 'crate', 'the far column is a crate of its own');
  await must(bot, bot.walk(L1.wallB + 2, 'through the second wall'), 'through the second wall');
  expect(bot, L1.wallB + 1, GROUND - 1, 'rubble', 'the far column after the second bump');
  await must(bot, bot.walk(38, 'the coins'), 'the coins');
  score(bot, from, 80, 'level 1 before the exit');
  await leave(bot, bot.walk(45, 'the exit'), 'the exit');
}

/** 2. Coins Pay Once: the stuck coin, ordinary coins, a crate wall. */
export async function coinsPayOnce(bot: StarterBot): Promise<void> {
  const from = bot.sim.ci.score;
  const x0 = L2.stuck[0];
  await must(bot, bot.walk(x0 - 1, 'the stuck coin'), 'to the stuck coin');
  const before = bot.sim.ci.score;
  await must(bot, bot.walk(x0 + 1, 'into the stuck coin'), 'into the stuck coin');
  await must(bot, bot.wait(LOOK), 'standing in the stuck coin');
  const paid = bot.sim.ci.score - before;
  if (paid < 4 * STUCK_PAY) throw new Error(`the stuck coin paid only ${paid}`);
  for (const x of L2.stuck.slice(0, 2)) expect(bot, x, GROUND - 1, 'stuckCoin', 'a stuck coin stays');
  bot.say(`the stuck coin paid ${paid} and is still there`);
  await must(bot, bot.walk(L2.stuck[2] + 3, 'past the stuck coins'), 'past the stuck coins');
  const stuckTotal = bot.sim.ci.score - from;
  await must(bot, bot.walk(33, 'the coins'), 'the coins');
  expect(bot, 26, GROUND - 1, 'sky', 'an ordinary coin is gone');
  const coinsPaid = bot.sim.ci.score - from - stuckTotal;
  if (coinsPaid !== 70) throw new Error(`the ordinary coins paid ${coinsPaid}, expected 70`);
  await must(bot, bot.walk(L2.wall - 1, 'the crate wall'), 'to the wall');
  await must(bot, bot.walk(L2.wall + 1, 'through the crate wall'), 'through the wall');
  expect(bot, L2.wall, GROUND - 1, 'rubble', 'the wall');
  await must(bot, bot.walk(43, 'the coins'), 'the last coins');
  await leave(bot, bot.walk(49, 'the exit'), 'the exit');
}

/** 3. Spinning Gems: five gems caught in whatever frame, a wall, a stack. */
export async function spinningGems(bot: StarterBot): Promise<void> {
  const from = bot.sim.ci.score;
  const first = L3.gems[0];
  await must(bot, bot.walk(first - 1, 'the gems'), 'to the gems');
  await must(bot, bot.walk(L3.gems[4] + 2, 'through the gems'), 'through the gems');
  for (const x of L3.gems) expect(bot, x, GROUND - 1, 'sky', 'a gem caught in any frame is gone');
  score(bot, from, 5 * GEM_PAY, 'five gems');
  await must(bot, bot.walk(L3.wall - 1, 'the crate wall'), 'to the wall');
  await must(bot, bot.walk(L3.wall + 1, 'through the crate wall'), 'through the wall');
  expect(bot, L3.wall, GROUND - 1, 'rubble', 'the wall');
  await must(bot, bot.walk(L3.stack[1] + 2, 'the hidden gems'), 'the hidden gems');
  score(bot, from, 9 * GEM_PAY, 'five gems and the four behind the wall');
  await leave(bot, bot.walk(49, 'the exit'), 'the exit');
}
