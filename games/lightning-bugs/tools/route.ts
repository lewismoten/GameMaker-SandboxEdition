// The way through the game, as orders for the bot (kit/starter/bot.ts): the keys a person would press, level by level.
// The fireflies are the lesson, so the bot stops under them and counts what they do, tick by tick, from the monsters the engine
// shows (each one's frame and where it is):
//   level 1: the six copies are at the same frame and the same place on their loop at every tick, and they light up together;
//            the six of their own kinds are never in step and never all lit at once, and most of them flash while you watch
//   level 2: over the meadow the fireflies in view are never in step or all lit at once, more than half of them are lit at
//            only a few ticks (a chance meeting, as in a real meadow), and some firefly is lit most of the time
import { monPicNum } from '@lewismoten/gamemaker-sandbox-engine/engine/monsters';
import type { Result, StarterBot } from '../../kit/starter/bot';
import { BUG } from '../src/bugs';
import { DUSK_ROOM, STEP_ROOM } from '../src/levels';

/** A person's look at what just happened, in ticks (about two seconds). */
const LOOK = 40;
/** The frames, by their place in bugs.mbl: dark, ember, dim, bright. A firefly is lit when it shows dim or bright. */
const LIT = 2;

async function must(bot: StarterBot, r: Promise<Result>, what: string): Promise<void> {
  const out = await r;
  if (out) throw new Error(`${what}: ${out}\n${bot.log.slice(-8).join('\n')}`);
}

/** The last order of a level: it must take the hero through the door (to the next level or the ending). */
async function leave(bot: StarterBot, r: Promise<Result>, what: string): Promise<void> {
  const out = await r;
  if (out !== 'link' && out !== 'end') throw new Error(`${what}: ${out ?? 'still here'}\n${bot.log.slice(-8).join('\n')}`);
}

/** A firefly as the engine has it now: its monster, where it started, how far it has gone from there (pixels) and its frame. */
interface Seen {
  slot: number;
  monnum: number;
  dx: number;
  dy: number;
  frame: number;
}

/** The fireflies of `which` (the in-step copies, or any other) that started within 8 blocks of the hero. */
function fireflies(bot: StarterBot, which: 'step' | 'kinds'): Seen[] {
  const w = bot.sim.w;
  const x = bot.sim.pos.x;
  const out: Seen[] = [];
  w.mm.forEach((m, slot) => {
    if (m.monnum >= 64 || (m.monnum === BUG.step) !== (which === 'step') || Math.abs(m.curx - x) > 8) return;
    const mi = w.mi[slot];
    out.push({ slot, monnum: m.monnum, dx: (mi.curx[0] - m.curx) * 20 + mi.curx[1], dy: (mi.cury[0] - m.cury) * 20 + mi.cury[1], frame: monPicNum(w, slot) });
  });
  return out;
}

interface Watched {
  /** How many fireflies were in view. */
  count: number;
  /** Ticks at which every one was at the same frame and the same place on its loop. */
  inStep: number;
  /** The most that were lit at one tick, as a share of those in view. */
  mostLit: number;
  /** Ticks at which more than half were lit. */
  overHalf: number;
  /** Ticks at which at least one was lit. */
  litTicks: number;
  /** The fireflies (by slot) that were lit at some tick. */
  flashed: Set<number>;
}

/** Watches the fireflies of `which` near the hero for `ticks` ticks. */
async function watch(bot: StarterBot, which: 'step' | 'kinds', ticks: number): Promise<Watched> {
  const r: Watched = { count: 0, inStep: 0, mostLit: 0, overHalf: 0, litTicks: 0, flashed: new Set() };
  for (let t = 0; t < ticks; t++) {
    const seen = fireflies(bot, which);
    r.count = Math.max(r.count, seen.length);
    const [a] = seen;
    if (seen.length > 1 && seen.every((s) => s.frame === a.frame && s.dx === a.dx && s.dy === a.dy)) r.inStep++;
    const lit = seen.filter((s) => s.frame >= LIT);
    lit.forEach((s) => r.flashed.add(s.slot));
    if (lit.length) r.litTicks++;
    r.mostLit = Math.max(r.mostLit, lit.length / Math.max(1, seen.length));
    if (lit.length * 2 > seen.length) r.overHalf++;
    await must(bot, bot.tick(), 'watching the fireflies');
  }
  return r;
}

const pct = (n: number) => `${Math.round(n * 100)}%`;

/** 1. In Step: the copies blink and fly as one; the six kinds do not. */
export async function inStep(bot: StarterBot): Promise<void> {
  await must(bot, bot.wait(LOOK), 'reading the first sign');
  await must(bot, bot.walk(STEP_ROOM.copies[2][0] + 1, 'under the copies'), 'to the copies');
  const copies = await watch(bot, 'step', 150);
  if (copies.count !== STEP_ROOM.copies.length) throw new Error(`level 1: the six copies should be near, not ${copies.count}`);
  if (copies.inStep !== 150) throw new Error(`level 1: the copies should be at the same frame and place at every tick, not ${copies.inStep} of 150`);
  if (copies.mostLit !== 1 || !copies.litTicks) throw new Error('level 1: the copies should light up, all together');
  bot.say(`the copies: ${copies.count}, in step all ${copies.inStep} ticks, lit together for ${copies.litTicks}`);
  await must(bot, bot.walk(STEP_ROOM.signs[1] + 1, 'the middle sign'), 'to the middle sign');
  await must(bot, bot.wait(LOOK), 'reading');
  await must(bot, bot.walk(STEP_ROOM.own[0][0] + 5, 'under the six kinds'), 'to the six kinds');
  const own = await watch(bot, 'kinds', 220);
  if (own.count !== STEP_ROOM.own.length) throw new Error(`level 1: the six kinds should be near, not ${own.count}`);
  if (own.inStep) throw new Error(`level 1: the six kinds should never be in step; they were at ${own.inStep} ticks`);
  if (own.mostLit === 1) throw new Error('level 1: the six kinds should never all be lit at once');
  if (own.overHalf > 220 * 0.1) throw new Error(`level 1: more than half the six kinds should be lit at only a few ticks, not ${own.overHalf} of 220`);
  if (own.flashed.size < 5) throw new Error(`level 1: most of the six kinds should flash while Mara watches, not ${own.flashed.size}`);
  bot.say(`the six kinds: never in step, at most ${pct(own.mostLit)} lit at once, over half lit at ${own.overHalf} of 220 ticks, ${own.flashed.size} flashed`);
  await must(bot, bot.walk(STEP_ROOM.signs[2] + 1, 'the last sign'), 'to the last sign');
  await must(bot, bot.wait(LOOK), 'reading');
  await leave(bot, bot.walk(STEP_ROOM.exit, 'the door'), 'the door');
}

/** 2. Dusk Meadow: a look at each sign and at the fireflies between them. */
export async function duskMeadow(bot: StarterBot): Promise<void> {
  await must(bot, bot.wait(LOOK), 'reading the first sign');
  let flashed = 0;
  for (const [i, x] of [DUSK_ROOM.signs[1] + 1, DUSK_ROOM.signs[2] + 1].entries()) {
    await must(bot, bot.walk(x - 9, 'between the signs'), 'into the meadow');
    const meadow = await watch(bot, 'kinds', 140);
    if (meadow.count < 6) throw new Error(`level 2: the meadow should have fireflies in view, not ${meadow.count}`);
    if (meadow.inStep) throw new Error(`level 2: the fireflies should never be in step; they were at ${meadow.inStep} ticks`);
    if (meadow.mostLit === 1) throw new Error('level 2: the fireflies in view should never all be lit at once');
    if (meadow.overHalf > 140 * 0.1)
      throw new Error(`level 2: more than half the fireflies in view should be lit at only a few ticks, not ${meadow.overHalf} of 140`);
    if (meadow.litTicks < 70) throw new Error(`level 2: some firefly should be lit most of the time, not ${meadow.litTicks} of 140 ticks`);
    flashed += meadow.flashed.size;
    bot.say(
      `the meadow, stop ${i + 1}: ${meadow.count} fireflies, at most ${pct(meadow.mostLit)} lit at once, over half at ${meadow.overHalf} and one or more at ${meadow.litTicks} of 140 ticks`,
    );
    await must(bot, bot.walk(x, 'a sign'), 'to a sign');
    await must(bot, bot.wait(LOOK), 'reading');
  }
  if (flashed < 8) throw new Error(`level 2: the meadow's fireflies should flash while Mara watches; only ${flashed} did`);
  await leave(bot, bot.walk(DUSK_ROOM.exit, 'the door'), 'the door');
}
