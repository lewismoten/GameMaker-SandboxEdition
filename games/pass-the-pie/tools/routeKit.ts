// The bot's moves for PASS THE PIE (route.ts strings them into levels): the keys a person would press, with human
// timing: a sign gets a look, a moving thing is watched before a hop or a toss, a combo is a tap of Enter.
import { LASTMON } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import type { Result, StarterBot } from '../../kit/starter/bot';
import { ORIGIN } from '../../kit/starter/map';
import { SCAN_ENTER } from '../src/plumeChar';

/** A person's look at a sign, in ticks (about two seconds). */
export const READ = 36;

export async function must(bot: StarterBot, r: Promise<Result>, what: string): Promise<void> {
  const out = await r;
  if (out) throw new Error(`${what}: ${out}\n${bot.log.slice(-8).join('\n')}`);
}

/** The last order of a level: it must take the hero through the door (to the next level or the ending). */
export async function leave(bot: StarterBot, r: Promise<Result>, what: string): Promise<void> {
  const out = await r;
  if (out !== 'link' && out !== 'end') throw new Error(`${what}: ${out ?? 'still here'}\n${bot.log.slice(-8).join('\n')}`);
}

export async function read(bot: StarterBot, x: number, what: string): Promise<void> {
  await must(bot, bot.walk(x, `the ${what} sign`), `to the ${what} sign`);
  await must(bot, bot.wait(READ), `reading the ${what} sign`);
}

/** Walks to `x`, jumping when something stops it; notes any bump. */
export async function cross(bot: StarterBot, x: number, what: string): Promise<void> {
  const hp = bot.sim.ci.hitpts;
  await must(bot, bot.walk(x, what, 900, { jumpWhenJittering: true }), what);
  if (bot.sim.ci.hitpts < hp) bot.say(`${what}: bumped, hit points ${hp} -> ${bot.sim.ci.hitpts}`);
}

/** A running jump from where he stands, steering `dir` until he has gone to column `to`. */
export async function leap(bot: StarterBot, dir: 'left' | 'right', to: number, what: string): Promise<void> {
  await must(bot, bot.jump(dir, to), what);
  await must(bot, bot.land(), `landing ${what}`);
}

export interface Seen {
  x: number;
  y: number;
  n: number;
}

/** The live monsters of the given numbers: left edge in level pixels, row in level blocks. */
export function monsters(bot: StarterBot, nums: readonly number[]): Seen[] {
  const w = bot.sim.w;
  const out: Seen[] = [];
  w.mm.forEach((m, i) => {
    if (m.monnum === LASTMON || !nums.includes(m.monnum)) return;
    const mi = w.mi[i];
    out.push({ x: (mi.curx[0] - ORIGIN) * 20 + mi.curx[1], y: mi.cury[0] - ORIGIN, n: m.monnum });
  });
  return out;
}

/** Enter tapped like a person (a combo or a toss), then the move plays out. */
export async function enter(bot: StarterBot, after = 16): Promise<void> {
  bot.sim.press(SCAN_ENTER);
  await must(bot, bot.wait(3), 'Enter');
  bot.sim.release(SCAN_ENTER);
  await must(bot, bot.wait(after), 'the move');
}

/** Faces `dir` with a short tap of the arrow (the move flies the way he last moved). */
export async function face(bot: StarterBot, dir: 'left' | 'right'): Promise<void> {
  const scan = dir === 'right' ? 77 : 75;
  bot.sim.press(scan);
  await must(bot, bot.wait(1), 'turning');
  bot.sim.release(scan);
  await must(bot, bot.wait(2), 'turning');
}

/**
 * Waits for one of `nums` on row `row` to come toward him within `reach` pixels (watching it, as a person would),
 * then presses Enter; repeats until none is left within `near` pixels. Throws if one gets past.
 */
export async function meet(bot: StarterBot, nums: readonly number[], row: number, what: string, reach = 50, near = 160, max = 900): Promise<void> {
  let last: number | undefined;
  for (let t = 0; t < max; t++) {
    const me = bot.px.x;
    const around = monsters(bot, nums).filter((m) => Math.abs(m.x - me) < near && Math.abs(m.y - row) <= 4);
    if (!around.length) return bot.say(`${what}: done, hit points ${bot.sim.ci.hitpts}, score ${bot.sim.ci.score}`);
    const all = around.filter((m) => m.y === row);
    if (!all.length) {
      await must(bot, bot.tick(), `watching ${what}`);
      last = undefined;
      continue;
    }
    const v = all.sort((a, b) => Math.abs(a.x - me) - Math.abs(b.x - me))[0];
    const ahead = v.x > me;
    const dist = Math.abs(v.x - me);
    const coming = last !== undefined && (ahead ? v.x < last : v.x > last);
    const still = last !== undefined && v.x === last;
    last = v.x;
    if (dist <= reach && (coming || still || dist <= 28)) {
      if (process.env.DEBUG_SMASH) bot.say(`meet: me ${me} it ${v.x} hp ${bot.sim.ci.hitpts} ${JSON.stringify(monsters(bot, [20, 21]))}`);
      await face(bot, ahead ? 'right' : 'left');
      await enter(bot);
      last = undefined;
    } else await must(bot, bot.tick(), `waiting for ${what}`);
  }
  throw new Error(`${what}: still there after ${max} ticks\n${bot.log.slice(-6).join('\n')}`);
}

/**
 * Up onto a fed vacuum or mower (one of `nums`, the nearest), then a second jump on up to the ledge above, steering
 * `dir` until column `to`.
 */
export async function stepUp(bot: StarterBot, nums: readonly number[], dir: 'left' | 'right', to: number, what: string): Promise<void> {
  const me = bot.px.x;
  const step = monsters(bot, nums).sort((a, b) => Math.abs(a.x - me) - Math.abs(b.x - me))[0];
  if (!step) throw new Error(`${what}: nothing to step on`);
  const from = Math.round((step.x + (dir === 'right' ? -30 : 30)) / 20);
  await must(bot, bot.walk(from, `before ${what}`), `before ${what}`);
  await leap(bot, dir, Math.round(step.x / 20), `onto ${what}`);
  if (bot.px.y > (step.y - 1) * 20 + 4) throw new Error(`${what}: did not land on it (at ${bot.px.x}, ${bot.px.y})`);
  await leap(bot, dir, to, `up from ${what}`);
  bot.say(`up from ${what} to ${bot.px.x}, ${bot.px.y}`);
}

/**
 * Mr. Plume walks up to the thing standing at column `x` (row `row`) and lets combos go until nothing of `nums` is
 * left there; `combos` presses expected (a combo is three hits).
 */
export async function smash(bot: StarterBot, x: number, nums: readonly number[], combos: number, what: string, row: number, dir: 'left' | 'right' = 'right'): Promise<void> {
  await must(bot, bot.walk(dir === 'right' ? x - 1 : x + 1, what, 900), `to ${what}`);
  const there = () => monsters(bot, nums).some((m) => m.y === row && Math.abs(m.x - x * 20) < 24);
  let n = 0;
  while (there()) {
    if (++n > combos + 1) throw new Error(`${what}: still standing after ${n - 1} combos\n${bot.log.slice(-6).join('\n')}`);
    await face(bot, dir);
    await enter(bot, 22);
    if (process.env.DEBUG_SMASH) bot.say(`after combo ${n}: me ${bot.px.x},${bot.px.y} seq ${bot.sim.w.ci.cseq} ${JSON.stringify(monsters(bot, [...nums, 2, 34]))}`);
  }
  if (n !== combos) bot.say(`${what}: took ${n} combos, not ${combos}`);
  bot.say(`smashed ${what} (${n}), score ${bot.sim.ci.score}, hit points ${bot.sim.ci.hitpts}`);
}

/** Up a ladder or trunk at column `x` until his top edge is at row `row`. */
export async function climb(bot: StarterBot, x: number, row: number, what: string): Promise<void> {
  await must(bot, bot.walk(x, what), `to ${what}`);
  await must(bot, bot.climb('up', row, what), `up ${what}`);
}

/** Through a gate (the dish or a key opens it). */
export async function through(bot: StarterBot, gate: number, what: string): Promise<void> {
  await cross(bot, gate - 1, what);
  await must(bot, bot.wait(20), `at ${what}`);
  await cross(bot, gate + 2, `through ${what}`);
}

/** Through a gate and out of the street. */
export async function door(bot: StarterBot, gate: number, exit: number, what: string): Promise<void> {
  await through(bot, gate, what);
  await leave(bot, bot.walk(exit + 1, 'the exit'), 'the exit');
}
