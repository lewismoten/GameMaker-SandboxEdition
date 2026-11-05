// The way through the game, as orders for the bot (kit/starter/bot.ts): the keys a person
// would press, level by level, taking every coin on the way. Each sign's lesson is acted out,
// the mistake included, once: in level 1 Kit runs ahead and Puff falls behind, then catches up when
// he stops; in level 2 Kit stands on the ledge and Puff, flying straight at him, is stopped under it.
// The checks here fail if anything else happens.
import type { Result, StarterBot } from '../../kit/starter/bot';
import { ORIGIN } from '../../kit/starter/map';
import { LEDGE, LEDGE_END } from '../src/levels';
import { PUFF } from '../src/monsters';

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

/** Puff's position in level pixels (left and top), and Kit's, so the two can be compared. */
export function puffAt(bot: StarterBot): { x: number; y: number } {
  const i = bot.sim.w.mm.findIndex((m) => m.monnum === PUFF);
  if (i < 0) throw new Error('Puff is not in the level');
  const m = bot.sim.w.mi[i];
  return { x: (m.curx[0] - ORIGIN) * 20 + m.curx[1], y: (m.cury[0] - ORIGIN) * 20 + m.cury[1] };
}

/** How many pixels apart Puff and Kit are across (left and right). */
export function gap(bot: StarterBot): number {
  return Math.abs(puffAt(bot).x - bot.px.x);
}

/** 1. Puff Follows: Puff comes to Kit while he reads, falls behind when he runs, and catches up when he stops. */
export async function puffFollows(bot: StarterBot): Promise<void> {
  const score = bot.sim.ci.score;
  if (gap(bot) < 60) throw new Error(`level 1: Puff should start a few blocks away; ${gap(bot)}px`);
  await must(bot, bot.walk(8, 'the first sign'), 'to the first sign');
  await must(bot, bot.wait(READ), 'reading');
  if (gap(bot) > 25) throw new Error(`level 1: Puff should have flown to Kit by now; ${gap(bot)}px`);
  bot.say(`Puff is with Kit, ${gap(bot)}px`);
  await must(bot, bot.walk(16, 'the second sign'), 'to the second sign');
  await must(bot, bot.wait(READ), 'reading');
  // run ahead: Puff is slower than Kit, so it falls behind
  await must(bot, bot.walk(20, 'ahead'), 'running ahead');
  await must(bot, bot.walk(34, 'further ahead'), 'running further ahead');
  const behind = gap(bot);
  if (behind < 40) throw new Error(`level 1: Puff should fall behind while Kit runs; only ${behind}px`);
  bot.say(`Puff fell ${behind}px behind`);
  await must(bot, bot.wait(120), 'letting Puff catch up');
  if (gap(bot) > 25) throw new Error(`level 1: Puff should catch up when Kit stops; ${gap(bot)}px`);
  bot.say(`Puff caught up, ${gap(bot)}px`);
  coins(bot, score, 6, 'level 1 before the exit');
  await leave(bot, bot.walk(43, 'the exit'), 'the exit');
}

/** 2. Out of Reach: Kit stands above Puff; Puff stays under the ledge until Kit steps off its end. */
export async function outOfReach(bot: StarterBot): Promise<void> {
  const score = bot.sim.ci.score;
  const under = (what: string) => {
    const p = puffAt(bot);
    if (p.y < (LEDGE + 1) * 20) throw new Error(`level 2 ${what}: Puff got on top of the ledge (y ${p.y})`);
  };
  await must(bot, bot.wait(READ), 'reading the first sign');
  await must(bot, bot.walk(8, 'the first sign'), 'to the first sign');
  await must(bot, bot.wait(READ), 'reading');
  under('at the first sign');
  if (gap(bot) > 30) throw new Error(`level 2: Puff should wait right under Kit; ${gap(bot)}px`);
  bot.say(`Puff waits under the ledge, ${gap(bot)}px from Kit`);
  await must(bot, bot.walk(16, 'the second sign'), 'to the second sign');
  await must(bot, bot.wait(READ), 'reading');
  under('at the second sign');
  await must(bot, bot.walk(LEDGE_END, 'the end of the ledge'), 'to the end of the ledge');
  under('at the end of the ledge');
  await must(bot, bot.walk(LEDGE_END + 3, 'off the ledge'), 'off the ledge');
  await must(bot, bot.wait(100), 'a moment on the ground');
  if (gap(bot) > 30) throw new Error(`level 2: Puff should follow once Kit is down; ${gap(bot)}px`);
  bot.say('Puff came out and caught up');
  await must(bot, bot.walk(33, 'the coins'), 'to the coins');
  coins(bot, score, 6, 'level 2 before the exit');
  await leave(bot, bot.walk(43, 'the exit'), 'the exit');
}

export { ORIGIN };
