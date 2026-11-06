// The way through the game, as orders for the bot (kit/starter/bot.ts): the keys a person would press, level by
// level. Each level walks to its gate or door. Level 2 also measures what its signs say: the first scene's steps
// are the same size as up close, so the tiny Kit crosses at the speed of the big one (the mistake), and the second
// scene's small, slow steps take more than twice as long over the same ground.
import type { Result, StarterBot } from '../../kit/starter/bot';
import { FAR_GATE, LAND_X, NEAR_GATE } from '../src/levels';

/** Runs an order; anything but carrying on (a scene change, getting stuck) is an error. */
async function must(bot: StarterBot, r: Promise<Result>, what: string): Promise<void> {
  const out = await r;
  if (out) throw new Error(`${what}: ${out}\n${bot.log.slice(-8).join('\n')}`);
}

/** The scene the hero is in now. */
const here = (bot: StarterBot): number => bot.sim.trail[bot.sim.trail.length - 1];

/** An order that must take the hero through a link; then he settles on the cell it lands him on (column LAND_X, feet row 5) unless that was the end. */
async function leave(bot: StarterBot, r: Promise<Result>, what: string, end = false): Promise<void> {
  const from = here(bot);
  const out = await r;
  if (out !== 'link' && out !== 'end') throw new Error(`${what}: ${out ?? 'still here'}\n${bot.log.slice(-8).join('\n')}`);
  bot.say(`through ${what}`);
  if (end) return;
  if (here(bot) === from) throw new Error(`${what} did not change the scene`);
  await must(bot, bot.land(), `landing after ${what}`);
  const want = { x: LAND_X * 20, y: 5 * 20 };
  const got = bot.px;
  if (got.x !== want.x || got.y !== want.y) throw new Error(`after ${what} the hero stood at ${got.x},${got.y}, not at ${want.x},${want.y}`);
}

/** Counts the ticks the bot plays from now on. */
function ticker(bot: StarterBot): () => number {
  let n = 0;
  const tick = bot.tick.bind(bot);
  bot.tick = async () => {
    n++;
    return tick();
  };
  return () => n;
}

/** 1. Up Close: the near Kit walks to the door. */
export async function upClose(bot: StarterBot): Promise<void> {
  await leave(bot, bot.walk(NEAR_GATE, 'the door'), 'the door');
}

/** Ticks the quick scene took, for the slow scene to be compared with. */
let quickTicks = 0;

/** 2. Far Away: the quick scene (big steps), then the slow one (small steps, twice as long). */
export async function farAway(bot: StarterBot): Promise<void> {
  const ticks = ticker(bot);
  await leave(bot, bot.walk(FAR_GATE, 'the first gate'), 'the first gate');
  quickTicks = ticks();
  const mark = ticks();
  await leave(bot, bot.walk(FAR_GATE, 'the second gate'), 'the second gate');
  const slowTicks = ticks() - mark;
  bot.say(`quick ${quickTicks} ticks, slow ${slowTicks} ticks`);
  if (slowTicks < quickTicks * 2) throw new Error(`the slow steps took ${slowTicks} ticks against ${quickTicks}: not more than twice as long`);
}

/** 3. Big Things in Front: the tiny Kit walks behind the big fence and flowers to the gate. */
export async function bigThings(bot: StarterBot): Promise<void> {
  await leave(bot, bot.walk(FAR_GATE, 'the last gate'), 'the last gate', true);
}
