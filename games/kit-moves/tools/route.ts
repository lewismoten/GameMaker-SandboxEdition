// The way through the game, as orders for the bot (kit/starter/bot.ts): the keys a person would press,
// level by level, taking every coin on the way. It acts out each lesson once, the trouble included, and the
// checks here fail unless the water does what its sign says:
//   level 1: hold Space (one hop only), hop onto the low wall, tap Up (a short rise, then down), then hold Up
//            beside the cliff until Kit is above it and walk onto the top
//   level 2: hold Enter (one dash), then cross three gaps, each with a hop and one more press of Enter than the last
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
const ENTER = 28;

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

/** The highest (smallest) row Kit reaches while `key` is held `ticks` ticks and then let go, until he lands again. */
async function peak(bot: StarterBot, key: number, ticks: number): Promise<number> {
  let top = row(bot);
  bot.sim.press(key);
  for (let t = 0; t < ticks + 120; t++) {
    if (t === ticks) bot.sim.release(key);
    if (await bot.tick()) break;
    top = Math.min(top, row(bot));
    if (t > ticks + 4 && row(bot) >= L1.ground - 1 - 0.01) break;
  }
  bot.sim.release(key);
  await bot.land();
  return top;
}

/** 1. Tap and Hold: Space hops once however long it is held; Up lifts while it is held. */
export async function tapAndHold(bot: StarterBot): Promise<void> {
  const from = bot.sim.ci.score;
  const feet = L1.ground - 1;
  await must(bot, bot.walk(8, 'the hop sign'), 'to the first sign');
  await must(bot, bot.wait(LOOK), 'reading the sign');
  // what the first sign teaches, once, on purpose: hold Space down for two seconds; he hops once
  const hop = await peak(bot, SCAN.space, 36);
  bot.say(`Space held 36 ticks: highest row ${hop.toFixed(1)}`);
  if (hop < feet - 3.6 || hop > feet - 2.5) throw new Error(`holding Space should still be one hop of about three blocks; he reached row ${hop.toFixed(1)}`);
  // onto the low wall: a hop clears it
  await must(bot, bot.walk(L1.wall[0] - 1, 'the low wall'), 'to the wall');
  await must(bot, bot.jump('right', L1.wall[0] + 1.5), 'onto the wall');
  if (row(bot) > L1.wallTop - 1 + 0.2) throw new Error(`Kit should stand on the wall; he is at row ${row(bot).toFixed(1)}`);
  await must(bot, bot.walk(L1.wall[1] + 1, 'off the wall'), 'off the wall');
  await must(bot, bot.walk(17, 'the second sign'), 'to the sign');
  await must(bot, bot.wait(LOOK), 'reading the sign');
  await must(bot, bot.walk(23, 'the lift sign'), 'to the lift sign');
  await must(bot, bot.wait(LOOK), 'reading the sign');
  // Up for a moment: he lifts and falls back when it is let go
  await must(bot, bot.walk(L1.cliff - 2, 'the cliff'), 'to the cliff');
  const short = await peak(bot, SCAN.up, 8);
  bot.say(`Up held 8 ticks: highest row ${short.toFixed(1)}`);
  if (short > feet - 1 || short < L1.cliffTop) throw new Error(`a short Up should lift Kit but not as far as the cliff top; he reached row ${short.toFixed(1)}`);
  await must(bot, bot.wait(20), 'a look');
  // Up held: he keeps going until he is above the cliff
  bot.sim.press(SCAN.up);
  for (let t = 0; t < 120 && row(bot) > L1.cliffTop - 1.5; t++) {
    const r = await bot.tick();
    if (r) throw new Error(`rising: ${r}`);
  }
  bot.sim.release(SCAN.up);
  bot.say(`Up held: Kit is at row ${row(bot).toFixed(1)}`);
  if (row(bot) > L1.cliffTop - 1.2) throw new Error(`Kit should rise above the cliff top (row ${L1.cliffTop}); he is at row ${row(bot).toFixed(1)}`);
  await must(bot, rightTo(bot, L1.cliff + 2), 'onto the cliff');
  await must(bot, bot.land(), 'landing on the cliff');
  if (row(bot) > L1.cliffTop - 1 + 0.2) throw new Error(`Kit should stand on the cliff; he is at row ${row(bot).toFixed(1)}`);
  await must(bot, bot.walk(34, 'the top sign'), 'to the sign');
  await must(bot, bot.wait(LOOK), 'reading the sign');
  await must(bot, bot.walk(L1.coins[L1.coins.length - 1][0] + 1, 'the far coins'), 'to the far coins');
  score(bot, from, 10 * L1.coins.length, 'level 1');
  await leave(bot, bot.walk(L1.exit, 'the exit'), 'the exit');
}

/** Hop at the edge of a gap, press Enter `presses` times in the air (letting go between), then land. */
async function crossGap(bot: StarterBot, edge: number, presses: number, landing: number, what: string): Promise<void> {
  await must(bot, bot.walk(edge, `the edge of ${what}`), `to the edge of ${what}`);
  await must(bot, holdFor(bot, SCAN.space, 2), `hop at ${what}`);
  for (let n = 0; n < presses; n++) {
    await must(bot, bot.wait(3), `in the air at ${what}`);
    await must(bot, holdFor(bot, ENTER, 2), `dash ${n + 1} at ${what}`);
  }
  await must(bot, bot.land(), `landing after ${what}`);
  bot.say(`${what}: ${presses} dash(es), landed at column ${col(bot).toFixed(1)}, row ${row(bot).toFixed(1)}`);
  if (col(bot) < landing || row(bot) > L2.ground - 1 + 0.2) throw new Error(`Kit should have crossed ${what} and stand past column ${landing}; he is at ${col(bot).toFixed(1)}, ${row(bot).toFixed(1)}`);
}

/** 2. Once Per Press: Enter dashes once however long it is held; each press is another dash. */
export async function oncePerPress(bot: StarterBot): Promise<void> {
  const from = bot.sim.ci.score;
  await must(bot, bot.walk(5, 'the dash sign'), 'to the first sign');
  await must(bot, bot.wait(LOOK), 'reading the sign');
  // what the sign teaches, once, on purpose: hold Enter for a second; he dashes once
  const x0 = col(bot);
  await must(bot, holdFor(bot, ENTER, 30), 'holding Enter');
  await must(bot, bot.wait(10), 'a look');
  const dx = col(bot) - x0;
  bot.say(`Enter held 30 ticks: moved ${dx.toFixed(1)} blocks`);
  if (dx < 2.8 || dx > 3.8) throw new Error(`holding Enter should give one dash of about three blocks; Kit moved ${dx.toFixed(1)}`);
  const [p1, p2, p3] = L2.pits;
  await crossGap(bot, p1[0] - 1, 1, p1[1] + 1, 'the first gap');
  await must(bot, bot.walk(21, 'the second sign'), 'to the sign');
  await must(bot, bot.wait(LOOK), 'reading the sign');
  await crossGap(bot, p2[0] - 1, 2, p2[1] + 1, 'the second gap');
  await must(bot, bot.walk(37, 'the third sign'), 'to the sign');
  await must(bot, bot.wait(LOOK), 'reading the sign');
  await crossGap(bot, p3[0] - 1, 3, p3[1] + 1, 'the third gap');
  await must(bot, bot.walk(L2.coins[L2.coins.length - 1][0] + 1, 'the far coin'), 'to the far coin');
  score(bot, from, 10 * L2.coins.length, 'level 2');
  await leave(bot, bot.walk(L2.exit, 'the exit'), 'the exit');
}
