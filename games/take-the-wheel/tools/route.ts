// The way through the game, as orders for the bot (kit/starter/bot.ts): the keys a person
// would press, level by level. Each sign's lesson is acted out, the mistake included, once: in the
// kart Kit drives into the first bird and cannot get past (Space does not jump), then honks. The checks here fail if anything else happens.
import { SCAN } from '../../kit/starter/ids';
import type { Result, StarterBot } from '../../kit/starter/bot';
import { ORIGIN } from '../../kit/starter/map';
import { BIRD, FLY, HONK } from '../src/monsters';
import { L1_BIRD, L2_BIRDS } from '../src/levels';

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

/** A person stopped at a sign for a moment to read it. */
const READ = 40;

/** 1. Hop In: on foot Kit jumps the bird (the bot's walk jumps when blocked), then walks into the kart. */
export async function hopIn(bot: StarterBot): Promise<void> {
  await must(bot, bot.walk(8, 'the first sign'), 'to the first sign');
  await must(bot, bot.wait(READ), 'reading');
  await must(bot, bot.walk(17, 'the bird sign'), 'to the bird sign');
  await must(bot, bot.wait(READ), 'reading');
  if (alive(bot, BIRD) !== 1) throw new Error('level 1: expected one bird in the road');
  await must(bot, bot.walk(L1_BIRD - 1.5, 'the bird'), 'to the bird');
  await must(bot, bot.jump('right', L1_BIRD + 2), 'jumping the bird');
  await must(bot, bot.walk(L1_BIRD + 3, 'past the bird'), 'past the bird');
  if (bot.px.x < (L1_BIRD + 1) * 20) throw new Error('level 1: Kit should have jumped over the bird');
  if (alive(bot, BIRD) !== 1) throw new Error('level 1: the bird should still be there; Kit jumped it');
  await must(bot, bot.walk(37, 'the kart sign'), 'to the kart sign');
  await must(bot, bot.wait(READ), 'reading');
  await leave(bot, bot.walk(43, 'the kart'), 'the kart');
}

/** Holds Right for `ticks` and says how far Kit got. */
async function push(bot: StarterBot, ticks: number): Promise<number> {
  const x0 = bot.px.x;
  bot.sim.press(SCAN.right);
  await must(bot, bot.wait(ticks), 'pushing');
  bot.sim.release(SCAN.right);
  await must(bot, bot.land(), 'stopping');
  return bot.px.x - x0;
}

/** Honk once, like a person: a tap of Space, then a look. */
async function honk(bot: StarterBot): Promise<void> {
  bot.sim.press(SCAN.space);
  await must(bot, bot.wait(3), 'honking');
  bot.sim.release(SCAN.space);
}

/** 2. Take the Wheel: drive; the first bird stops the kart (the mistake), a honk pops it, the second bird goes at the first honk. */
export async function takeTheWheel(bot: StarterBot): Promise<void> {
  await must(bot, bot.walk(8, 'the first sign'), 'to the first sign');
  await must(bot, bot.wait(READ), 'reading');
  await must(bot, bot.walk(13, 'the no jump sign'), 'to the no-jump sign');
  await must(bot, bot.wait(READ), 'reading');
  await must(bot, bot.walk(17, 'the honk sign'), 'to the honk sign');
  await must(bot, bot.wait(READ), 'reading');
  const [b1] = L2_BIRDS;
  if (alive(bot, BIRD) !== 2) throw new Error('level 2: expected two birds');
  // the mistake: drive into the bird; a kart cannot jump it
  bot.sim.press(SCAN.right);
  await must(bot, bot.wait(60), 'driving into the bird');
  const stopped = bot.px.x;
  await must(bot, bot.wait(20), 'still pushing');
  bot.sim.release(SCAN.right);
  if (bot.px.x > stopped + 8) throw new Error('level 2: the kart crept past the bird');
  if (stopped > b1 * 20 + 2) throw new Error(`level 2: the kart passed the bird (x ${stopped})`);
  bot.say('the kart is stopped by the bird');
  await must(bot, bot.wait(30), 'a look at the bird');
  // the fix: honk once more with the kart standing still, and the bird flies off
  await honk(bot);
  await must(bot, bot.wait(30), 'the honk flying');
  if (alive(bot, BIRD) !== 1) throw new Error(`level 2: a honk should clear one bird; ${alive(bot, BIRD)} left`);
  if (alive(bot, FLY) < 1) throw new Error('level 2: the bird should be flying away');
  await must(bot, bot.walk(28, 'the second sign'), 'to the second sign');
  await must(bot, bot.wait(READ), 'reading');
  const moved = await push(bot, 60);
  if (moved > (L2_BIRDS[1] - 28) * 20) throw new Error('level 2: the kart passed the second bird');
  await honk(bot);
  await must(bot, bot.wait(30), 'the honk flying');
  if (alive(bot, BIRD) !== 0) throw new Error('level 2: both birds should be gone');
  if (alive(bot, HONK) > 0) await must(bot, bot.wait(30), 'the honk fading');
  await must(bot, bot.wait(READ), 'watching the bird go');
  await leave(bot, bot.walk(43, 'the exit'), 'the exit');
}

export { ORIGIN };
