// The way through the game, as orders for the bot (kit/starter/bot.ts): the keys a person would press, room by
// room. Every level is the same little course laid along another side of a room (src/levels.ts), so one order
// list plays them all in the room's own terms (frame.ts: u along the path, h out from the surface):
//   - Space: he rises off the surface about three blocks and the pull brings him back to where he stood
//   - the first block stops him (walking into it), then he jumps it
//   - each block he jumps (forward key held in the air), each trench he jumps across; the coins on the way
//   - the way out: the door at the end
// and it checks that the arrow that walks him forward is the one that points that way on the screen.
import type { Result, StarterBot } from '../../kit/starter/bot';
import { SCAN } from '../../kit/starter/ids';
import { backKey, forwardKey } from '../src/hero';
import { EXIT_U, buildLevels, type Level } from '../src/levels';

const { levels } = buildLevels();

async function must(bot: StarterBot, r: Promise<Result>, what: string): Promise<void> {
  const out = await r;
  if (out) throw new Error(`${what}: ${out}\n${bot.log.slice(-8).join('\n')}`);
}

/** A person's look at what just happened, in ticks (about a second and a half). */
const LOOK = 40;
const BEAT = 8;
const COIN = 10;

/** Where he is: u steps along the path and h blocks out from the surface (fractions of a block). */
const at = (bot: StarterBot, l: Level) => {
  const p = bot.px;
  return l.frame.place(p.x, p.y);
};

/** Waits until he has stopped moving out from (or toward) the surface: standing on it. */
async function settle(bot: StarterBot, l: Level, max = 120): Promise<Result> {
  let last = at(bot, l).h;
  let still = 0;
  for (let i = 0; i < max; i++) {
    const r = await bot.tick();
    if (r) return r;
    const h = at(bot, l).h;
    still = h === last ? still + 1 : 0;
    last = h;
    if (still >= 4) return undefined;
  }
  return 'never settled';
}

/** Holds the forward arrow until he is at step `u` (or has gone past). */
async function walkTo(bot: StarterBot, l: Level, u: number, what: string): Promise<Result> {
  const key = SCAN[forwardKey(l.frame)];
  bot.sim.press(key);
  for (let t = 0; t < 900 && at(bot, l).u < u; t++) {
    const r = await bot.tick();
    if (r) return (bot.sim.releaseAll(), r);
  }
  bot.sim.release(key);
  const r = await settle(bot, l);
  if (r) return r;
  if (at(bot, l).u < u - 0.3) return `${what}: stopped at u ${at(bot, l).u.toFixed(2)}, not ${u}`;
  return undefined;
}

/** Walks forward into whatever is in the way and reports where he stops. */
async function bump(bot: StarterBot, l: Level, what: string): Promise<number> {
  const key = SCAN[forwardKey(l.frame)];
  bot.sim.press(key);
  let still = 0;
  let last = at(bot, l).u;
  for (let t = 0; t < 400 && still < 6; t++) {
    const r = await bot.tick();
    if (r) throw new Error(`${what}: ${r}`);
    const u = at(bot, l).u;
    still = u === last ? still + 1 : 0;
    last = u;
  }
  bot.sim.release(key);
  if (still < 6) throw new Error(`${what}: never stopped`);
  return last;
}

/** Space, then the forward arrow held until step `landU`, then he waits to come down. */
async function leap(bot: StarterBot, l: Level, landU: number, what: string): Promise<Result> {
  const key = SCAN[forwardKey(l.frame)];
  bot.sim.press(SCAN.space);
  let r = await bot.wait(2);
  bot.sim.release(SCAN.space);
  if (r) return r;
  bot.sim.press(key);
  for (let t = 0; t < 70 && at(bot, l).u < landU; t++) {
    r = await bot.tick();
    if (r) return (bot.sim.releaseAll(), r);
  }
  bot.sim.release(key);
  r = await settle(bot, l);
  if (r) return r;
  if (Math.abs(at(bot, l).h) > 0.05) return `${what}: did not land on the surface (h ${at(bot, l).h.toFixed(2)})`;
  if (at(bot, l).u < landU - 0.6) return `${what}: stopped at u ${at(bot, l).u.toFixed(2)}, short of ${landU}`;
  bot.say(`${what}: leapt to u ${at(bot, l).u.toFixed(1)}`);
  return undefined;
}

/** The whole level `index`. */
export async function playLevel(bot: StarterBot, index: number): Promise<void> {
  const l = levels[index];
  const { course } = l;
  const score = bot.sim.ci.score;
  await must(bot, settle(bot, l), 'standing at the entrance');
  // the arrows really are the ones that point that way on the screen
  bot.say(`${l.title}: forward is ${forwardKey(l.frame)}, back is ${backKey(l.frame)}`);

  // Space, once, in place: he rises off the surface and the pull brings him back
  await must(bot, walkTo(bot, l, 6, 'the first sign'), 'to the first sign');
  const u0 = at(bot, l).u;
  bot.sim.press(SCAN.space);
  let top = 0;
  for (let t = 0; t < 30; t++) {
    if (t === 2) bot.sim.release(SCAN.space);
    const r = await bot.tick();
    if (r) throw new Error(`jumping: ${r}`);
    top = Math.max(top, at(bot, l).h);
  }
  await must(bot, settle(bot, l), 'coming down');
  if (top < 2.5) throw new Error(`Space should lift him off the surface over two blocks; he rose ${top.toFixed(2)}`);
  if (at(bot, l).h !== 0 || Math.abs(at(bot, l).u - u0) > 0.05)
    throw new Error(`the pull should bring him straight back down to the surface, not to u ${at(bot, l).u} h ${at(bot, l).h}`);
  bot.say(`jumped ${top.toFixed(1)} blocks off the surface and the pull brought him back`);
  await must(bot, bot.wait(LOOK), 'watching');

  // the obstacles in order along the path
  const todo: { u: number; kind: 'block' | 'trench'; end: number; n: number }[] = [
    ...course.blocks.map(([u, n]) => ({ u, kind: 'block' as const, end: u, n })),
    ...course.trenches.map(([a, b]) => ({ u: a, kind: 'trench' as const, end: b, n: 0 })),
  ].sort((a, b) => a.u - b.u);
  // two blocks side by side are one obstacle
  const merged: typeof todo = [];
  for (const o of todo) {
    const prev = merged[merged.length - 1];
    if (prev && prev.kind === 'block' && o.kind === 'block' && o.u === prev.end + 1) {
      prev.end = o.u;
      prev.n = Math.max(prev.n, o.n);
    } else merged.push({ ...o });
  }
  let first = true;
  for (const o of merged) {
    if (o.kind === 'block') {
      await must(bot, walkTo(bot, l, o.u - 4, 'before the block'), 'to the block');
      if (first) {
        // the first block, walked into: it stops him
        const stop = await bump(bot, l, 'into the block');
        if (stop > o.u - 1 + 0.15) throw new Error(`the block should stop him at u ${o.u - 1}; he reached ${stop.toFixed(2)}`);
        bot.say(`stopped by the block at u ${stop.toFixed(2)}`);
        await must(bot, bot.wait(LOOK), 'looking at the block');
        first = false;
        await must(bot, leap(bot, l, o.end + 2.2, 'over the block'), 'over the block');
      } else {
        await must(bot, walkTo(bot, l, o.u - 1.6, 'at the block'), 'to the foot of the block');
        await must(bot, leap(bot, l, o.end + 2.2, 'over the block'), 'over the block');
      }
    } else {
      await must(bot, walkTo(bot, l, o.u - 1.2, 'at the trench'), 'to the trench');
      await must(bot, leap(bot, l, o.end + 2, 'across the trench'), 'across the trench');
    }
    await must(bot, bot.wait(BEAT), 'a beat');
  }

  // the way out
  const r = await walkTo(bot, l, EXIT_U + 1, 'the door');
  if (r && r !== 'link' && r !== 'end') throw new Error(`the door: ${r}\n${bot.log.slice(-8).join('\n')}`);
  const got = (bot.sim.ci.score - score) / COIN;
  if (got !== course.coins.length) throw new Error(`${l.title}: ${got} of ${course.coins.length} coins`);
}
