// The way through the game, as orders for the bot (kit/starter/bot.ts): the keys a person would press,
// level by level, taking every coin on the way. It acts out each lesson once, and the checks here fail
// unless the level does what its sign says:
//   level 1: one tap, then a tap in the air (he rises again); then tap on and on up the cliff and across the gap
//   level 2: three taps (the third does nothing and he drops), a tap with none left (nothing), a blue bubble
//            (the taps are back), then each step and the pit with exactly two
import type { Result, StarterBot } from '../../kit/starter/bot';
import { SCAN } from '../../kit/starter/ids';
import { ORIGIN } from '../../kit/starter/map';
import { BOOT_SEQ } from '../src/hero';
import { L1, L2 } from '../src/levels';

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
  if (got !== want) {
    const left: string[] = [];
    const coin = bot.sim.w.bg.findIndex((b) => b.scorePts === 10);
    for (let y = 0; y < 100; y++) for (let x = 0; x < 100; x++) if (bot.sim.w.map[y * 100 + x] === coin) left.push(`${x - ORIGIN},${y - ORIGIN}`);
    throw new Error(`${what}: scored ${got}, expected ${want}; coins left at ${left.join(' ')}`);
  }
  bot.say(`${what}: scored ${got}`);
}

/** A person's look at what just happened, in ticks (about a second and a half). */
const LOOK = 40;
const col = (bot: StarterBot) => bot.px.x / 20;
/** Pixels from the level's top to the top of Kit's bottom block (his feet are one block lower). */
const yOf = (bot: StarterBot) => bot.px.y;
/** The jump sequence's uses left, as the character file counts them. */
const taps = (bot: StarterBot) => bot.sim.ci.meter[BOOT_SEQ];

/** Waits until Kit has stopped moving (and is on the floor). */
async function settle(bot: StarterBot, max = 120): Promise<void> {
  let still = 0;
  for (let t = 0; t < max && still < 4; t++) {
    const x = bot.px.x;
    const y = bot.px.y;
    const r = await bot.tick();
    if (r) throw new Error(`settling: ${r}`);
    still = bot.px.x === x && bot.px.y === y ? still + 1 : 0;
  }
}

/** Holds Right until Kit is at column `to`, then lets go. */
async function rightTo(bot: StarterBot, to: number, max = 600): Promise<Result> {
  bot.sim.press(SCAN.right);
  for (let t = 0; t < max && col(bot) < to; t++) {
    const r = await bot.tick();
    if (r) return (bot.sim.releaseAll(), r);
  }
  bot.sim.release(SCAN.right);
  return undefined;
}

/** One tap of Space: down for two ticks, then up. */
async function tap(bot: StarterBot, what = 'a tap'): Promise<void> {
  bot.sim.press(SCAN.space);
  await must(bot, bot.wait(2), what);
  bot.sim.release(SCAN.space);
}

/** Ticks until Kit stops rising (the top of the jump); returns how many pixels higher he got than `y0`. */
async function toTop(bot: StarterBot, y0: number, what: string, max = 80): Promise<number> {
  let best = yOf(bot);
  for (let t = 0; t < max; t++) {
    const r = await bot.tick();
    if (r) throw new Error(`${what}: ${r}`);
    if (yOf(bot) > best + 1) break;
    best = Math.min(best, yOf(bot));
  }
  return y0 - best;
}

/** Taps (Space down two ticks, up) whenever Kit is lower than `goal` (a y in pixels) and a few ticks have passed since the last tap, until `done()`. */
async function jet(bot: StarterBot, goal: () => number, done: () => boolean, what: string, gap = 6, max = 700): Promise<void> {
  let since = gap;
  for (let t = 0; t < max && !done(); t++) {
    if (since === 2) bot.sim.release(SCAN.space);
    if (since >= gap && yOf(bot) > goal()) {
      bot.sim.press(SCAN.space);
      since = 0;
    }
    since++;
    const r = await bot.tick();
    if (r) throw new Error(`${what}: ${r}`);
  }
  bot.sim.release(SCAN.space);
  if (!done()) throw new Error(`${what}: not there after ${max} ticks; Kit is at ${col(bot).toFixed(1)}, ${(yOf(bot) / 20).toFixed(1)}`);
}

/** 1. Jet Pack: a tap, a tap in the air, then up the cliff and over the gap. */
export async function jetPack(bot: StarterBot): Promise<void> {
  const from = bot.sim.ci.score;
  await must(bot, bot.wait(LOOK), 'reading the first sign');
  // what the sign teaches, once: a tap rises one jump; a second tap in the air rises again
  const y0 = yOf(bot);
  await tap(bot);
  const one = await toTop(bot, y0, 'one tap');
  await must(bot, bot.land(), 'landing');
  await must(bot, bot.wait(20), 'a look');
  await tap(bot);
  await must(bot, bot.wait(7), 'between taps');
  await tap(bot, 'a tap in the air');
  const two = await toTop(bot, y0, 'two taps');
  bot.say(`one tap rose ${one} px, a tap in the air as well rose ${two} px`);
  if (two < one * 1.6) throw new Error(`a tap in the air should lift him again (${two} against ${one})`);
  await must(bot, bot.land(), 'landing');
  await must(bot, bot.wait(20), 'a look');
  // to the cliff, then up it with Right held against the face, tapping on and on
  await must(bot, rightTo(bot, L1.cliff[0] - 1.2), 'to the cliff');
  await settle(bot);
  bot.sim.press(SCAN.right);
  const ledge = (L1.top - 1) * 20 - 8;
  await jet(
    bot,
    () => (L1.top - 3) * 20,
    () => yOf(bot) < ledge,
    'up the cliff',
  );
  await must(bot, bot.land(), 'onto the ledge');
  bot.sim.release(SCAN.right);
  bot.say(`up the cliff: Kit stands at column ${col(bot).toFixed(1)}, row ${(yOf(bot) / 20).toFixed(1)}`);
  if (col(bot) < L1.cliff[0] || yOf(bot) > (L1.top - 1) * 20 + 2) throw new Error('Kit should stand on top of the cliff');
  await settle(bot);
  await must(bot, bot.wait(LOOK), 'reading the sign');
  // across the gap: hold Right and keep tapping
  await must(bot, rightTo(bot, L1.gap[0] - 1.5), 'to the edge');
  await settle(bot);
  bot.sim.press(SCAN.right);
  await jet(
    bot,
    () => 60,
    () => col(bot) > L1.far[0] + 1,
    'across the gap',
    6,
    400,
  );
  await must(bot, bot.land(), 'landing');
  bot.sim.release(SCAN.right);
  if (yOf(bot) > (L1.top - 1) * 20 + 2) throw new Error('Kit should stand on the far side');
  await settle(bot);
  await must(bot, rightTo(bot, L1.coins[7][0] + 1), 'to the last coin');
  await settle(bot);
  score(bot, from, 10 * L1.coins.length, 'level 1');
  await leave(bot, rightTo(bot, L1.exit + 2), 'the exit');
}

/** From where Kit stands, tap, wait for the top, tap again, with Right held: returns where he lands. */
async function twoTaps(bot: StarterBot, what: string, steer: boolean): Promise<void> {
  const y0 = yOf(bot);
  if (steer) bot.sim.press(SCAN.right);
  await tap(bot, `${what}: first tap`);
  const one = await toTop(bot, y0, `${what}: first rise`);
  await tap(bot, `${what}: second tap`);
  const two = await toTop(bot, y0, `${what}: second rise`);
  bot.say(`${what}: rose ${one}, then ${two} px in all; ${taps(bot)} taps left`);
}

/** 2. Double-Jump Boots: the third tap does nothing; a bubble fills the boots; then two taps for each step and the pit. */
export async function boots(bot: StarterBot): Promise<void> {
  const from = bot.sim.ci.score;
  await must(bot, bot.wait(LOOK), 'reading the first sign');
  if (taps(bot) !== 2) throw new Error(`the boots should start with 2 taps; they have ${taps(bot)}`);
  // what the signs teach, once, on purpose: two taps, a third that does nothing, then nothing at all
  await must(bot, rightTo(bot, 7), 'to the open ground');
  await settle(bot);
  const y0 = yOf(bot);
  await tap(bot, 'tap 1');
  const one = await toTop(bot, y0, 'rise 1');
  await tap(bot, 'tap 2');
  const two = await toTop(bot, y0, 'rise 2');
  await must(bot, bot.wait(4), 'falling');
  await tap(bot, 'tap 3');
  const three = await toTop(bot, y0, 'rise 3');
  bot.say(`rose ${one} px, then ${two} with the second tap and ${three} after a third tap`);
  if (two < one * 1.6) throw new Error(`the second tap should lift him again (${two} against ${one})`);
  if (three > two + 4) throw new Error(`a third tap should do nothing (${three} against ${two})`);
  await must(bot, bot.land(), 'dropping back');
  await must(bot, bot.wait(30), 'a look');
  if (taps(bot) !== 0) throw new Error(`no taps should be left; the boots have ${taps(bot)}`);
  await tap(bot, 'tap with none left');
  await must(bot, bot.wait(20), 'waiting');
  if (yOf(bot) < y0 - 1) throw new Error('with no taps left Space should do nothing');
  await must(bot, bot.wait(LOOK), 'reading the sign');
  // a blue bubble, and the taps are back
  await must(bot, rightTo(bot, L2.pods[0][1] + 0.5), 'to the bubbles');
  await settle(bot);
  if (taps(bot) !== 3) throw new Error(`three bubbles should fill the boots to 3; they have ${taps(bot)}`);
  // the tall step: two taps, Right held against it
  await must(bot, rightTo(bot, L2.tower1[0] - 1.2), 'to the step');
  await settle(bot);
  await must(bot, bot.wait(LOOK), 'reading the step sign');
  await twoTaps(bot, 'the step', true);
  await must(bot, bot.land(), 'onto the step');
  bot.sim.release(SCAN.right);
  if (col(bot) < L2.tower1[0] - 0.2 || yOf(bot) > (L2.ground - L2.step - 1) * 20 + 2) throw new Error('Kit should stand on the step');
  await settle(bot);
  // down the other side, a bubble, then the pit with two taps
  await must(bot, rightTo(bot, L2.pods[1][1] + 0.5), 'to the second row of bubbles');
  await settle(bot);
  await must(bot, bot.wait(LOOK), 'reading the pit sign');
  await must(bot, rightTo(bot, L2.pods[2][1] + 0.5), 'to the bubbles by the pit');
  await settle(bot);
  await must(bot, rightTo(bot, L2.pit[0] - 0.9), 'to the edge');
  await settle(bot);
  await twoTaps(bot, 'the pit', true);
  await must(bot, bot.land(), 'landing past the pit');
  bot.sim.release(SCAN.right);
  if (col(bot) < L2.pit[1] + 0.5 || yOf(bot) > (L2.ground - 1) * 20 + 2) throw new Error(`Kit should be across the pit; he is at ${col(bot).toFixed(1)}`);
  await settle(bot);
  // the staircase: a bubble, two taps up, the bubble on top, two taps up again
  await must(bot, rightTo(bot, L2.pods[3][1] + 0.5), 'to the bubbles past the pit');
  await settle(bot);
  await must(bot, rightTo(bot, L2.stair1[0] - 1.2), 'to the first stair');
  await settle(bot);
  await twoTaps(bot, 'the first stair', true);
  await must(bot, bot.land(), 'onto the first stair');
  bot.sim.release(SCAN.right);
  await settle(bot);
  await must(bot, rightTo(bot, L2.pods[4][1] + 0.5), 'to the bubbles on the stair');
  await settle(bot);
  await must(bot, rightTo(bot, L2.stair2[0] - 1.2), 'to the second stair');
  await settle(bot);
  await twoTaps(bot, 'the second stair', true);
  await must(bot, bot.land(), 'onto the top');
  bot.sim.release(SCAN.right);
  await settle(bot);
  score(bot, from, 10 * L2.coins.length, 'level 2');
  await leave(bot, rightTo(bot, L2.exit + 2), 'the exit');
}
