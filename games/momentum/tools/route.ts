// The way through the game, as orders for the bot (kit/starter/bot.ts): the keys a person would press,
// level by level, taking every coin on the way. It acts out each lesson once, and the checks here fail
// unless the level does what its sign says:
//   level 1: tap Right (a short glide), hold it (a longer one), then brake with Left against a plain glide
//   level 2: hop with Space alone (he goes nowhere), then cross three gaps, each with a bigger run-up
import type { Result, StarterBot } from '../../kit/starter/bot';
import { SCAN } from '../../kit/starter/ids';
import { ORIGIN } from '../../kit/starter/map';
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
  if (got !== want) throw new Error(`${what}: scored ${got}, expected ${want}`);
  bot.say(`${what}: scored ${got}`);
}

/** A person's look at what just happened, in ticks (about a second and a half). */
const LOOK = 40;
const col = (bot: StarterBot) => bot.px.x / 20;
const row = (bot: StarterBot) => bot.px.y / 20;

/** Waits until Kit has stopped moving sideways (and is on the floor). */
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

/** Holds Right until Kit is at column `to`, then lets go (he glides on from there). */
async function rightTo(bot: StarterBot, to: number, max = 400): Promise<Result> {
  bot.sim.press(SCAN.right);
  for (let t = 0; t < max && col(bot) < to; t++) {
    const r = await bot.tick();
    if (r) return (bot.sim.releaseAll(), r);
  }
  bot.sim.release(SCAN.right);
  return undefined;
}

/** How far Kit moves (in blocks) while `ticks` pass with no key held. */
async function drift(bot: StarterBot, ticks = 60): Promise<number> {
  const x0 = bot.px.x;
  await must(bot, bot.wait(ticks), 'gliding');
  return (bot.px.x - x0) / 20;
}

/** Lets go of everything and waits for the glide to end. */
async function brake(bot: StarterBot): Promise<void> {
  bot.sim.releaseAll();
  await settle(bot);
}

/** 1. Glide: a tap, a long hold, and Left to brake. */
export async function glide(bot: StarterBot): Promise<void> {
  const from = bot.sim.ci.score;
  await must(bot, bot.wait(LOOK), 'reading the first sign');
  // what the first sign teaches, once: a tap of Right and he glides on after he lets go
  const x0 = bot.px.x;
  bot.sim.press(SCAN.right);
  await must(bot, bot.wait(4), 'a tap');
  bot.sim.release(SCAN.right);
  const tapGlide = await drift(bot);
  bot.say(`a tap: moved ${((bot.px.x - x0) / 20).toFixed(1)} blocks, ${tapGlide.toFixed(1)} of them after the key was up`);
  if (tapGlide < 0.3) throw new Error(`a tap should leave a glide; Kit slid only ${tapGlide.toFixed(1)} blocks after letting go`);
  await must(bot, bot.wait(20), 'a look');
  // the second sign: hold it and he goes faster, so the glide is longer
  await must(bot, rightTo(bot, 8), 'to the second sign');
  const longGlide = await drift(bot);
  bot.say(`held 5 blocks: ${longGlide.toFixed(1)} blocks after the key was up`);
  if (longGlide < tapGlide * 2) throw new Error(`holding the key should give a longer glide than a tap (${longGlide.toFixed(1)} against ${tapGlide.toFixed(1)})`);
  await must(bot, rightTo(bot, L1.coins[1] + 0.5), 'to the coins');
  await settle(bot);
  await must(bot, rightTo(bot, 15), 'to the faster sign');
  await settle(bot);
  await must(bot, bot.wait(LOOK), 'reading the sign');
  await must(bot, rightTo(bot, L1.coins[4] + 1), 'along the rink');
  await settle(bot);
  // the turning sign: let go and he slows; Left turns him around
  await must(bot, rightTo(bot, 31), 'to the turning sign');
  await settle(bot);
  await must(bot, bot.wait(LOOK), 'reading the sign');
  await must(bot, rightTo(bot, 36), 'a run to turn from');
  const far = bot.px.x;
  bot.sim.press(SCAN.left);
  await must(bot, bot.wait(30), 'turning');
  bot.sim.release(SCAN.left);
  const back = (far - bot.px.x) / 20;
  bot.say(`Left pressed: Kit came back ${back.toFixed(1)} blocks`);
  if (back < 1) throw new Error(`Left should turn him around; he is only ${back.toFixed(1)} blocks back from his farthest`);
  await settle(bot);
  await must(bot, rightTo(bot, L1.coins[6] + 1), 'to the last coin');
  await settle(bot);
  score(bot, from, 10 * L1.coins.length, 'level 1');
  await leave(bot, rightTo(bot, L1.exit + 2), 'the exit');
}

/** Runs from where Kit stands, hops at the edge of a gap with Right still held, lands past it, then brakes. */
async function crossGap(bot: StarterBot, pit: readonly [number, number], what: string): Promise<void> {
  bot.sim.press(SCAN.right);
  for (let t = 0; t < 300 && col(bot) < pit[0] - 1.2; t++) {
    const r = await bot.tick();
    if (r) throw new Error(`running to ${what}: ${r}`);
  }
  const speed = bot.px.x;
  bot.sim.press(SCAN.space);
  await must(bot, bot.wait(2), `hop at ${what}`);
  bot.sim.release(SCAN.space);
  const path: string[] = [];
  for (let t = 0; t < 60; t++) {
    const r = await bot.tick();
    if (r) throw new Error(`in the air at ${what}: ${r}`);
    if (t % 2 === 0) path.push(`${col(bot).toFixed(0)},${row(bot).toFixed(1)}`);
    if (t > 8 && row(bot) >= L2.ground - 1 - 0.05) break;
  }
  bot.sim.release(SCAN.right);
  bot.say(`path ${path.join(' ')}`);
  bot.say(`${what}: took off at ${((speed) / 20).toFixed(1)}, landed at column ${col(bot).toFixed(1)}, row ${row(bot).toFixed(1)}`);
  if (col(bot) < pit[1] + 1 || row(bot) > L2.ground - 1 + 0.2) throw new Error(`Kit should have crossed ${what} and stand past column ${pit[1] + 1}; he is at ${col(bot).toFixed(1)}, ${row(bot).toFixed(1)}`);
  await brake(bot);
}

/** 2. Run-Up: a hop from standing goes nowhere; a hop with Right held carries across, farther with a run-up. */
export async function runUp(bot: StarterBot): Promise<void> {
  const from = bot.sim.ci.score;
  await must(bot, bot.wait(LOOK), 'reading the first sign');
  // what the sign teaches, once, on purpose: Space alone goes straight up and down
  const x0 = bot.px.x;
  bot.sim.press(SCAN.space);
  await must(bot, bot.wait(2), 'a standing hop');
  bot.sim.release(SCAN.space);
  await must(bot, bot.land(), 'landing');
  const dx = (bot.px.x - x0) / 20;
  bot.say(`Space alone: moved ${dx.toFixed(1)} blocks`);
  if (Math.abs(dx) > 0.6) throw new Error(`a hop from standing should go nowhere; Kit moved ${dx.toFixed(1)} blocks`);
  await must(bot, bot.wait(20), 'a look');
  const [p1, p2, p3] = L2.pits;
  await must(bot, rightTo(bot, 10), 'a few steps back from the first gap');
  await settle(bot);
  await crossGap(bot, p1, 'the first gap');
  await must(bot, bot.wait(LOOK), 'reading the second sign');
  await crossGap(bot, p2, 'the second gap');
  await must(bot, bot.wait(LOOK), 'reading the third sign');
  await crossGap(bot, p3, 'the third gap');
  await must(bot, rightTo(bot, L2.coins[L2.coins.length - 1][0] + 1), 'to the far coin');
  await settle(bot);
  score(bot, from, 10 * L2.coins.length, 'level 2');
  await leave(bot, rightTo(bot, L2.exit + 2), 'the exit');
}
