// Small orders every level's route shares: run an order and fail on anything unexpected, leave through a door,
// read a sign like a person, jump a hazard, and check what a level scored.
import type { Result, StarterBot } from '../../kit/starter/bot';
import { SCAN } from '../../kit/starter/ids';
import { ORIGIN } from '../../kit/starter/map';
import { CHARM_POINTS } from '../src/props';

/** Runs an order; anything but carrying on (a scene change, getting stuck) is an error. */
export async function must(bot: StarterBot, r: Promise<Result>, what: string): Promise<void> {
  const hp = bot.sim.ci.hitpts;
  const out = await r;
  if (bot.sim.ci.hitpts !== hp) bot.say(`hit points ${hp} -> ${bot.sim.ci.hitpts} during ${what}`);
  if (out) throw new Error(`${what}: ${out}\n${bot.log.slice(-8).join('\n')}`);
}

/** The last order of a level: it must take the hero through the door (to the next level or the ending). */
export async function leave(bot: StarterBot, r: Promise<Result>, what: string): Promise<void> {
  const out = await r;
  if (out !== 'link' && out !== 'end') throw new Error(`${what}: ${out ?? 'still here'}\n${bot.log.slice(-8).join('\n')}`);
}

/** A person's look at a sign, in ticks (about four seconds). */
export const READ = 70;

/** Walks to `col` and reads the sign beside it. */
export async function readAt(bot: StarterBot, col: number, what: string): Promise<void> {
  await must(bot, bot.walk(col, what), `to ${what}`);
  await must(bot, bot.wait(READ), `reading ${what}`);
}

/** Jumps the hazards at `col` .. `col + n - 1` from two blocks before, landing past them with every hit point. */
export async function hop(bot: StarterBot, col: number, n = 1, what = 'the hazard'): Promise<void> {
  const hp = bot.sim.ci.hitpts;
  await must(bot, bot.walk(col - 2, what), `to ${what}`);
  await must(bot, bot.jump('right', col + n + 1), `over ${what}`);
  if (bot.sim.ci.hitpts !== hp) throw new Error(`${what} hurt: hit points ${hp} -> ${bot.sim.ci.hitpts}`);
}

/** Climbs the ladder in column `col` up to level row `row` (its top block), starting from the ground beside it. */
export async function climbUp(bot: StarterBot, col: number, row: number, what: string): Promise<void> {
  await must(bot, bot.walk(col + 1, what), `beside ${what}`);
  await must(bot, bot.walk(col, what), `onto ${what}`);
  await must(bot, bot.climb('up', row, `up ${what}`), `up ${what}`);
}

/** What a level's score should be: `charms` at 13 each, plus `extra` points. */
export function score(bot: StarterBot, from: number, charms: number, extra: number, what: string): void {
  const want = charms * CHARM_POINTS + extra;
  const got = bot.sim.ci.score - from;
  if (got !== want) throw new Error(`${what}: scored ${got}, expected ${want} (${charms} charms and ${extra} more)`);
}

/** Runs `fn` with the bot's Left and Right keys swapped, as the mirror's character file swaps them: the bot still means "walk right" and the cat does it on the other key. */
export async function mirrored<T>(bot: StarterBot, fn: () => Promise<T>): Promise<T> {
  const sim = bot.sim;
  const swap = (k: number) => (k === SCAN.left ? SCAN.right : k === SCAN.right ? SCAN.left : k);
  const { press, release } = sim;
  sim.press = (k: number) => press.call(sim, swap(k));
  sim.release = (k: number) => release.call(sim, swap(k));
  try {
    return await fn();
  } finally {
    sim.press = press;
    sim.release = release;
  }
}

/** A monster's top edge in level pixels: the one that started in column `x0` of the map. */
export function monsterY(bot: StarterBot, x0: number): number {
  const w = bot.sim.w;
  const i = w.mm.findIndex((m) => m.curx - ORIGIN === x0);
  if (i < 0) throw new Error(`no monster starts in column ${x0}`);
  return (w.mi[i].cury[0] - ORIGIN) * 20 + w.mi[i].cury[1];
}

/** Waits like a person watching: ticks until `ready()` holds (a crow flew up, say). */
export async function watchFor(bot: StarterBot, ready: () => boolean, what: string, max = 600): Promise<void> {
  for (let t = 0; t < max; t++) {
    if (ready()) return;
    await must(bot, bot.wait(1), what);
  }
  throw new Error(`never saw ${what}`);
}
