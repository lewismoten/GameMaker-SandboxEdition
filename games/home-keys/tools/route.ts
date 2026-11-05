// The way through the game, as orders for the bot (kit/starter/bot.ts): the keys a person would press,
// level by level, taking every coin on the way. Levels 1 and 2 and the way to the door in level 3 use only the
// arrows, Space and Enter (check.ts asserts it from the keys the bot pressed). Level 3's extra coins on the
// two shelves are a detour with E and then Q, and `play` can leave the detour out.
//   level 1: walk into a jelly (it holds), walk to the wall and jump, throw a star at each of two jellies
//   level 2: Space, then Right held, across a gap with higher ground beyond, and across a wide gap
//   level 3: the flat way to the door; with the detour, E leaps onto one shelf and Q onto the other
import type { Result, StarterBot } from '../../kit/starter/bot';
import { SCAN } from '../../kit/starter/ids';
import { ORIGIN } from '../../kit/starter/map';
import { SCAN_E, SCAN_ENTER, SCAN_Q } from '../src/hero';
import { JELLY } from '../src/monsters';
import { L1, L2, L3 } from '../src/levels';

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
  if (got !== want) throw new Error(`${what}: scored ${got}, expected ${want}`);
  bot.say(`${what}: scored ${got}`);
}

/** A person's look at what just happened, in ticks (about a second and a half). */
const LOOK = 40;
const col = (bot: StarterBot) => bot.px.x / 20;
const row = (bot: StarterBot) => bot.px.y / 20;

/** Holds a key for `ticks` ticks; returns what stopped the hero, if anything. */
async function holdFor(bot: StarterBot, key: number, ticks: number): Promise<Result> {
  bot.sim.press(key);
  const r = await bot.wait(ticks);
  bot.sim.release(key);
  return r;
}

/** Holds Right until Kit is at column `to`. */
async function rightTo(bot: StarterBot, to: number, max = 300): Promise<Result> {
  bot.sim.press(SCAN.right);
  for (let t = 0; t < max && col(bot) < to; t++) {
    const r = await bot.tick();
    if (r) return (bot.sim.releaseAll(), r);
  }
  bot.sim.release(SCAN.right);
  return undefined;
}

/** Whether the extra coins in level 3 are collected (E and Q), or only the way to the door. */
export interface Options {
  detour: boolean;
}

/** How many jellies are still there. */
const jellies = (bot: StarterBot) => bot.sim.w.mm.filter((m) => m.monnum === JELLY).length;

/** Taps Enter and lets the star fly (about a second). */
async function throwStar(bot: StarterBot): Promise<void> {
  await must(bot, holdFor(bot, SCAN_ENTER, 2), 'throwing');
  await must(bot, bot.wait(50), 'the star flying');
}

/** 1. Arrows, Space, Enter. */
export async function arrowsSpaceEnter(bot: StarterBot): Promise<void> {
  const from = bot.sim.ci.score;
  await must(bot, bot.walk(5, 'the walk sign'), 'to the first sign');
  await must(bot, bot.wait(LOOK), 'reading the sign');
  await must(bot, bot.walk(L1.wall[0] - 6, 'the jump sign'), 'to the jump sign');
  await must(bot, bot.wait(LOOK), 'reading the sign');
  await must(bot, bot.walk(L1.wall[0] - 1, 'the wall'), 'to the wall');
  await must(bot, bot.jump('right', L1.wall[0] + 1.5), 'onto the wall');
  if (row(bot) > L1.wallTop - 1 + 0.2) throw new Error(`Kit should stand on the wall; he is at row ${row(bot).toFixed(1)}`);
  bot.say(`score on the wall ${bot.sim.ci.score}`);
  await must(bot, bot.walk(L1.wall[1] + 1, 'off the wall'), 'off the wall');
  await must(bot, bot.walk(L1.hill[0] - 4, 'the throw sign'), 'to the throw sign');
  await must(bot, bot.wait(LOOK), 'reading the sign');
  await must(bot, bot.walk(L1.jellies[0] - 3, 'the first jelly'), 'to the jelly');
  // what the sign teaches, with the trouble first: walking into a jelly does not move it
  const first = L1.jellies[0];
  await must(bot, holdFor(bot, SCAN.right, 30), 'walking into the jelly');
  if (col(bot) > first - 0.2) throw new Error(`the jelly should block the tunnel; Kit is at column ${col(bot).toFixed(1)}`);
  await must(bot, bot.wait(20), 'a look');
  bot.say(`score at the tunnel ${bot.sim.ci.score}`);
  for (const [n, x] of L1.jellies.entries()) {
    await must(bot, bot.walk(x - 1, 'a jelly'), 'to the jelly');
    if (jellies(bot) !== L1.jellies.length - n) throw new Error(`there should be ${L1.jellies.length - n} jellies left`);
    const before = bot.sim.ci.score;
    await throwStar(bot);
    bot.say(`a jelly popped: score +${bot.sim.ci.score - before}`);
    if (jellies(bot) !== L1.jellies.length - n - 1) throw new Error(`the star should have popped the jelly at column ${x}`);
  }
  await must(bot, bot.walk(L1.coins[L1.coins.length - 1][0] + 1, 'the far coin'), 'to the far coin');
  bot.say(`far coin at column ${col(bot).toFixed(1)}`);
  score(bot, from, 10 * L1.coins.length + 20 * L1.jellies.length, 'level 1');
  await leave(bot, bot.walk(L1.exit, 'the exit'), 'the exit');
}

/** 2. No Diagonal Needed: a hop, then hold Right. */
export async function noDiagonal(bot: StarterBot): Promise<void> {
  const from = bot.sim.ci.score;
  const G = L2.ground;
  await must(bot, bot.walk(5, 'the sign'), 'to the first sign');
  await must(bot, bot.wait(LOOK), 'reading the sign');
  const [p1, p2] = L2.pits;
  await must(bot, bot.walk(p1[0], 'the first gap'), 'to the first gap');
  await must(bot, bot.jump('right', L2.step.from + 2), 'over the first gap');
  if (col(bot) < L2.step.from || row(bot) > G - L2.step.rise - 1 + 0.2)
    throw new Error(`Kit should stand on the high ground; he is at ${col(bot).toFixed(1)}, ${row(bot).toFixed(1)}`);
  await must(bot, bot.walk(L2.step.to - 1, 'the end of the high ground'), 'along the high ground');
  await must(bot, bot.walk(30, 'the second sign'), 'to the sign');
  await must(bot, bot.wait(LOOK), 'reading the sign');
  await must(bot, bot.walk(p2[0], 'the second gap'), 'to the second gap');
  await must(bot, bot.jump('right', p2[1] + 2), 'over the second gap');
  if (col(bot) < p2[1] + 1 || row(bot) > G - 1 + 0.2)
    throw new Error(`Kit should be across the second gap; he is at ${col(bot).toFixed(1)}, ${row(bot).toFixed(1)}`);
  await must(bot, bot.walk(L2.coins[L2.coins.length - 1][0] + 1, 'the far coin'), 'to the far coin');
  score(bot, from, 10 * L2.coins.length, 'level 2');
  await leave(bot, bot.walk(L2.exit, 'the exit'), 'the exit');
}

/** A leap with `key` (E or Q) from where Kit stands, then `dir` held in the air until he is `to` columns along; he must land on the shelf. */
async function leapOnto(bot: StarterBot, key: number, dir: 'left' | 'right', shelf: readonly [number, number], what: string): Promise<void> {
  await must(bot, holdFor(bot, key, 2), `leap to ${what}`);
  await must(bot, bot.land(), `landing on ${what}`);
  const top = L3.shelfTop - 1;
  bot.say(`${what}: landed at column ${col(bot).toFixed(1)}, row ${row(bot).toFixed(1)}`);
  if (row(bot) > top + 0.2 || col(bot) < shelf[0] - 0.5 || col(bot) > shelf[1] + 1)
    throw new Error(`Kit should stand on ${what}; he is at ${col(bot).toFixed(1)}, ${row(bot).toFixed(1)}`);
  void dir;
}

/** 3. Leap Shelves: the flat way, and (with `detour`) the shelves. */
export async function leapShelves(bot: StarterBot, o: Options = { detour: true }): Promise<void> {
  const from = bot.sim.ci.score;
  const [e0, e1] = L3.shelfE;
  const [q0, q1] = L3.shelfQ;
  await must(bot, bot.walk(5, 'the sign'), 'to the first sign');
  await must(bot, bot.wait(LOOK), 'reading the sign');
  await must(bot, bot.walk(L3.coins[0][0] + 1, 'a coin'), 'to the first coin');
  if (o.detour) {
    // a plain jump is not enough: what the sign says is a high place
    await must(bot, bot.walk(e0 - 1, 'the shelf'), 'to the shelf');
    await leapOnto(bot, SCAN_E, 'right', L3.shelfE, 'the first shelf');
    await must(bot, bot.walk(e1 + 1, 'along the shelf'), 'along the shelf');
    await must(bot, bot.land(), 'down from the shelf');
  }
  await must(bot, bot.walk(29, 'the second sign'), 'to the sign');
  await must(bot, bot.wait(LOOK), 'reading the sign');
  await must(bot, bot.walk(L3.coins[1][0] + 1, 'a coin'), 'to the second coin');
  if (o.detour) {
    await must(bot, bot.walk(q1 + 1, 'the other shelf'), 'to the other shelf');
    await leapOnto(bot, SCAN_Q, 'left', L3.shelfQ, 'the second shelf');
    await must(bot, bot.walk(q0 - 1, 'along the shelf'), 'along the shelf');
    await must(bot, bot.land(), 'down from the shelf');
  }
  await must(bot, bot.walk(L3.coins[2][0] + 1, 'the last coin'), 'to the last coin');
  const want = 10 * L3.coins.length + (o.detour ? 10 * (L3.coinsE.length + L3.coinsQ.length) : 0);
  score(bot, from, want, 'level 3');
  await leave(bot, bot.walk(L3.exit, 'the exit'), 'the exit');
}
