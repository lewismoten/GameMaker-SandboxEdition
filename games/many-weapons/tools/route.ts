// The way through the game, as orders for the bot (kit/starter/bot.ts): the keys a person would press,
// level by level, taking every coin on the way. Each sign's lesson is acted out, the mistake included,
// once; the checks here fail if Enter does anything else than the sign says:
//   level 1: Enter with empty pockets shrugs; a pouch gives two stars; the third gumdrop needs the
//            pouch again (the shrug when the stars are gone, then the pouch has filled up)
//   level 2: a star is used up on the frosty grump; a flame from the ledge pouch melts it; with two
//            flames and a star in hand the flames go first, and the star is thrown when they are gone
import type { Result, StarterBot } from '../../kit/starter/bot';
import { ORIGIN } from '../../kit/starter/map';
import { SCAN_ENTER, SEQ_FLAME, SEQ_NONE, SEQ_STAR } from '../src/hero';
import { L1, L2 } from '../src/levels';
import { FLAME, FROSTY, POP_SCORE, STAR, STAR_POUCH, TARGET } from '../src/monsters';

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

/** A person's look at what just happened, in ticks (about a second and a half). */
const LOOK = 40;
/** Ticks a thrown weapon lives (monsters.ts STAR_LIFE) and the sparkle after it, so a throw has finished by then. */
const THROW_WATCH = 60;
const counters = (bot: StarterBot) => ({ flames: bot.sim.ci.meter[SEQ_FLAME], stars: bot.sim.ci.meter[SEQ_STAR] });
const col = (bot: StarterBot) => bot.px.x / 20;
const row = (bot: StarterBot) => bot.px.y / 20;

/** Presses Enter like a person (a tap), then waits for the throw to land or fizzle; returns the sequence one tick after the press. */
async function enter(bot: StarterBot, what: string): Promise<number> {
  bot.sim.press(SCAN_ENTER);
  await must(bot, bot.tick(), 'pressing Enter');
  const seq = bot.sim.w.chr.cseq;
  await must(bot, bot.wait(2), 'pressing Enter');
  bot.sim.release(SCAN_ENTER);
  await must(bot, bot.wait(THROW_WATCH), 'watching the throw');
  bot.say(`Enter ${what}: sequence ${seq}, flames ${counters(bot).flames}, stars ${counters(bot).stars}, score ${bot.sim.ci.score}`);
  return seq;
}

/** Every coin is 10 points and every pop 50: a level that should give `n` coins (and how many `pops`) must have. */
function coins(bot: StarterBot, from: number, n: number, what: string, pops: number): void {
  const got = (bot.sim.ci.score - from - pops * POP_SCORE) / 10;
  if (got !== n) {
    const left: string[] = [];
    const coin = bot.sim.w.bg.findIndex((b) => b.scorePts === 10);
    for (let y = 0; y < 100; y++) for (let x = 0; x < 100; x++) if (bot.sim.w.map[y * 100 + x] === coin) left.push(`${x - ORIGIN},${y - ORIGIN}`);
    throw new Error(`${what}: ${got} of ${n} coins; left at ${left.join(' ')}\n${bot.log.slice(-6).join('\n')}`);
  }
}

/** One throw at `kind`: `weapon` must be the sequence started, `popped` says whether `kind` should lose one. */
async function throwAt(bot: StarterBot, kind: number, weapon: number, popped: boolean, what: string): Promise<void> {
  const before = { left: alive(bot, kind), score: bot.sim.ci.score, c: counters(bot) };
  const seq = await enter(bot, what);
  if (seq !== weapon) throw new Error(`${what}: Enter should start sequence ${weapon}; it started ${seq}`);
  if (alive(bot, STAR) || alive(bot, FLAME)) throw new Error(`${what}: a throw is still flying`);
  const used = weapon === SEQ_STAR ? before.c.stars - counters(bot).stars : weapon === SEQ_FLAME ? before.c.flames - counters(bot).flames : 0;
  if (weapon !== SEQ_NONE && used !== 1) throw new Error(`${what}: a throw should use one count, it used ${used}`);
  if (weapon === SEQ_NONE && (counters(bot).stars !== before.c.stars || counters(bot).flames !== before.c.flames))
    throw new Error(`${what}: the shrug used a count`);
  const gone = before.left - alive(bot, kind);
  if (gone !== (popped ? 1 : 0)) throw new Error(`${what}: expected ${popped ? 'one pop' : 'no pop'}; ${gone} gone`);
  if (bot.sim.ci.score - before.score !== (popped ? POP_SCORE : 0)) throw new Error(`${what}: score ${before.score} -> ${bot.sim.ci.score}`);
}

/** 1. Empty Hands: a shrug with nothing, a pouch for two stars, two pops, a shrug when they are gone, and the pouch again. */
export async function emptyHands(bot: StarterBot): Promise<void> {
  const score = bot.sim.ci.score;
  await must(bot, bot.walk(5, 'the first sign'), 'to the first sign');
  await must(bot, bot.wait(LOOK), 'reading the sign');
  // the first sign: Enter with nothing shrugs
  await throwAt(bot, TARGET, SEQ_NONE, false, 'with empty hands');
  // the pouch: walk into it
  await must(bot, bot.walk(L1.pouch + 1, 'the pouch'), 'to the pouch');
  if (counters(bot).stars !== 2) throw new Error(`the pouch should give two stars; Kit has ${counters(bot).stars}`);
  await must(bot, bot.walk(16, 'the second sign'), 'to the second sign');
  await must(bot, bot.wait(LOOK), 'reading the sign');
  await throwAt(bot, TARGET, SEQ_STAR, true, 'the first star');
  await must(bot, bot.walk(23, 'the near gumdrop'), 'to the next gumdrop');
  await throwAt(bot, TARGET, SEQ_STAR, true, 'the second star');
  // out of stars: the third sign says so, and Enter shrugs again
  await must(bot, bot.walk(29, 'the last gumdrop'), 'to the last gumdrop');
  await must(bot, bot.wait(LOOK), 'reading the sign');
  await throwAt(bot, TARGET, SEQ_NONE, false, 'with no stars left');
  // back to the pouch, which has filled up again by the time Kit is there (the sack stays empty about four seconds)
  await must(bot, bot.walk(L1.pouch + 4, 'back to the pouch'), 'back to the pouch');
  if (alive(bot, STAR_POUCH) !== 1) await must(bot, bot.wait(90), 'waiting for the pouch to fill up');
  await must(bot, bot.walk(L1.pouch, 'the pouch again'), 'to the pouch again');
  if (counters(bot).stars !== 2) throw new Error(`the pouch should have filled up again and given two stars; Kit has ${counters(bot).stars}`);
  await must(bot, bot.walk(29, 'the last gumdrop'), 'to the last gumdrop');
  await throwAt(bot, TARGET, SEQ_STAR, true, 'the star from the full pouch');
  await must(bot, bot.walk(L1.coins[L1.coins.length - 1][0] + 1, 'the far coins'), 'to the far coins');
  bot.say(`score ${bot.sim.ci.score} at column ${col(bot).toFixed(1)}`);
  coins(bot, score, L1.coins.length, 'level 1 before the exit', 3);
  await leave(bot, bot.walk(L1.exit, 'the exit'), 'the exit');
}

/** 2. Star or Flame: a star cannot melt the frosty grump, a flame can, flames go before stars. */
export async function starOrFlame(bot: StarterBot): Promise<void> {
  const score = bot.sim.ci.score;
  // counters carry over from level 1: a star may be left in his pocket, and no flames
  const carried = counters(bot);
  if (carried.flames !== 0) throw new Error(`Kit should arrive with no flames, he has ${carried.flames}`);
  await must(bot, bot.walk(5, 'the first sign'), 'to the first sign');
  await must(bot, bot.wait(LOOK), 'reading the sign');
  await must(bot, bot.walk(L2.starPouch + 1, 'the star pouch'), 'to the star pouch');
  if (counters(bot).stars !== carried.stars + 2) throw new Error(`the pouch should add two stars to ${carried.stars}; Kit has ${counters(bot).stars}`);
  await must(bot, bot.walk(21, 'the frosty grump'), 'to the frosty grump');
  // the first sign: a star cannot melt frost
  await throwAt(bot, FROSTY, SEQ_STAR, false, 'a star at the frosty grump');
  if (alive(bot, FROSTY) !== 2) throw new Error('the star should not have melted the frosty grump');
  // the flame pouch is up on the ledge: a jump up, from the left
  await must(bot, bot.walk(13, 'the flame sign'), 'to the flame sign');
  await must(bot, bot.wait(LOOK), 'reading the sign');
  await must(bot, bot.walk(L2.ledge[0] - 1, 'under the ledge'), 'under the ledge');
  await must(bot, bot.jump('right', L2.flamePouch), 'up to the ledge');
  if (counters(bot).flames !== 2)
    throw new Error(`the flame pouch should give two flames; Kit has ${counters(bot).flames} (he is at ${col(bot).toFixed(1)}, ${row(bot).toFixed(1)})`);
  await must(bot, bot.walk(21, 'the order sign'), 'to the order sign');
  await must(bot, bot.wait(LOOK), 'reading the sign');
  // flames go first, though a star is in his pocket too
  await throwAt(bot, FROSTY, SEQ_FLAME, true, 'the first flame');
  await must(bot, bot.walk(23, 'closer'), 'closer');
  await throwAt(bot, FROSTY, SEQ_FLAME, true, 'the second flame');
  if (alive(bot, FROSTY)) throw new Error('both frosty grumps should have melted');
  // flames gone: a star
  await must(bot, bot.walk(34, 'through the tunnel'), 'through the tunnel');
  await throwAt(bot, TARGET, SEQ_STAR, true, 'the star, once the flames are gone');
  await must(bot, bot.walk(L2.coins[L2.coins.length - 1][0] + 1, 'the far coin'), 'to the far coin');
  coins(bot, score, L2.coins.length, 'level 2 before the exit', 3);
  await leave(bot, bot.walk(L2.exit, 'the exit'), 'the exit');
}
