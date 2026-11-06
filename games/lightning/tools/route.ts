// The way through the game, as orders for the bot (kit/starter/bot.ts): the keys a person would press, level by level.
// The flash is the lesson, so at each sign the bot waits for one and counts, tick by tick from the blocks the engine
// shows, that the sky, the bolt (and level 2's stones) turn lit in the same tick, stay lit LIT ticks and dark DARK.
//   level 1: a flash at each of the three signs, then the door
//   level 2: the signs; then the mistake: walking on in the dark, Lena drops into the ditch (nothing hurts) and walks
//            back up the step; then she waits for a flash and jumps from stone to stone
import type { Result, StarterBot } from '../../kit/starter/bot';
import { GROUND, buildLevels } from '../src/levels';
import { BOLT, DARK, LIT } from '../src/storm';

/** A person's look at what just happened, in ticks (about a second and a half). */
const LOOK = 30;
const { levels } = buildLevels();

async function must(bot: StarterBot, r: Promise<Result>, what: string): Promise<void> {
  const out = await r;
  if (out) throw new Error(`${what}: ${out}\n${bot.log.slice(-8).join('\n')}`);
}

/** The last order of a level: it must take the hero through the door (to the next level or the ending). */
async function leave(bot: StarterBot, r: Promise<Result>, what: string): Promise<void> {
  const out = await r;
  if (out !== 'link' && out !== 'end') throw new Error(`${what}: ${out ?? 'still here'}\n${bot.log.slice(-8).join('\n')}`);
}

/** Whether each timed dark block of the level shows its lit twin now. */
function litNow(bot: StarterBot, level: number): boolean[] {
  const { book, timed } = levels[level];
  return timed.filter((t) => !t.name.endsWith('.lit')).map((t) => bot.sim.w.blkmap[book.n(t.name)] === book.n(t.next));
}

/** Waits (at most a round and a bit) for the next flash and watches it through: every block lit in the same tick, for LIT ticks. */
async function flash(bot: StarterBot, level: number, what: string): Promise<void> {
  let waited = 0;
  while (!litNow(bot, level).some(Boolean)) {
    if (++waited > DARK + LIT + 2) throw new Error(`${what}: no flash in ${waited} ticks`);
    await must(bot, bot.tick(), what);
  }
  let lit = 0;
  for (let now = litNow(bot, level); now.some(Boolean); now = litNow(bot, level)) {
    if (!now.every(Boolean)) throw new Error(`${what}: only ${now.filter(Boolean).length} of ${now.length} blocks are lit in the flash`);
    lit++;
    await must(bot, bot.tick(), what);
  }
  if (lit !== LIT) throw new Error(`${what}: the flash lasted ${lit} ticks, not ${LIT}`);
  bot.say(`${what}: a flash after ${waited} ticks, ${litNow(bot, level).length} blocks lit together for ${lit}`);
}

/** 1. Flash and Rumble: a flash at each sign. */
export async function flashAndRumble(bot: StarterBot): Promise<void> {
  const { book, map, bolt } = levels[0];
  for (let i = 0; i < BOLT; i++) if (!map.map.blocks.includes(book.n(`bolt.${i}`))) throw new Error(`bolt.${i} is not on the map`);
  await must(bot, bot.wait(20), 'a beat');
  await must(bot, bot.walk(7, 'the sky sign'), 'to the first sign');
  await flash(bot, 0, 'the sky');
  await must(bot, bot.wait(LOOK), 'looking');
  await must(bot, bot.walk(bolt[0] - 4, 'the bolt sign'), 'to the second sign');
  await flash(bot, 0, 'the bolt');
  await must(bot, bot.wait(LOOK), 'listening for the rumble');
  await must(bot, bot.walk(25, 'the thunder sign'), 'to the third sign');
  await flash(bot, 0, 'the thunder');
  await must(bot, bot.wait(LOOK), 'listening for the rumble');
  await leave(bot, bot.walk(40, 'the door'), 'the door');
}

/** 2. Light the Way: the signs, a drop into the ditch and back out, then the stones in a flash. */
export async function lightTheWay(bot: StarterBot): Promise<void> {
  const { stones } = levels[1];
  await must(bot, bot.wait(20), 'a beat');
  await must(bot, bot.walk(6, 'the stones sign'), 'to the first sign');
  await must(bot, bot.wait(LOOK), 'reading');
  await must(bot, bot.walk(11, 'the dim sign'), 'to the second sign');
  await must(bot, bot.wait(LOOK), 'reading');
  // the mistake: walking on in the dark without looking, into the ditch
  await must(bot, bot.walk(15, 'in the ditch'), 'into the ditch');
  if (bot.px.y / 20 < GROUND + 1) throw new Error(`she should be down in the ditch, not at row ${bot.px.y / 20}`);
  bot.say(`fell in the ditch (row ${bot.px.y / 20}); nothing hurts`);
  await must(bot, bot.walk(13, 'back up the step'), 'out of the ditch');
  if (bot.px.y / 20 !== GROUND - 1) throw new Error(`she should be back on the ground, not at row ${bot.px.y / 20}`);
  await flash(bot, 1, 'the stones');
  for (const s of stones) {
    await must(bot, bot.jump('right', s[0] + 0.5), `the jump to the stone at ${s[0]}`);
    if (bot.px.y / 20 !== GROUND - 1) throw new Error(`she should stand on the stone at ${s[0]}, not at row ${bot.px.y / 20}`);
    await must(bot, bot.wait(8), 'a breath');
  }
  await must(bot, bot.jump('right', 29), 'the jump to the far side');
  await leave(bot, bot.walk(42, 'the door'), 'the door');
}
