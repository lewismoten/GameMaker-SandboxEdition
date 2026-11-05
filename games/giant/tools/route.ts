// The way through the game, as orders for the bot (kit/starter/bot.ts): the keys a person
// would press, level by level, taking every coin on the way. Each sign's lesson is acted out,
// the mistake included, once, and every throw is checked against what the sign says:
//   level 1: from the ground the two bottom parts pop (one star each), then a star thrown from the ground
//            finds nothing (the head is above it); from the step the two top parts pop.
//   level 2: a hit part blinks red (a different monster, power 200); a star thrown while both bottom
//            parts blink goes through them and does nothing (the mistake); after the blink a part is
//            cracked, and the second hit pops it. The top row is done by waiting for each blink to end.
import type { Result, StarterBot } from '../../kit/starter/bot';
import { ORIGIN } from '../../kit/starter/map';
import { CRACKED, FRESH, HIT_SCORE, HURT, POOF, ROCKY, STAR } from '../src/monsters';
import { SCAN_ENTER } from '../src/hero';

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

/** What a part of level 2's giant is: fresh, hurt (blinking), cracked, or gone. */
export type Stage = 'fresh' | 'hurt' | 'cracked' | 'gone';
export function stageOf(bot: StarterBot, part: number): Stage {
  if (alive(bot, FRESH + part)) return 'fresh';
  if (alive(bot, HURT + part)) return 'hurt';
  if (alive(bot, CRACKED + part)) return 'cracked';
  return 'gone';
}
const stages = (bot: StarterBot, parts: number[]) => parts.map((p) => stageOf(bot, p)).join('/');

/** Ticks a star lives (monsters.ts STAR_LIFE) and the sparkle after it, so a throw has finished by then. */
const THROW_WATCH = 60;

/** Presses Enter like a person (a tap), then waits `watch` ticks for the star to land or fizzle. */
export async function throwStar(bot: StarterBot, what: string, watch = THROW_WATCH): Promise<void> {
  bot.sim.press(SCAN_ENTER);
  await must(bot, bot.wait(3), 'throwing');
  bot.sim.release(SCAN_ENTER);
  await must(bot, bot.wait(watch), 'watching the star');
  bot.say(`threw a star ${what}, score ${bot.sim.ci.score}, kit at ${bot.px.x / 20},${bot.px.y / 20}`);
}

/** Every coin is 10 points and every hit 20: a level that should give `n` coins and `hits` hits must have. */
function coins(bot: StarterBot, from: number, n: number, hits: number, what: string): void {
  const got = (bot.sim.ci.score - from - hits * HIT_SCORE) / 10;
  if (got !== n) {
    const left: string[] = [];
    const coin = bot.sim.w.bg.findIndex((b) => b.scorePts === 10);
    for (let y = 0; y < 100; y++) for (let x = 0; x < 100; x++) if (bot.sim.w.map[y * 100 + x] === coin) left.push(`${x - ORIGIN},${y - ORIGIN}`);
    throw new Error(`${what}: ${got} of ${n} coins; left at ${left.join(' ')}`);
  }
}

/** A throw that must pop part `part` of level 1's giant: one hit, 20 points, and nothing else changes. */
async function pop(bot: StarterBot, part: number, what: string): Promise<void> {
  const score = bot.sim.ci.score;
  const others = [0, 1, 2, 3].filter((p) => p !== part).map((p) => alive(bot, ROCKY + p));
  await throwStar(bot, what);
  if (alive(bot, ROCKY + part)) throw new Error(`${what}: the part is still there`);
  if (bot.sim.ci.score - score !== HIT_SCORE) throw new Error(`${what}: a pop should score ${HIT_SCORE}; score ${score} -> ${bot.sim.ci.score}`);
  const now = [0, 1, 2, 3].filter((p) => p !== part).map((p) => alive(bot, ROCKY + p));
  if (now.join() !== others.join()) throw new Error(`${what}: another part changed (${others} -> ${now})`);
  if (alive(bot, STAR)) throw new Error(`${what}: a star is still flying`);
}

/** 1. The Giant: from the ground the bottom pair pops and a star at the head misses; from the step the top pair pops; then walk through. */
export async function theGiantLevel(bot: StarterBot): Promise<void> {
  const score = bot.sim.ci.score;
  await must(bot, bot.walk(10, 'the signs'), 'to the signs');
  await must(bot, bot.walk(16, 'the coins'), 'to the coins');
  // up on the step (the coin on it is Kit's), then down on the ground at the giant's side, facing it
  await must(bot, bot.walk(18, 'the step'), 'onto the step');
  await must(bot, bot.walk(21, 'the ground'), 'down to the ground');
  await pop(bot, 2, 'at the bottom left part');
  await pop(bot, 3, 'at the bottom right part');
  // the mistake: from the ground a star flies level with the bottom row, under the head
  const before = bot.sim.ci.score;
  const heads = [alive(bot, ROCKY), alive(bot, ROCKY + 1)];
  await throwStar(bot, 'from the ground at the head');
  if (bot.sim.ci.score !== before || alive(bot, ROCKY) !== heads[0] || alive(bot, ROCKY + 1) !== heads[1])
    throw new Error('a star from the ground must not touch the head');
  // the step: walk up on it and turn back to face the giant
  await must(bot, bot.walk(17, 'back up the step'), 'back onto the step');
  await must(bot, bot.walk(19, 'facing the head'), 'facing the head');
  await pop(bot, 0, 'from the step at the top left part');
  await pop(bot, 1, 'from the step at the top right part');
  await must(bot, bot.wait(30), 'the puffs');
  await must(bot, bot.walk(36, 'through the tunnel'), 'through the tunnel');
  coins(bot, score, 6, 4, 'level 1 before the exit');
  await leave(bot, bot.walk(43, 'the exit'), 'the exit');
}

/** Waits (in ticks, a few at a time like a person watching) until none of `parts` is blinking. */
async function waitForBlinkToEnd(bot: StarterBot, parts: number[], what: string): Promise<void> {
  let waited = 0;
  while (parts.some((p) => stageOf(bot, p) === 'hurt')) {
    await must(bot, bot.wait(4), 'watching the blink');
    if ((waited += 4) > 200) throw new Error(`${what}: still blinking after ${waited} ticks (${stages(bot, parts)})`);
  }
  bot.say(`${what}: the blink is over after ${waited} ticks (${stages(bot, parts)})`);
}

/** A throw at a row of level 2's giant (parts `front`, then `back`): the front one must go from `was` to `now` for 20 points. */
async function hit(bot: StarterBot, part: number, was: Stage, now: Stage, what: string, watch: number): Promise<void> {
  const score = bot.sim.ci.score;
  if (stageOf(bot, part) !== was) throw new Error(`${what}: part ${part} should be ${was} before the throw but is ${stageOf(bot, part)}`);
  await throwStar(bot, what, watch);
  if (stageOf(bot, part) !== now) throw new Error(`${what}: part ${part} should be ${now} after the throw but is ${stageOf(bot, part)}`);
  if (bot.sim.ci.score - score !== HIT_SCORE) throw new Error(`${what}: the hit should score ${HIT_SCORE}; score ${score} -> ${bot.sim.ci.score}`);
}

/** Throws at a row [front, back] until both are gone: two hits each with a blink between; `rush` throws a third star while both still blink (a wasted one). */
async function row(bot: StarterBot, front: number, back: number, name: string, rush: boolean): Promise<void> {
  const score = bot.sim.ci.score;
  if (rush) {
    // three quick taps: the first star hurts the front part, the second goes straight through it and hurts the back one,
    // and the third finds both of them blinking and does nothing
    await throwStar(bot, `${name}, first`, 12);
    await throwStar(bot, `${name}, second`, 12);
    await throwStar(bot, `${name}, third`, 12);
    await must(bot, bot.wait(30), 'the stars landing');
    bot.say(`${name}: ${stages(bot, [front, back])}, score ${bot.sim.ci.score - score} up`);
    if (bot.sim.ci.score - score !== 2 * HIT_SCORE)
      throw new Error(`${name}: three quick stars should score two hits (${2 * HIT_SCORE}), not ${bot.sim.ci.score - score}; ${stages(bot, [front, back])}`);
  } else {
    await hit(bot, front, 'fresh', 'hurt', `${name} front part, first hit`, 22);
    await hit(bot, back, 'fresh', 'hurt', `${name} back part, first hit (through the front one)`, 34);
  }
  await waitForBlinkToEnd(bot, [front, back], name);
  if (stages(bot, [front, back]) !== 'cracked/cracked')
    throw new Error(`${name}: both parts should be cracked after the blink (${stages(bot, [front, back])})`);
  await hit(bot, front, 'cracked', 'gone', `${name} front part, second hit`, 22);
  await hit(bot, back, 'cracked', 'gone', `${name} back part, second hit`, 34);
}

/** 2. Ouch, Wait: two hits a part, each with a red blink between; bottom pair from the ground, top pair from the step. */
export async function ouchWaitLevel(bot: StarterBot): Promise<void> {
  const score = bot.sim.ci.score;
  await must(bot, bot.walk(14, 'the signs'), 'to the signs');
  await must(bot, bot.walk(17, 'the coins'), 'to the coins');
  await must(bot, bot.walk(19, 'the step'), 'onto the step');
  await must(bot, bot.walk(22, 'the ground'), 'down to the ground');
  await row(bot, 2, 3, 'the bottom row', true);
  await must(bot, bot.wait(24), 'the puffs');
  await must(bot, bot.walk(18, 'the step'), 'back up the step');
  await must(bot, bot.walk(20, 'facing the head'), 'facing the head');
  await row(bot, 0, 1, 'the top row', false);
  await must(bot, bot.wait(30), 'the puffs');
  if (alive(bot, POOF)) throw new Error('the puffs should be gone');
  await must(bot, bot.walk(41, 'through the tunnel'), 'through the tunnel');
  coins(bot, score, 7, 8, 'level 2 before the exit');
  await leave(bot, bot.walk(44, 'the exit'), 'the exit');
}
export { ORIGIN };
