// The way through the game, as orders for the bot (kit/starter/bot.ts): the keys a person
// would press, level by level, taking every coin on the way. It acts out each lesson once and the
// checks here fail unless each does what its sign says:
//   level 1: the picture does not scroll: Kit walks to the hedge at the far left and is stopped by it, and the
//            view (the engine's top-left block and pixel offset) is where it started the whole time
//   level 2: the picture follows: by the exit door the view has moved the length of the level
import type { Result, StarterBot } from '../../kit/starter/bot';
import { SCAN } from '../../kit/starter/ids';
import { ORIGIN } from '../../kit/starter/map';
import { L1, L2, SCREEN } from '../src/levels';

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

/** The view's top-left block and pixel offset: [column, row, offset x, offset y]. */
const view = (bot: StarterBot) => [bot.sim.w.mx, bot.sim.w.my, bot.sim.w.scroll.nx, bot.sim.w.scroll.ny];

/** The view is where level `col`, `row` is at the top left. */
function expectView(bot: StarterBot, col: number, row: number, what: string): void {
  const got = view(bot).join(',');
  const want = [ORIGIN + col, ORIGIN + row, 0, 0].join(',');
  if (got !== want) throw new Error(`${what}: the view is at ${got}, expected ${want}`);
}

/** 1. One Screen: nothing scrolls. Kit walks left to the hedge, bumps it, then walks to the door. */
export async function oneScreen(bot: StarterBot): Promise<void> {
  const from = bot.sim.ci.score;
  expectView(bot, 0, 0, 'at the start the screen is the whole room');
  await must(bot, bot.walk(1, 'the hedge on the left'), 'to the left hedge');
  // keep walking into the hedge for a moment: he stays put, and so does the picture
  bot.sim.press(SCAN.left);
  await must(bot, bot.wait(LOOK), 'leaning on the hedge');
  bot.sim.release(SCAN.left);
  if (bot.px.x > 1 * 20 + 4) throw new Error(`Kit walked through the hedge to ${bot.px.x}`);
  expectView(bot, 0, 0, 'after leaning on the hedge');
  bot.say('the hedge stopped Kit and the picture stayed');
  await must(bot, bot.walk(L1.exit - 1, 'the far side of the room'), 'across the room');
  expectView(bot, 0, 0, 'at the far side of the room');
  score(bot, from, 10 * L1.coins.length, 'level 1 before the exit');
  await leave(bot, bot.walk(L1.exit, 'the exit'), 'the exit');
}

/** 2. The View Follows: a long walk; the picture moves with him. */
export async function theViewFollows(bot: StarterBot): Promise<void> {
  const from = bot.sim.ci.score;
  const first = bot.sim.w.mx;
  await must(bot, bot.walk(L2.coins[0] - 1, 'the first coins'), 'to the first coins');
  const moved = bot.sim.w.mx - first;
  if (moved < 3) throw new Error(`the view only moved ${moved} blocks by column ${L2.coins[0]}`);
  await must(bot, bot.walk(L2.exit - 2, 'the far end'), 'to the far end');
  const total = bot.sim.w.mx - first;
  if (total < L2.exit - SCREEN.w) throw new Error(`the view moved ${total} blocks and the level is ${L2.exit} long`);
  bot.say(`the view moved ${total} blocks`);
  score(bot, from, 10 * L2.coins.length, 'the coins along the way');
  await leave(bot, bot.walk(L2.exit, 'the exit'), 'the exit');
}
