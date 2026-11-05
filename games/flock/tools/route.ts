// The way through the game, as orders for the bot (kit/starter/bot.ts): the keys a person
// would press, level by level, taking every coin on the way. Each sign's lesson is acted out
// once: in level 1 Kit reads the signs while the five birds fly right and back, and the V never
// changes; in level 2 the two gold birds pull away and the V comes apart.
// The checks here fail if anything else happens.
import type { Result, StarterBot } from '../../kit/starter/bot';
import { ORIGIN } from '../../kit/starter/map';
import { BIRD, QUICK } from '../src/monsters';

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

/** Every coin is 10 points: a level that should give `n` coins must have. */
function coins(bot: StarterBot, from: number, n: number, what: string): void {
  const got = (bot.sim.ci.score - from) / 10;
  if (got !== n) {
    const left: string[] = [];
    const coin = bot.sim.w.bg.findIndex((b) => b.scorePts === 10);
    for (let y = 0; y < 100; y++) for (let x = 0; x < 100; x++) if (bot.sim.w.map[y * 100 + x] === coin) left.push(`${x - ORIGIN},${y - ORIGIN}`);
    throw new Error(`${what}: ${got} of ${n} coins; left at ${left.join(' ')}`);
  }
}

/** A person stopped at a sign for a moment to read it. */
const READ = 40;

/** The five birds' positions in level pixels (left and top), left to right as they were placed. */
export function birdsAt(bot: StarterBot): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = [];
  bot.sim.w.mm.forEach((m, i) => {
    if (m.monnum !== BIRD && m.monnum !== QUICK) return;
    const mi = bot.sim.w.mi[i];
    out.push({ x: (mi.curx[0] - ORIGIN) * 20 + mi.curx[1], y: (mi.cury[0] - ORIGIN) * 20 + mi.cury[1] });
  });
  return out;
}

/** How far the birds are from the shape they started in: the largest change in any bird's offset from the first bird, in pixels. */
export function drift(bot: StarterBot, start: { x: number; y: number }[]): number {
  const now = birdsAt(bot);
  if (now.length !== 5 || start.length !== 5) throw new Error(`expected five birds, found ${now.length}`);
  return Math.max(...now.map((b, i) => Math.max(Math.abs(b.x - now[0].x - (start[i].x - start[0].x)), Math.abs(b.y - now[0].y - (start[i].y - start[0].y)))));
}

/** 1. One Shape: the birds fly right and back while Kit reads; the V never changes. */
export async function oneShape(bot: StarterBot): Promise<void> {
  const score = bot.sim.ci.score;
  const start = birdsAt(bot);
  let worst = 0;
  const look = (what: string) => {
    worst = Math.max(worst, drift(bot, start));
    if (worst > 2) throw new Error(`level 1 ${what}: the V should hold; it drifted ${worst}px`);
  };
  await must(bot, bot.walk(8, 'the first sign'), 'to the first sign');
  await must(bot, bot.wait(READ), 'reading');
  look('at the first sign');
  await must(bot, bot.walk(14, 'the second sign'), 'to the second sign');
  await must(bot, bot.wait(READ), 'reading');
  look('at the second sign');
  const moved = Math.abs(birdsAt(bot)[0].x - start[0].x);
  if (moved < 40) throw new Error(`level 1: the birds should be flying; only ${moved}px so far`);
  bot.say(`The V holds, ${worst}px of drift after the birds flew ${moved}px`);
  await must(bot, bot.walk(20, 'under the flock'), 'under the flock');
  look('under the flock');
  await must(bot, bot.wait(200), 'watching the birds turn');
  look('after the turn');
  coins(bot, score, 2, 'level 1 under the flock');
  await must(bot, bot.walk(27, 'over the hill'), 'over the hill');
  await must(bot, bot.walk(34, 'on'), 'on');
  look('at the end');
  coins(bot, score, 6, 'level 1 before the exit');
  await leave(bot, bot.walk(43, 'the exit'), 'the exit');
}

/** 2. Out of Step: the gold birds pull away and the V comes apart. */
export async function outOfStep(bot: StarterBot): Promise<void> {
  const score = bot.sim.ci.score;
  const start = birdsAt(bot);
  if (drift(bot, start) !== 0) throw new Error('level 2: the birds should begin in a V');
  await must(bot, bot.wait(READ), 'reading the first sign');
  await must(bot, bot.walk(8, 'the first sign'), 'to the first sign');
  await must(bot, bot.wait(READ), 'reading');
  await must(bot, bot.walk(14, 'the second sign'), 'to the second sign');
  await must(bot, bot.wait(READ), 'reading');
  let worst = drift(bot, start);
  if (worst < 20) throw new Error(`level 2: the V should be coming apart by the second sign; ${worst}px`);
  await must(bot, bot.walk(21, 'the coins'), 'to the coins');
  await must(bot, bot.walk(33, 'across'), 'across');
  worst = Math.max(worst, drift(bot, start));
  bot.say(`The V came apart: up to ${worst}px out of shape`);
  coins(bot, score, 8, 'level 2 before the exit');
  await leave(bot, bot.walk(43, 'the exit'), 'the exit');
}

export { ORIGIN };
