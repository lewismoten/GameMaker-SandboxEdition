// The way through the game, as orders for the bot (kit/starter/bot.ts): the keys a person
// would press, level by level, taking every coin on the way. Each sign's lesson is acted out,
// the mistake included, once: in level 1 Kit first tries to hop over Plop (the mound's roof stops him),
// then walks into the crate (nothing happens: a crate gives way only to a hit), hits it with Enter twice
// (cracked, then rubble) and Plop drops into the dip; in level 2 he hits the two crates (four hits), stops
// inside the tunnel and lets soft Pip drift down through him. The checks here fail if anything else happens.
import { SCAN } from '../../kit/starter/ids';
import type { Result, StarterBot } from '../../kit/starter/bot';
import { ORIGIN } from '../../kit/starter/map';
import { MLEN } from '@lewismoten/gamemaker-sandbox-engine/engine/world';
import { SCAN_ENTER } from '../src/hero';
import { CORK_ROW, GROUND, MON_ROW, buildLevels } from '../src/levels';
import { PIP, PLOP } from '../src/monsters';

const { book } = buildLevels();
/** The name of the block in level cell (x, row). */
function cellAt(bot: StarterBot, x: number, row: number): string {
  const n = bot.sim.w.map[(row + ORIGIN) * MLEN + x + ORIGIN];
  for (const [name, i] of book.index) if (i === n) return name;
  return `block ${n}`;
}

/** One hit: tap Enter, then wait out the swing (a dozen ticks) the way a person watches it land. */
async function hit(bot: StarterBot, after = 16): Promise<Result> {
  bot.sim.press(SCAN_ENTER);
  const a = await bot.wait(3);
  bot.sim.release(SCAN_ENTER);
  return a ?? (await bot.wait(after));
}

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

/** Every coin is 10 points: a level that should give `n` coins must have. */
function coins(bot: StarterBot, from: number, n: number, what: string): void {
  const got = (bot.sim.ci.score - from) / 10;
  if (got !== n) throw new Error(`${what}: ${got} of ${n} coins`);
}

/** A person stopped at a sign for a moment to read it. */
const READ = 40;

/** The monster's block row (its cell, rounded to the nearest) and the pixels it is below that row's top, in level terms. */
export function monsterAt(bot: StarterBot, n: number): { x: number; row: number; y: number } {
  const i = bot.sim.w.mm.findIndex((m) => m.monnum === n);
  if (i < 0) throw new Error(`monster ${n} is not in the level`);
  const m = bot.sim.w.mi[i];
  return { x: m.curx[0] - ORIGIN, row: m.cury[0] - ORIGIN, y: (m.cury[0] - ORIGIN) * 20 + m.cury[1] };
}

/** Holds Right for `ticks` (a push into whatever is ahead). */
async function push(bot: StarterBot, ticks: number): Promise<Result> {
  bot.sim.press(SCAN.right);
  const r = await bot.wait(ticks);
  bot.sim.release(SCAN.right);
  return r;
}

/** 1. In the Way: Kit tries to hop Plop and cannot, bumps the crate, and Plop drops into the dip. */
export async function inTheWay(bot: StarterBot): Promise<void> {
  const score = bot.sim.ci.score;
  await must(bot, bot.wait(READ), 'reading the first sign');
  await must(bot, bot.walk(7, 'the first sign'), 'to the first sign');
  await must(bot, bot.wait(READ), 'reading');
  await must(bot, bot.walk(14, 'the second sign'), 'to the second sign');
  await must(bot, bot.wait(READ), 'reading');
  await must(bot, bot.walk(22, 'the tunnel'), 'to the tunnel');
  if (monsterAt(bot, PLOP).row !== MON_ROW) throw new Error(`level 1: Plop should sit on its crate (row ${MON_ROW}); row ${monsterAt(bot, PLOP).row}`);
  // the mistake: try to hop it. The roof is right overhead, so Kit only bumps his head.
  const floor = bot.px.y;
  let highest = floor;
  bot.sim.press(SCAN.space);
  for (let i = 0; i < 20; i++) {
    await must(
      bot,
      bot.tick().then(() => undefined),
      'hopping',
    );
    highest = Math.min(highest, bot.px.y);
  }
  bot.sim.release(SCAN.space);
  await must(bot, bot.land(), 'landing');
  if (floor - highest > 24) throw new Error(`level 1: the roof should stop Kit hopping (rose ${floor - highest}px)`);
  bot.say(`Kit could not hop over Plop: the roof stopped him after ${floor - highest}px`);
  // walking into the crate does nothing: it gives way only to a hit
  await must(bot, bot.walk(23, 'the crate'), 'to the crate');
  await must(bot, push(bot, 14), 'bumping the crate');
  if (cellAt(bot, 24, CORK_ROW) !== 'crate') throw new Error(`level 1: walking into the crate should not break it; it is ${cellAt(bot, 24, CORK_ROW)}`);
  bot.say('walking into the crate did nothing');
  await must(bot, bot.wait(READ), 'reading the sign');
  // the real way: hit it. The first hit cracks it, the second breaks it, and Plop drops into the dip.
  await must(bot, hit(bot), 'the first hit');
  if (cellAt(bot, 24, CORK_ROW) !== 'cracked') throw new Error(`level 1: the first hit should crack the crate; it is ${cellAt(bot, 24, CORK_ROW)}`);
  bot.say('the first hit cracked the crate');
  await must(bot, bot.wait(8), 'looking at the crack');
  await must(bot, hit(bot), 'the second hit');
  if (cellAt(bot, 24, CORK_ROW) !== 'rubble') throw new Error(`level 1: the second hit should break the crate; it is ${cellAt(bot, 24, CORK_ROW)}`);
  await must(bot, bot.wait(10), 'watching Plop');
  const p = monsterAt(bot, PLOP);
  if (p.row !== GROUND) throw new Error(`level 1: Plop should have dropped into the dip (row ${GROUND}); row ${p.row}`);
  bot.say('the crate broke and Plop dropped into the dip');
  await must(bot, bot.walk(29, 'over Plop'), 'over Plop');
  await must(bot, bot.walk(31, 'the third sign'), 'to the third sign');
  await must(bot, bot.wait(READ), 'reading');
  await must(bot, bot.walk(37, 'the last coin'), 'to the last coin');
  coins(bot, score, 6, 'level 1 before the exit');
  await leave(bot, bot.walk(43, 'the exit'), 'the exit');
}

/** 2. Slow and Soft: Kit walks into two crates, stands still, and soft Pip drifts down through him. */
export async function slowAndSoft(bot: StarterBot): Promise<void> {
  const score = bot.sim.ci.score;
  await must(bot, bot.wait(READ), 'reading the first sign');
  await must(bot, bot.walk(4, 'the first sign'), 'to the first sign');
  await must(bot, bot.wait(READ), 'reading');
  await must(bot, bot.walk(10, 'the second sign'), 'to the second sign');
  await must(bot, bot.wait(READ), 'reading');
  await must(bot, bot.walk(18, 'the crates'), 'to the crates');
  const top = monsterAt(bot, PIP).row;
  if (top !== MON_ROW - 1) throw new Error(`level 2: Pip should sit on two crates (row ${MON_ROW - 1}); row ${top}`);
  // hit the crates (two hits each); the last hit breaks the lower one with soft Pip on top of it. Pip is soft,
  // so when Kit walks on into its column, it drifts down through him.
  for (let n = 1; n <= 3; n++) {
    await must(bot, hit(bot), `hit ${n}`);
    await must(bot, bot.wait(6), 'looking');
  }
  if (monsterAt(bot, PIP).row !== MON_ROW) throw new Error(`level 2: Pip should rest on the last crate (row ${MON_ROW}); row ${monsterAt(bot, PIP).row}`);
  await must(bot, hit(bot, 8), 'the last hit');
  for (const r of [CORK_ROW, CORK_ROW - 1]) if (cellAt(bot, 19, r) !== 'rubble') throw new Error(`level 2: four hits should break both crates; row ${r} is ${cellAt(bot, 19, r)}`);
  const kitX = bot.px.x;
  const startY = monsterAt(bot, PIP).y;
  bot.sim.press(SCAN.right);
  let slowest = 0;
  for (let i = 0; i < 80 && monsterAt(bot, PIP).row < GROUND - 1; i++) {
    const y0 = monsterAt(bot, PIP).y;
    await must(
      bot,
      bot.tick().then(() => undefined),
      'watching Pip drift',
    );
    slowest = Math.max(slowest, monsterAt(bot, PIP).y - y0);
  }
  bot.sim.release(SCAN.right);
  if (monsterAt(bot, PIP).y <= startY) throw new Error('level 2: Pip should be drifting down');
  if (monsterAt(bot, PIP).row !== GROUND - 1) throw new Error(`level 2: Pip should land on the floor (row ${GROUND - 1}); row ${monsterAt(bot, PIP).row}`);
  if (slowest > 3) throw new Error(`level 2: Pip should drift, not drop (${slowest}px in a tick)`);
  if (bot.px.x - kitX < 14) throw new Error(`level 2: soft Pip should not stop Kit walking through it (${kitX} to ${bot.px.x})`);
  bot.say(`Pip drifted down through Kit, at most ${slowest}px a tick`);
  await must(bot, bot.walk(26, 'the third sign'), 'to the third sign');
  await must(bot, bot.wait(READ), 'reading');
  await must(bot, bot.walk(34, 'the coins'), 'to the coins');
  await must(bot, bot.walk(37, 'the last coin'), 'to the last coin');
  coins(bot, score, 6, 'level 2 before the exit');
  await leave(bot, bot.walk(43, 'the exit'), 'the exit');
}

export { ORIGIN };
