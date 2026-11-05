// The way through the game, as orders for the bot (kit/starter/bot.ts): the keys a person
// would press, level by level, taking every coin on the way. It acts out each lesson once and the
// checks here fail unless each does what its sign says:
//   level 1: fall into the pit, find he cannot climb out, touch the post (the level starts over: the
//            coin is back, the score stays, he is at the way in), then jump the pit
//   level 2: fall into each of three pits for its coin and climb out again: a ladder, planks, solid blocks
import type { Result, StarterBot } from '../../kit/starter/bot';
import { SCAN } from '../../kit/starter/ids';
import { ORIGIN } from '../../kit/starter/map';
import { DEPTH, GROUND, L1, L2, buildLevels } from '../src/levels';

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

/** A running jump: Right held down, Space tapped a moment later, Right held until he is past column `to`. */
async function runJump(bot: StarterBot, to: number): Promise<void> {
  bot.sim.press(SCAN.right);
  await must(bot, bot.wait(1), 'taking a run');
  bot.sim.press(SCAN.space);
  await must(bot, bot.wait(2), 'leaving the ground');
  bot.sim.release(SCAN.space);
  for (let t = 0; t < 90 && bot.px.x < to * 20; t++) await must(bot, bot.wait(1), 'in the air');
  bot.sim.release(SCAN.right);
  await must(bot, bot.land(), 'landing');
  bot.say(`ran and jumped to ${Math.round(bot.px.x / 20)}`);
}

/** A person's look at what just happened, in ticks (about a second and a half). */
const LOOK = 40;
const FLOOR = GROUND + DEPTH - 1;

/** 1. A Post to Start Over: fall in, learn there is no climbing out, touch the post, then jump the pit. */
export async function aPostToStartOver(bot: StarterBot): Promise<void> {
  const from = bot.sim.ci.score;
  await must(bot, bot.walk(L1.pit + 1, 'off the edge'), 'into the pit');
  await must(bot, bot.land(), 'landing');
  if (bot.px.y < FLOOR * 20) throw new Error(`he did not fall to the bottom of the pit (y ${bot.px.y})`);
  await must(bot, bot.walk(L1.coin, 'the coin'), 'the coin in the pit');
  score(bot, from, 10, 'the coin in the pit');
  // try to get out: jump from the pit's wall, three times
  for (let i = 0; i < 3; i++) {
    await must(bot, bot.walk(L1.pit, 'to the wall'), 'to the pit wall');
    await must(bot, bot.jump('left', L1.pit - 1), 'jumping at the wall');
  }
  if (bot.px.y < FLOOR * 20) throw new Error('he climbed out of the pit: it is not deep enough to need a post');
  bot.say('he cannot climb out');
  await must(bot, bot.wait(LOOK), 'looking up');
  const scenes = bot.sim.trail.length;
  await leave(bot, bot.walk(L1.post, 'the post'), 'touching the post');
  if (bot.sim.trail.length !== scenes + 1) throw new Error('touching the post did not enter a scene');
  await must(bot, bot.wait(2), 'the level starts again');
  expect(bot, L1.coin, FLOOR, 'coin', 'the coin is back after starting over');
  if (bot.px.x > 8 * 20) throw new Error(`he is not at the way in after the post (x ${bot.px.x})`);
  if (bot.sim.ci.score - from !== 10) throw new Error('the score did not stay after starting over');
  await must(bot, bot.walk(L1.pit - 1, 'to the pit'), 'to the pit');
  await runJump(bot, L1.pit + L1.width + 1);
  if (bot.px.y > (GROUND - 1) * 20) throw new Error('he did not land across the pit');
  await leave(bot, bot.walk(49, 'the exit'), 'the exit');
}

/** Falls into the pit at `pit` and takes its coin, then climbs out by `out`, and walks on to column `on`. */
async function pitAndOut(bot: StarterBot, pit: number, coin: number, out: () => Promise<void>, on: number): Promise<void> {
  const from = bot.sim.ci.score;
  await must(bot, bot.walk(pit + 1, 'off the edge'), 'into the pit');
  await must(bot, bot.land(), 'landing');
  await must(bot, bot.walk(coin, 'the coin'), 'the coin in the pit');
  score(bot, from, 10, 'the coin in the pit');
  await out();
  if (bot.px.y > (GROUND - 1) * 20) throw new Error(`he is still in the pit at ${pit} (y ${bot.px.y})`);
  await must(bot, bot.walk(on, 'on'), 'on');
}

/** 2. Ways Back: a ladder, planks and solid blocks each lead out of a pit. */
export async function waysBack(bot: StarterBot): Promise<void> {
  const { ladder, steps, stairs } = L2;
  await must(bot, bot.walk(ladder.pit - 1, 'to the first pit'), 'to the first pit');
  await pitAndOut(
    bot,
    ladder.pit,
    ladder.pit + 1,
    async () => {
      await must(bot, bot.walk(ladder.rungs, 'to the ladder'), 'to the ladder');
      await must(bot, bot.climb('up', GROUND - 1, 'up the ladder'), 'up the ladder');
      await must(bot, bot.walk(ladder.rungs + 2, 'off the ladder'), 'off the ladder');
    },
    steps.pit - 1,
  );
  await pitAndOut(
    bot,
    steps.pit,
    steps.pit + 1,
    async () => {
      await must(bot, bot.walk(steps.low[0], 'under the plank'), 'under the plank');
      await must(bot, bot.jump('right', steps.low[1]), 'up through the plank');
      await must(bot, bot.jump('right', steps.high + 1), 'up through the top plank');
    },
    stairs.pit - 1,
  );
  await pitAndOut(
    bot,
    stairs.pit,
    stairs.pit + 1,
    async () => {
      await must(bot, bot.walk(stairs.short - 1, 'to the first step'), 'to the first step');
      await must(bot, bot.jump('right', stairs.short), 'onto the first step');
      await must(bot, bot.jump('right', stairs.tall), 'onto the second step');
      await must(bot, bot.jump('right', stairs.tall + 1), 'onto the ground');
    },
    44,
  );
  await leave(bot, bot.walk(49, 'the exit'), 'the exit');
}
