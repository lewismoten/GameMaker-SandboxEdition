// The way through the game, as orders for the bot (kit/starter/bot.ts): the keys a person
// would press, level by level, taking every coin on the way. Each sign's lesson is acted out,
// the mistake included, once: in level 1 Kit first tries to hop over Plop (the mound's roof stops him),
// then walks into the crate and Plop drops into the dip; in level 2 he walks into the two crates, stops
// inside the tunnel and lets soft Pip drift down through him. The checks here fail if anything else happens.
import { SCAN } from '../../kit/starter/ids';
import type { Result, StarterBot } from '../../kit/starter/bot';
import { ORIGIN } from '../../kit/starter/map';
import { CORK_ROW, GROUND, MON_ROW } from '../src/levels';
import { PIP, PLOP } from '../src/monsters';

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
    await must(bot, bot.tick().then(() => undefined), 'hopping');
    highest = Math.min(highest, bot.px.y);
  }
  bot.sim.release(SCAN.space);
  await must(bot, bot.land(), 'landing');
  if (floor - highest > 24) throw new Error(`level 1: the roof should stop Kit hopping (rose ${floor - highest}px)`);
  bot.say(`Kit could not hop over Plop: the roof stopped him after ${floor - highest}px`);
  // the real way: walk into the crate. It breaks, Plop drops into the dip.
  await must(bot, bot.walk(23, 'the crate'), 'to the crate');
  await must(bot, push(bot, 14), 'bumping the crate');
  await must(bot, bot.wait(10), 'watching Plop');
  const p = monsterAt(bot, PLOP);
  if (p.row !== GROUND) throw new Error(`level 1: Plop should have dropped into the dip (row ${GROUND}); row ${p.row}`);
  if (bot.sim.w.map[(CORK_ROW + ORIGIN) * 100 + 24 + ORIGIN] === undefined) throw new Error('level 1: no map');
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
  await must(bot, bot.walk(17, 'the tunnel'), 'to the tunnel');
  const top = monsterAt(bot, PIP).row;
  if (top !== MON_ROW - 1) throw new Error(`level 2: Pip should sit on two crates (row ${MON_ROW - 1}); row ${top}`);
  // bump the crates, then stand still: Pip is soft, so it drifts down through Kit
  await must(bot, push(bot, 9), 'bumping the crates');
  const kitX = bot.px.x;
  const startY = monsterAt(bot, PIP).y;
  await must(bot, bot.wait(8), 'watching Pip start');
  if (monsterAt(bot, PIP).y <= startY) throw new Error('level 2: Pip should be drifting down');
  let slowest = 0;
  for (let i = 0; i < 80 && monsterAt(bot, PIP).row < GROUND - 1; i++) {
    const y0 = monsterAt(bot, PIP).y;
    await must(bot, bot.tick().then(() => undefined), 'watching Pip drift');
    slowest = Math.max(slowest, monsterAt(bot, PIP).y - y0);
  }
  if (monsterAt(bot, PIP).row !== GROUND - 1) throw new Error(`level 2: Pip should land on the floor (row ${GROUND - 1}); row ${monsterAt(bot, PIP).row}`);
  if (slowest > 3) throw new Error(`level 2: Pip should drift, not drop (${slowest}px in a tick)`);
  if (Math.abs(bot.px.x - kitX) > 12) throw new Error(`level 2: soft Pip should not push Kit (${kitX} to ${bot.px.x})`);
  bot.say(`Pip drifted down through Kit, at most ${slowest}px a tick`);
  await must(bot, bot.walk(26, 'the third sign'), 'to the third sign');
  await must(bot, bot.wait(READ), 'reading');
  await must(bot, bot.walk(34, 'the coins'), 'to the coins');
  await must(bot, bot.walk(37, 'the last coin'), 'to the last coin');
  coins(bot, score, 6, 'level 2 before the exit');
  await leave(bot, bot.walk(43, 'the exit'), 'the exit');
}

export { ORIGIN };
