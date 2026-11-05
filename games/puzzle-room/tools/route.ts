// The way through the game, as orders for the bot (kit/starter/bot.ts): the keys a person
// would press, level by level, taking every coin on the way. It acts out each lesson once, the
// mistake included, and the checks here fail unless each does what its sign says:
//   level 1: pull the first lever (counter 22 goes up by 3) and walk onto the six dotted planks: three turn
//            solid, the fourth is not there, Kit drops into the soft pool and is back at the way in with
//            no life lost. Then both levers (6) and across the six planks.
//   level 2: pull the blue lever on the path and climb to the ledge: the other blue lever (6 on counter 23), then
//            the odd red lever (1 on counter 24). Walk on to the hatch: it opens, Kit drops into the hole and
//            is back at the way in with no life lost. Then both blue levers again, not the red one: the
//            hatch stays shut under his feet, and the six blue planks hold.
import type { Result, StarterBot } from '../../kit/starter/bot';
import { ORIGIN } from '../../kit/starter/map';
import { HALF, HATCH, HATCH_CELLS, ONE, PLANKS, TWO } from '../src/wireBlocks';
import { GROUND, L1, L2, LEDGE_ROW } from '../src/levels';

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

/** After a soft drop: a link took Kit back to the way in, with every life still there. */
async function softDrop(bot: StarterBot, out: Result, lives: number, what: string): Promise<void> {
  if (out !== "link") throw new Error(`${what} should drop into the soft hole and link back; got ${out ?? 'nothing'}`);
  await must(bot, bot.wait(LOOK), 'watching the room start again');
  if (bot.sim.ci.lives !== lives) throw new Error(`${what}: lives ${lives} -> ${bot.sim.ci.lives}; a soft drop costs none`);
  if (Math.abs(bot.px.x - 60) > 24) throw new Error(`${what}: back at x ${bot.px.x}, not at the way in`);
  bot.say(`${what}: back at the way in, ${lives} lives`);
}

/** 1. Two Levers: one lever and a short bridge (a soft drop), then both levers and the whole bridge. */
export async function twoLevers(bot: StarterBot): Promise<void> {
  let score = bot.sim.ci.score;
  const lives = bot.sim.ci.lives;
  counter(bot, ONE, 0, 'before the levers');
  await must(bot, bot.walk(L1.leverA + 1, 'through the first lever'), 'into the first lever');
  await must(bot, bot.wait(LOOK), 'watching the lever');
  counter(bot, ONE, HALF, 'after one lever');
  await must(bot, bot.walk(L1.pool - 1, 'the dotted planks'), 'to the planks');
  // what THE BRIDGE NEEDS 6 teaches, once, on purpose: three planks are not enough, and the pool is soft
  await softDrop(bot, await bot.walk(L1.pool + PLANKS + 1, 'across the short bridge'), lives, 'one lever');
  counter(bot, ONE, 0, 'after the three planks');
  score = bot.sim.ci.score; // the score is kept; the room's coins are back, so count them from here
  await must(bot, bot.walk(L1.leverA + 1, 'through the first lever again'), 'into the first lever again');
  await must(bot, bot.walk(L1.ladder - 1, 'the ladder'), 'to the ladder');
  await must(bot, bot.walk(L1.ladder, 'the ladder'), 'onto the ladder');
  await must(bot, bot.climb('up', LEDGE_ROW, 'up the ladder'), 'climb');
  await must(bot, bot.walk(L1.leverB + 1, 'through the second lever'), 'into the second lever');
  await must(bot, bot.wait(LOOK), 'watching the lever');
  counter(bot, ONE, PLANKS, 'after both levers');
  await must(bot, bot.walk(L1.ledge[1] + 1, 'off the ledge'), 'off the ledge');
  await must(bot, bot.walk(L1.pool - 1, 'the dotted planks'), 'to the planks');
  await must(bot, bot.walk(L1.pool + PLANKS + 1, 'across the planks'), 'across the planks');
  counter(bot, ONE, 0, 'after the planks');
  await must(bot, bot.walk(41, 'the coins'), 'the coins');
  coins(bot, score, PLANKS + 6, 'level 1 before the exit');
  await leave(bot, bot.walk(49, 'the exit'), 'the exit');
}

/** 2. Wired Room: the blue pair and the odd red lever, a hatch that drops Kit, then the blue pair alone. */
export async function wiredRoom(bot: StarterBot): Promise<void> {
  let score = bot.sim.ci.score;
  const lives = bot.sim.ci.lives;
  counter(bot, TWO, 0, 'before the levers');
  counter(bot, HATCH, 0, 'before the red lever');
  await must(bot, bot.walk(L2.leverA + 1, 'through the first blue lever'), 'into the blue lever');
  await must(bot, bot.walk(L2.ladder - 1, 'the ladder'), 'to the ladder');
  await must(bot, bot.walk(L2.ladder, 'the ladder'), 'onto the ladder');
  await must(bot, bot.climb('up', LEDGE_ROW, 'up the ladder'), 'climb');
  await must(bot, bot.walk(L2.leverB + 1, 'through the second blue lever'), 'into the second blue lever');
  counter(bot, TWO, PLANKS, 'after both blue levers');
  // what RED LEVER OPENS THE HATCH teaches, once, on purpose: the hatch is wired to the red lever
  await must(bot, bot.walk(L2.leverC + 1, 'through the red lever'), 'into the red lever');
  counter(bot, HATCH, HATCH_CELLS, 'after the red lever');
  await must(bot, bot.walk(L2.ledge[1] + 1, 'off the ledge'), 'off the ledge');
  await must(bot, bot.walk(L2.hatch - 2, 'the hatch'), 'to the hatch');
  await softDrop(bot, await bot.walk(L2.hatch + HATCH_CELLS + 2, 'over the hatch'), lives, 'the hatch');
  counter(bot, HATCH, 0, 'after the hatch opened');
  score = bot.sim.ci.score;
  // the room starts again: this time only the blue pair (the six held over are not needed, but the hatch is shut)
  await must(bot, bot.walk(L2.leverA + 1, 'through the first blue lever again'), 'into the blue lever again');
  await must(bot, bot.walk(L2.ladder - 1, 'the ladder'), 'to the ladder');
  await must(bot, bot.walk(L2.ladder, 'the ladder'), 'onto the ladder');
  await must(bot, bot.climb('up', LEDGE_ROW, 'up the ladder'), 'climb');
  await must(bot, bot.walk(L2.leverB + 1, 'through the second blue lever again'), 'into the second blue lever again');
  await must(bot, bot.walk(L2.ladder, 'back to the ladder (not on to the red lever)'), 'back to the ladder');
  await must(bot, bot.climb('down', GROUND - 1, 'down the ladder'), 'climb down');
  await must(bot, bot.walk(L2.hatch - 1, 'the hatch'), 'to the hatch');
  await must(bot, bot.walk(L2.hatch + HATCH_CELLS + 1, 'across the shut hatch'), 'across the hatch');
  counter(bot, HATCH, 0, 'after the shut hatch');
  await must(bot, bot.walk(L2.pool - 1, 'the blue planks'), 'to the blue planks');
  await must(bot, bot.walk(L2.pool + PLANKS + 1, 'across the blue planks'), 'across the blue planks');
  await must(bot, bot.walk(57, 'the coins'), 'the coins');
  coins(bot, score, PLANKS + 4, 'level 2 before the exit');
  await leave(bot, bot.walk(59, 'the exit'), 'the exit');
}
