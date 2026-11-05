// The way through the game, as orders for the bot (kit/starter/bot.ts): the keys a person would press, level by level.
// The sky is the lesson, so the bot stops under it and counts what the stars do, tick by tick, from the blocks the engine
// shows:
//   level 1: under the first sky every star is at the same frame every tick (it blinks all at once); under the second,
//            at no tick are they all at the same frame, and never more than a part of them are bright together
//   level 2: the night scene's sky is the second kind, all the way along
import type { Result, StarterBot } from '../../kit/starter/bot';
import { buildLevels } from '../src/levels';

/** A person's look at what just happened, in ticks (about a second and a half). */
const LOOK = 40;
const { levels } = buildLevels();
/** How bright each frame of a loop is (a dim dot, a glint, bright, a glint). */
const SIZE = [0, 1, 2, 1];

async function must(bot: StarterBot, r: Promise<Result>, what: string): Promise<void> {
  const out = await r;
  if (out) throw new Error(`${what}: ${out}\n${bot.log.slice(-8).join('\n')}`);
}

/** The last order of a level: it must take the hero through the door (to the next level or the ending). */
async function leave(bot: StarterBot, r: Promise<Result>, what: string): Promise<void> {
  const out = await r;
  if (out !== 'link' && out !== 'end') throw new Error(`${what}: ${out ?? 'still here'}\n${bot.log.slice(-8).join('\n')}`);
}

/** How bright each star in the screen's view is right now (its frame's size), for the stars of `set` within 8 blocks of the hero. */
function brightness(bot: StarterBot, level: number, set: 'sync' | 'star'): number[] {
  const { book, stars } = levels[level];
  const x = bot.sim.pos.x - 10;
  const out: number[] = [];
  for (const s of stars) {
    if (s.set !== set || Math.abs(s.x - x) > 8) continue;
    const shown = bot.sim.w.blkmap[book.n(`${s.set}${s.spot}.${s.start}`)];
    const name = [...book.index.keys()][shown];
    out.push(SIZE[Number(name.slice(-1))]);
  }
  return out;
}

/** Watches the sky for `ticks` and counts the ticks at which every star in view was at the same frame, and the most that were bright at once. */
async function watch(
  bot: StarterBot,
  level: number,
  set: 'sync' | 'star',
  ticks: number,
): Promise<{ together: number; brightest: number; seen: Set<number>; stars: number }> {
  let together = 0;
  let brightest = 0;
  const seen = new Set<number>();
  let stars = 0;
  for (let t = 0; t < ticks; t++) {
    const b = brightness(bot, level, set);
    stars = b.length;
    if (b.length > 1 && b.every((v) => v === b[0])) together++;
    brightest = Math.max(brightest, b.filter((v) => v === 2).length / Math.max(1, b.length));
    b.forEach((v) => seen.add(v));
    await must(bot, bot.tick(), 'watching the sky');
  }
  return { together, brightest, seen, stars };
}

/** 1. All at Once: the first sky blinks together; the second does not. */
export async function allAtOnce(bot: StarterBot): Promise<void> {
  await must(bot, bot.wait(20), 'a beat');
  await must(bot, bot.walk(12, 'under the first sky'), 'to the first sky');
  const wrong = await watch(bot, 0, 'sync', 130);
  if (wrong.stars < 4) throw new Error(`the first sky should have stars in view, not ${wrong.stars}`);
  if (wrong.together !== 130) throw new Error(`under the first sky every star should be at the same frame at every tick, not ${wrong.together} of 130`);
  if (wrong.seen.size < 3) throw new Error('the first sky should blink');
  bot.say(`the first sky: ${wrong.stars} stars, all at the same frame all ${wrong.together} ticks`);
  await must(bot, bot.walk(27, 'the sign'), 'to the middle sign');
  await must(bot, bot.wait(LOOK), 'reading');
  await must(bot, bot.walk(38, 'under the second sky'), 'to the second sky');
  const right = await watch(bot, 0, 'star', 200);
  if (right.stars < 4) throw new Error(`the second sky should have stars in view, not ${right.stars}`);
  if (right.together > 5) throw new Error(`under the second sky the stars should not be at the same frame together; they were at ${right.together} ticks`);
  if (right.brightest > 0.7) throw new Error(`under the second sky no more than ${Math.round(right.brightest * 100)}% of the stars should be bright at once`);
  bot.say(`the second sky: ${right.stars} stars, together at ${right.together} of 200 ticks, at most ${Math.round(right.brightest * 100)}% bright at once`);
  await must(bot, bot.walk(46, 'the last sign'), 'to the last sign');
  await must(bot, bot.wait(LOOK), 'reading');
  await leave(bot, bot.walk(53, 'the door'), 'the door');
}

/** 2. A Night Sky: under the second sky all the way to the door. */
export async function nightSky(bot: StarterBot): Promise<void> {
  await must(bot, bot.wait(20), 'a beat');
  await must(bot, bot.walk(8, 'the first sign'), 'to the first sign');
  await must(bot, bot.wait(LOOK), 'reading');
  await must(bot, bot.walk(27, 'the second sign'), 'to the second sign');
  const sky = await watch(bot, 1, 'star', 200);
  if (sky.together > 5) throw new Error(`the night sky's stars should not be at the same frame together; they were at ${sky.together} ticks`);
  if (sky.stars < 4) throw new Error(`the night sky should have stars in view, not ${sky.stars}`);
  bot.say(`the night sky: ${sky.stars} stars, together at ${sky.together} of 200 ticks`);
  await must(bot, bot.walk(46, 'under the moon'), 'under the moon');
  await must(bot, bot.wait(LOOK), 'looking at the moon');
  await leave(bot, bot.walk(57, 'the door'), 'the door');
}
