// The way through the game, as orders for the bot (kit/starter/bot.ts): the keys a person
// would press, level by level, taking every coin on the way. It acts out each lesson once, the
// mistake included, and the checks here fail unless each does what its sign says:
//   level 1: walk into the lever (the red counter goes up by six), then across the six dotted planks
//            (each takes one off the counter and turns solid, and the counter is back to empty)
//   level 2: walk through the blue lever on the path (the blue counter goes up), go on to the red
//            planks with the red counter still empty and fall in the pool (a life, the room starts again),
//            climb the ladder to the red lever, cross the red planks, then the blue planks (the blue
//            counter was already paid for)
import type { Result, StarterBot } from '../../kit/starter/bot';
import { ORIGIN } from '../../kit/starter/map';
import { BLUE, PLANKS, RED } from '../src/switchBlocks';
import { L1, L2, LEDGE_ROW } from '../src/levels';

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

/** A counter holds one more than it shows: what it should hold with `n` planks paid for. */
const paid = (n: number) => 1 + n;

function counter(bot: StarterBot, which: number, want: number, what: string): void {
  const got = bot.sim.ci.meter[which];
  if (got !== paid(want)) throw new Error(`${what}: counter ${which} holds ${got - 1}, expected ${want}`);
  bot.say(`${what}: counter ${which} holds ${want}`);
}

/** A person's look at what just happened, in ticks (about a second and a half). */
const LOOK = 40;

/** 1. Pull the Lever: into the lever, then across the six planks. */
export async function pullTheLever(bot: StarterBot): Promise<void> {
  const score = bot.sim.ci.score;
  counter(bot, RED, 0, 'before the lever');
  await must(bot, bot.walk(L1.lever - 1, 'the lever'), 'to the lever');
  await must(bot, bot.walk(L1.lever + 1, 'through the lever'), 'into the lever');
  await must(bot, bot.wait(LOOK), 'watching the lever');
  counter(bot, RED, PLANKS, 'after the lever');
  await must(bot, bot.walk(L1.pool - 1, 'the dotted planks'), 'to the planks');
  await must(bot, bot.walk(L1.pool + PLANKS + 1, 'across the planks'), 'across the planks');
  counter(bot, RED, 0, 'after the planks');
  await must(bot, bot.walk(38, 'the coins'), 'the coins');
  coins(bot, score, PLANKS + 5, 'level 1 before the exit');
  await leave(bot, bot.walk(45, 'the exit'), 'the exit');
}

/** 2. Red and Blue: the blue lever, a fall at the red planks, the red lever up the ladder, both bridges. */
export async function redAndBlue(bot: StarterBot): Promise<void> {
  let score = bot.sim.ci.score;
  const lives = bot.sim.ci.lives;
  const deaths = bot.sim.deaths;
  await must(bot, bot.walk(L2.blueLever + 1, 'through the blue lever'), 'into the blue lever');
  counter(bot, BLUE, PLANKS, 'after the blue lever');
  await must(bot, bot.walk(L2.redPool - 1, 'the red planks'), 'to the red planks');
  // what RED PLANKS WANT RED teaches, once, on purpose: the blue counter does not pay for red planks
  const out = await bot.walk(L2.redPool + 3, 'onto the red planks');
  if (out !== 'dead') throw new Error(`walking onto the red planks with only the blue lever pulled should cost a life; got ${out ?? 'nothing'}`);
  await must(bot, bot.wait(LOOK), 'watching the room start again');
  if (bot.sim.deaths !== deaths + 1) throw new Error('the pool should cost exactly one life');
  if (bot.sim.ci.lives !== lives - 1) throw new Error(`lives ${lives} -> ${bot.sim.ci.lives}, expected one less`);
  if (Math.abs(bot.px.x - 60) > 24) throw new Error(`back at x ${bot.px.x}, not at the way in`);
  score = bot.sim.ci.score; // the score is kept; the room's coins are back, so count them from here
  bot.say(`fell in the pool: lives ${lives} -> ${bot.sim.ci.lives}, back at x ${bot.px.x}`);
  // a counter keeps its number when a life is lost, but the room starts again with its lever back: pulled again on the way, it
  // pays six more, so six planks' worth of blue is left over after the blue bridge. Then up the ladder for the red lever.
  counter(bot, BLUE, PLANKS, 'after the fall');
  await must(bot, bot.walk(L2.ladder - 1, 'the ladder'), 'to the ladder');
  counter(bot, BLUE, 2 * PLANKS, 'after the blue lever again');
  await must(bot, bot.walk(L2.ladder, 'the ladder'), 'onto the ladder');
  await must(bot, bot.climb('up', LEDGE_ROW, 'up the ladder'), 'climb');
  await must(bot, bot.walk(L2.redLever + 1, 'through the red lever'), 'into the red lever');
  counter(bot, RED, PLANKS, 'after the red lever');
  await must(bot, bot.walk(L2.ledge[1] + 1, 'off the ledge'), 'off the ledge');
  await must(bot, bot.walk(L2.redPool - 1, 'the red planks'), 'to the red planks');
  await must(bot, bot.walk(L2.redPool + PLANKS + 1, 'across the red planks'), 'across the red planks');
  counter(bot, RED, 0, 'after the red planks');
  await must(bot, bot.walk(L2.bluePool - 1, 'the blue planks'), 'to the blue planks');
  await must(bot, bot.walk(L2.bluePool + PLANKS + 1, 'across the blue planks'), 'across the blue planks');
  counter(bot, BLUE, PLANKS, 'after the blue planks (six left over from the lever pulled twice)');
  await must(bot, bot.walk(53, 'the coins'), 'the coins');
  coins(bot, score, 13, 'level 2 before the exit');
  await leave(bot, bot.walk(55, 'the exit'), 'the exit');
}
