// The way through the game, as orders for the bot (kit/starter/bot.ts): the keys a person would press, level by
// level, taking every coin on the way. Each sign's lesson is acted out, the mistake included, once, and the checks
// here fail if the game does anything else than the sign says:
//   level 1: a jump at the wall fails; P takes a crate into the pack (the cell turns to sky); D and Enter put one
//            down where Kit stands (the cell holds the crate); one crate is a step too few, two are a stair
//   level 2: Enter shrugs with an empty pack; with the flame in the pack it throws a flame, and a flame melts the
//            frosty grump; a flame falls short of the far gumdrop; with D the flame is put down, Enter throws the star
//            and it pops the gumdrop; P takes the flame back
import type { Result, StarterBot } from '../../kit/starter/bot';
import { MLEN } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { ORIGIN } from '../../kit/starter/map';
import { SCAN_DROP, SCAN_ENTER, SCAN_PICK, SEQ_FLAME, SEQ_NONE, SEQ_STAR } from '../src/hero';
import { L1, L2, STAND } from '../src/levels';
import { FLAME, FROSTY, POP_SCORE, STAR, TARGET } from '../src/monsters';

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
/** Ticks a thrown weapon lives (monsters.ts) and the sparkle after it, so a throw has finished by then. */
const THROW_WATCH = 60;
const row = (bot: StarterBot) => bot.px.y / 20;
const BACKBL = 150;
/** The pack's things, in order (the block numbers; BACKBL is an empty place). */
const pack = (bot: StarterBot) => [...bot.sim.ci.inv].filter((b) => b !== BACKBL);
/** The block at level (x, y). */
const cell = (bot: StarterBot, x: number, y: number) => bot.sim.w.map[(y + ORIGIN) * MLEN + x + ORIGIN];
const NAMES = new Map<string, number>();
/** Remembers the block numbers (the game's own book) so the route can say "a crate". */
export function nameBlocks(book: { n(name: string): number }): void {
  for (const n of ['crate', 'starItem', 'flameItem', 'sky']) NAMES.set(n, book.n(n));
}
const num = (name: string) => NAMES.get(name)!;

/** Taps a key like a person (down, a moment, up), then waits `after` ticks. */
async function tap(bot: StarterBot, scan: number, what: string, after = 30): Promise<number> {
  bot.sim.press(scan);
  await must(bot, bot.tick(), what);
  const seq = bot.sim.w.chr.cseq;
  await must(bot, bot.wait(2), what);
  bot.sim.release(scan);
  await must(bot, bot.wait(after), what);
  return seq;
}

/** P: takes the thing Kit stands in; the pack must grow by `name` and the cell turn to sky. */
async function pick(bot: StarterBot, name: string, x: number, what: string): Promise<void> {
  const before = pack(bot);
  await tap(bot, SCAN_PICK, what);
  const after = pack(bot);
  if (after.length !== before.length + 1 || after[after.length - 1] !== num(name))
    throw new Error(`${what}: P should add a ${name} to the pack (${before} -> ${after})`);
  if (cell(bot, x, STAND) !== num('sky')) throw new Error(`${what}: the ${name}'s place should turn to sky`);
  bot.say(`score ${bot.sim.ci.score}`);
  bot.say(`P: the pack holds ${after.length} (${name})`);
}

/** D, then the pack's place `slot`, then Enter: puts it down where Kit stands, at feet row `feet`. */
async function putDown(bot: StarterBot, slot: number, name: string, x: number, feet: number, what: string): Promise<void> {
  const before = pack(bot);
  bot.sim.dropSlot = slot;
  await tap(bot, SCAN_DROP, what);
  const after = pack(bot);
  if (after.length !== before.length - 1) throw new Error(`${what}: D should take one out of the pack (${before} -> ${after})`);
  if (cell(bot, x, feet) !== num(name)) throw new Error(`${what}: the ${name} should stand at ${x},${feet}; there is block ${cell(bot, x, feet)}`);
  bot.say(`D: the ${name} stands at ${x},${feet}; the pack holds ${after.length}`);
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

/** Presses Enter like a person (a tap), waits for the throw to land or fizzle, and returns the sequence one tick after the press. */
async function enter(bot: StarterBot, what: string): Promise<number> {
  const seq = await tap(bot, SCAN_ENTER, what, THROW_WATCH);
  bot.say(`Enter ${what}: sequence ${seq}, score ${bot.sim.ci.score}`);
  return seq;
}

/** One Enter at `kind`: `weapon` must be the sequence started, `popped` says whether `kind` should lose one. */
async function throwAt(bot: StarterBot, kind: number, weapon: number, popped: boolean, what: string): Promise<void> {
  const before = { left: alive(bot, kind), score: bot.sim.ci.score };
  const seq = await enter(bot, what);
  if (seq !== weapon) throw new Error(`${what}: Enter should start sequence ${weapon}; it started ${seq}`);
  if (alive(bot, STAR) || alive(bot, FLAME)) throw new Error(`${what}: a throw is still flying`);
  const gone = before.left - alive(bot, kind);
  if (gone !== (popped ? 1 : 0)) throw new Error(`${what}: expected ${popped ? 'one pop' : 'no pop'}; ${gone} gone`);
  if (bot.sim.ci.score - before.score !== (popped ? POP_SCORE : 0)) throw new Error(`${what}: score ${before.score} -> ${bot.sim.ci.score}`);
}

/** 1. Step Up: two crates in the pack, put down as a stair at the foot of the wall. */
export async function stepUp(bot: StarterBot): Promise<void> {
  const score = bot.sim.ci.score;
  await must(bot, bot.walk(6, 'the first sign'), 'to the first sign');
  await must(bot, bot.wait(LOOK), 'reading the sign');
  await must(bot, bot.walk(L1.crates[0], 'the first crate'), 'to the first crate');
  await pick(bot, 'crate', L1.crates[0], 'the first crate');
  await must(bot, bot.walk(L1.crates[1], 'the second crate'), 'to the second crate');
  await pick(bot, 'crate', L1.crates[1], 'the second crate');
  await must(bot, bot.walk(L1.crates[2], 'the third crate'), 'to the third crate');
  await pick(bot, 'crate', L1.crates[2], 'the third crate');
  await must(bot, bot.walk(17, 'the pack sign'), 'to the pack sign');
  await must(bot, bot.wait(LOOK), 'reading the sign');
  await must(bot, bot.walk(22, 'the wall sign'), 'to the wall sign');
  await must(bot, bot.wait(LOOK), 'reading the sign');
  // the wall is too high to jump, even with the crates in the pack
  await must(bot, bot.walk(L1.foot, 'the foot of the wall'), 'to the wall');
  await must(bot, bot.jump('right', L1.wall[0]), 'a jump at the wall');
  if (row(bot) < 8.9) throw new Error(`the wall should be too high to jump; Kit is at row ${row(bot).toFixed(1)}`);
  // each crate goes down where Kit stands; he jumps on it, and two are still not enough
  for (let n = 0; n < 3; n++) {
    await putDown(bot, 0, 'crate', L1.foot, 9 - n, `step ${n + 1}`);
    await must(bot, bot.jump(undefined), `up on step ${n + 1}`);
    if (Math.abs(row(bot) - (8 - n)) > 0.1) throw new Error(`Kit should stand on step ${n + 1} (row ${8 - n}); he is at row ${row(bot).toFixed(1)}`);
    if (n < 2) {
      await must(bot, bot.jump('right', L1.wall[0]), `a jump at the wall from ${n + 1} crates`);
      if (row(bot) < 7.9 - n) throw new Error(`${n + 1} crates should not be enough; Kit is at row ${row(bot).toFixed(1)}`);
    }
  }
  await must(bot, bot.jump('right', L1.wall[0]), 'up onto the wall');
  if (Math.abs(row(bot) - (L1.wallTop - 1)) > 0.1) throw new Error(`Kit should stand on the wall (row ${L1.wallTop - 1}); he is at row ${row(bot).toFixed(1)}`);
  await must(bot, bot.walk(L1.wall[1], 'along the wall'), 'along the wall');
  await must(bot, bot.walk(L1.wall[1] + 2, 'off the wall'), 'off the wall');
  await must(bot, bot.land(), 'down from the wall');
  await must(bot, bot.walk(L1.coins[3][0] + 1, 'the far coins'), 'to the far coins');
  coins(bot, score, L1.coins.length, 'level 1 before the exit', 0);
  await leave(bot, bot.walk(L1.exit, 'the exit'), 'the exit');
}

/** 2. Your Pick: a flame and a star in the pack; the flame goes first; put it down to throw the star. */
export async function yourPick(bot: StarterBot): Promise<void> {
  const score = bot.sim.ci.score;
  if (pack(bot).length) throw new Error(`Kit should arrive with an empty pack; he has ${pack(bot).length} things`);
  await must(bot, bot.walk(5, 'the first sign'), 'to the first sign');
  await must(bot, bot.wait(LOOK), 'reading the sign');
  // an empty pack: Enter shrugs
  const shrug = await enter(bot, 'with an empty pack');
  if (shrug !== SEQ_NONE) throw new Error(`Enter with nothing to throw should shrug (${SEQ_NONE}); it started ${shrug}`);
  await must(bot, bot.walk(L2.flame, 'the flame'), 'to the flame');
  await pick(bot, 'flameItem', L2.flame, 'the flame');
  await must(bot, bot.walk(L2.star, 'the star'), 'to the star');
  await pick(bot, 'starItem', L2.star, 'the star');
  if (pack(bot).join() !== [num('flameItem'), num('starItem')].join()) throw new Error('the pack should hold the flame, then the star');
  await must(bot, bot.walk(17, 'the order sign'), 'to the order sign');
  await must(bot, bot.wait(LOOK), 'reading the sign');
  // both are in the pack and the flame comes first: it melts the frosty grump
  await must(bot, bot.walk(L2.wall[0], 'the tunnel'), 'to the tunnel');
  await throwAt(bot, FROSTY, SEQ_FLAME, true, 'the flame at the frosty grump');
  await must(bot, bot.walk(L2.lip - 5, 'the range sign'), 'to the range sign');
  await must(bot, bot.wait(LOOK), 'reading the sign');
  await must(bot, bot.walk(L2.lip, 'the edge of the spikes'), 'to the spikes');
  // the flame goes first again, and falls short of the gumdrop
  await throwAt(bot, TARGET, SEQ_FLAME, false, 'a flame at the far gumdrop');
  // put the flame down (the pack's first place): now the star is the first thing Enter can throw
  await putDown(bot, 0, 'flameItem', L2.lip, STAND, 'putting the flame down');
  if (pack(bot).join() !== String(num('starItem'))) throw new Error('only the star should be left in the pack');
  await throwAt(bot, TARGET, SEQ_STAR, true, 'the star at the far gumdrop');
  // take the flame back: it is where Kit stands
  await pick(bot, 'flameItem', L2.lip, 'taking the flame back');
  await must(bot, bot.jump('right', L2.spikes[1] + 1), 'over the spikes');
  await must(bot, bot.walk(L2.coins[3][0] + 1, 'the far coins'), 'to the far coins');
  coins(bot, score, L2.coins.length, 'level 2 before the exit', 2);
  await leave(bot, bot.walk(L2.exit, 'the exit'), 'the exit');
}
