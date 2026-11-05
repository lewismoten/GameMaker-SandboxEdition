// The way through the game, as orders for the bot (kit/starter/bot.ts): the keys a person
// would press, level by level, taking every coin on the way. It acts out each lesson once and the
// checks here fail unless each does what its sign says:
//   level 1: walk into the real wall (it stops him; he jumps over), then into the picture of a wall,
//            drawn exactly like it, and straight through
//   level 2: bump the wall (it becomes a cracked block that he walks into, and that becomes chips),
//            then a wall two thick (each block changes on its own)
//   level 3: walk into the wall with coins showing in it and take them
import type { Result, StarterBot } from '../../kit/starter/bot';
import { ORIGIN } from '../../kit/starter/map';
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

/** Every coin is 10 points: the score a level should have given. */
function score(bot: StarterBot, from: number, want: number, what: string): void {
  const got = bot.sim.ci.score - from;
  if (got !== want) throw new Error(`${what}: scored ${got}, expected ${want}`);
  bot.say(`${what}: scored ${got}`);
}

/** A person's look at what just happened, in ticks (about a second and a half). */
const LOOK = 40;

/** 1. Same Look: a real wall, then a picture of one. */
export async function sameLook(bot: StarterBot): Promise<void> {
  const from = bot.sim.ci.score;
  await must(bot, bot.walk(L1.real - 1, 'the real wall'), 'to the real wall');
  await must(bot, bot.walk(L1.real + 2, 'over the real wall'), 'over the real wall');
  expect(bot, L1.real, GROUND - 1, 'wall', 'a real wall stays');
  await must(bot, bot.wait(LOOK), 'looking back at it');
  await must(bot, bot.walk(L1.fake - 1, 'the picture of a wall'), 'to the picture of a wall');
  await must(bot, bot.wait(LOOK), 'looking at it');
  await must(bot, bot.walk(L1.fake + 2, 'through the picture of a wall'), 'through the picture of a wall');
  expect(bot, L1.fake, GROUND - 1, 'fake', 'the picture is still there');
  await must(bot, bot.walk(43, 'the coins'), 'the coins');
  score(bot, from, 50, 'level 1 before the exit');
  await leave(bot, bot.walk(49, 'the exit'), 'the exit');
}

/** 2. Bump, Then Bump: a wall that cracks, then crumbles. */
export async function bumpThenBump(bot: StarterBot): Promise<void> {
  const from = bot.sim.ci.score;
  await must(bot, bot.walk(L2.wallA - 1, 'the loose wall'), 'to the loose wall');
  expect(bot, L2.wallA, GROUND - 1, 'loose', 'before the bump');
  await must(bot, bot.walk(L2.wallA + 2, 'through the loose wall'), 'through the loose wall');
  await must(bot, bot.wait(LOOK), 'watching the chips');
  expect(bot, L2.wallA, GROUND - 1, 'chips', "the wall at Kit's feet");
  expect(bot, L2.wallA, GROUND - 2, 'chips', "the wall at Kit's head");
  expect(bot, L2.wallA, GROUND - 3, 'loose', 'a block above his head is never touched');
  await must(bot, bot.walk(L2.wallB - 1, 'the second wall'), 'to the second wall');
  await must(bot, bot.walk(L2.wallB + 3, 'through the second wall'), 'through the second wall');
  expect(bot, L2.wallB, GROUND - 1, 'chips', 'the near column');
  expect(bot, L2.wallB + 1, GROUND - 1, 'chips', 'the far column changes on its own');
  await must(bot, bot.walk(43, 'the coins'), 'the coins');
  score(bot, from, 90, 'level 2 before the exit');
  await leave(bot, bot.walk(49, 'the exit'), 'the exit');
}

/** 3. Coins in the Wall: walk into the wall and take what shows. */
export async function coinsInTheWall(bot: StarterBot): Promise<void> {
  const from = bot.sim.ci.score;
  await must(bot, bot.walk(L3.x - 1, 'the wall with coins in it'), 'to the wall');
  await must(bot, bot.wait(LOOK), 'looking at it');
  await must(bot, bot.walk(L3.x + L3.width + 1, 'through the wall'), 'through the wall');
  for (const [x, y] of L3.windows) expect(bot, x, y, 'sky', 'a coin taken');
  score(bot, from, 40, 'the four coins in the wall');
  await leave(bot, bot.walk(49, 'the exit'), 'the exit');
}
