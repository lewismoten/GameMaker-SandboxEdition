// The way through the game, as orders for the bot (kit/starter/bot.ts): the keys a person
// would press, level by level. It acts out each lesson once, the mistake included:
//   level 1: the scene's picture and words come up (the sim turns the pages), then on the stage
//            the bot reads both signs, pushes at the right-hand wall as if it were a way out (it
//            is not), and waits: the floor flashes, opens, and the drop takes the hero on
//   level 2: the menu room: read the sign, then door one (a tale and the stage floor, then back
//            to the room), door two (the same), and the last door, which ends the game
// While it waits on a stage, every tick is checked: the floor is shut, flashes on tick
// FLOOR_AT - WARN, and is gone on tick FLOOR_AT.
import type { Result, StarterBot } from '../../kit/starter/bot';
import { LEDGE_ROW, MENU_DOORS, buildLevels } from '../src/levels';
import { FLOOR_AT, QUICK_AT, QUICK_WARN, WARN } from '../src/timing';

/** Runs an order; anything but carrying on (a scene change, getting stuck) is an error. */
async function must(bot: StarterBot, r: Promise<Result>, what: string): Promise<void> {
  const out = await r;
  if (out) throw new Error(`${what}: ${out}\n${bot.log.slice(-8).join('\n')}`);
}

/** The last order of a scene: it must take the hero through a link (to another scene or the ending). */
async function leave(bot: StarterBot, r: Promise<Result>, what: string): Promise<void> {
  const out = await r;
  if (out !== 'link' && out !== 'end') throw new Error(`${what}: ${out ?? 'still here'}\n${bot.log.slice(-8).join('\n')}`);
}

const { book } = buildLevels();

/** What block kind a map cell of `name` is showing right now. */
function showing(bot: StarterBot, name: string): string {
  const shown = bot.sim.w.blkmap[book.n(name)];
  for (const [n, i] of book.index) if (i === shown) return n;
  return '?';
}

/** Waits out a stage: the floor must flash on tick FLOOR_AT - WARN and open on FLOOR_AT, and the drop must take the hero on. */
async function waitStage(bot: StarterBot, what: string, kind: 'trap' | 'quick'): Promise<void> {
  const [at, warn] = kind === 'trap' ? [FLOOR_AT, WARN] : [QUICK_AT, QUICK_WARN];
  const shut = `${kind}.shut`;
  if (showing(bot, shut) !== shut) throw new Error(`${what}: the floor should start shut`);
  for (let i = 0; i < at && showing(bot, shut) === shut; i++) await must(bot, bot.wait(1), `${what}: waiting for the floor to flash`);
  const warnAt = bot.sim.ticks; // the scene's clock starts at 0 when it loads
  if (showing(bot, shut) !== `${kind}.warn` || Math.abs(warnAt - (at - warn)) > 2)
    throw new Error(`${what}: the floor should flash at tick ${at - warn}, not ${warnAt}`);
  bot.say(`${what}: the floor flashes at tick ${warnAt}`);
  await leave(bot, bot.wait(300), `${what}: the drop`);
  bot.say(`${what}: the drop took the hero on`);
}

/** 1. A Scene That Moves On: read, push at the wall, wait. */
export async function sceneThatMovesOn(bot: StarterBot): Promise<void> {
  await must(bot, bot.walk(4, 'the first sign'), 'to the first sign');
  await must(bot, bot.wait(60), 'reading the sign');
  await must(bot, bot.walk(10, 'the second sign'), 'to the second sign');
  await must(bot, bot.wait(70), 'reading the sign');
  // the mistake: the right-hand wall looks like a way on, and it is not
  bot.sim.press(77);
  await must(bot, bot.wait(40), 'pushing at the wall');
  bot.sim.release(77);
  if (bot.px.x < 12 * 20) throw new Error('the hero should have walked to the right-hand wall');
  await waitStage(bot, 'level 1', 'trap');
}

/** 2. A Menu Room: three doors. Doors one and two show a tale and come back; the third ends the game. */
export async function aMenuRoom(bot: StarterBot): Promise<void> {
  await must(bot, bot.walk(7, 'the first sign'), 'to the sign');
  await must(bot, bot.wait(60), 'reading the sign');
  const goTo = async (n: number, what: string) => {
    await must(bot, bot.walk(MENU_DOORS[n] - 2, `the ladder to ${what}`), `to the ladder of ${what}`);
    await must(bot, bot.climb('up', LEDGE_ROW - 1, `up to ${what}`), `up to ${what}`);
    await leave(bot, bot.walk(MENU_DOORS[n], what), what);
  };
  await goTo(0, 'door one');
  await waitStage(bot, 'tale one', 'quick');
  await goTo(1, 'door two');
  await waitStage(bot, 'tale two', 'quick');
  await goTo(2, 'the last door');
}
