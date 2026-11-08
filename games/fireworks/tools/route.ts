// The way through the game, as orders for the bot (kit/starter/bot.ts): the keys a person would press, level by level.
// The fireworks are the lesson, so the bot stops under them and counts what the monsters do, tick by tick, from the
// engine's own monster slots:
//   level 1: each launcher's rockets climb and turn into their small burst at the top, the burst falls a block and is
//            gone; the two launchers go up at different times; Enter launches a rocket from Lami's head that bursts too
//   level 2: each big firework's nine blocks keep their square (same path, same speeds) and turn from rocket into burst
//            and back, again and again; the rocket shows only while it climbs
// Over both levels, watch() also checks that no monster is ever left behind: a small burst always goes out.
import { monPicNum } from '@lewismoten/gamemaker-sandbox-engine/engine/monsters';
import type { Result, StarterBot } from '../../kit/starter/bot';
import { ORIGIN } from '../../kit/starter/map';
import { SCAN_ENTER } from '../src/hero';
import { EVERY, GROUND, buildLevels } from '../src/levels';
import { BIGS, CELLS, CLIMB, POP, POP_TEAL, ROCKET, ROCKET_TEAL, bigMonsters, buildMonsterBlocks } from '../src/monsters';
import { nightPalette } from '../src/night';

/** A person's look at what just happened, in ticks (about two seconds). */
const LOOK = 40;
const { levels } = buildLevels();
const rocketPics = (() => {
  const { book } = buildMonsterBlocks(nightPalette());
  return new Set([book.n('rocket0'), book.n('rocket1')]);
})();

async function must(bot: StarterBot, r: Promise<Result>, what: string): Promise<void> {
  const out = await r;
  if (out) throw new Error(`${what}: ${out}\n${bot.log.slice(-8).join('\n')}`);
}

/** The last order of a level: it must take the hero through the door (to the next level or the ending). */
async function leave(bot: StarterBot, r: Promise<Result>, what: string): Promise<void> {
  const out = await r;
  if (out !== 'link' && out !== 'end') throw new Error(`${what}: ${out ?? 'still here'}\n${bot.log.slice(-8).join('\n')}`);
}

/** The live monsters: slot, number, level block and pixel offset, and the picture shown (MONBL: none). */
function monsters(bot: StarterBot) {
  const { w } = bot.sim;
  const out: { slot: number; n: number; x: number; y: number; px: number; py: number; pic: number }[] = [];
  w.mm.forEach((m, slot) => {
    if (m.monnum >= 64) return;
    const mi = w.mi[slot];
    out.push({ slot, n: m.monnum, x: mi.curx[0] - ORIGIN, y: mi.cury[0] - ORIGIN, px: mi.curx[1], py: mi.cury[1], pic: monPicNum(w, slot) });
  });
  return out;
}

/** What one stretch of watching saw. */
interface Seen {
  /** Ticks at which a rocket of each color left its launcher, by launcher column. */
  launches: Map<number, number[]>;
  /** Small bursts that appeared (where), and how many went out. */
  pops: { x: number; y: number }[];
  gone: number;
  /** Bursts of each big firework (by its index in BIGS) that went off, and whether their nine blocks kept the square. */
  bigBursts: number[];
}

/**
 * Watches the sky for `ticks`, following every monster slot: a rocket born at a launcher, a burst at the top of a
 * climb, a burst that goes out. Throws when anything breaks the rules the signs teach.
 */
async function watch(bot: StarterBot, level: number, ticks: number, seen?: Seen): Promise<Seen> {
  const out: Seen = seen ?? { launches: new Map(), pops: [], gone: 0, bigBursts: BIGS.map(() => 0) };
  const l = levels[level];
  let before = new Map(monsters(bot).map((m) => [m.slot, m]));
  for (let t = 0; t < ticks; t++) {
    await must(bot, bot.tick(), 'watching the sky');
    const now = new Map(monsters(bot).map((m) => [m.slot, m]));
    for (const [slot, m] of now) {
      const was = before.get(slot);
      // a rocket born this tick (a new slot, or a slot that held something else)
      if ((m.n === ROCKET || m.n === ROCKET_TEAL) && (!was || (was.n !== ROCKET && was.n !== ROCKET_TEAL))) {
        const list = out.launches.get(m.x) ?? [];
        list.push(bot.sim.w.clock);
        out.launches.set(m.x, list);
      }
      // a small burst where a rocket was: it must be at the top of the climb
      if ((m.n === POP || m.n === POP_TEAL) && was && (was.n === ROCKET || was.n === ROCKET_TEAL)) out.pops.push({ x: m.x, y: m.y });
      // the big ones: a burst where its flight was; then the square is checked
      BIGS.forEach((_big, b) => {
        const { flight, burst } = bigMonsters(b, 0);
        if (m.n === burst && was?.n === flight) {
          out.bigBursts[b]++;
          square(bot, b, l.bigs[b]);
        }
        // the middle flight shows its rocket only on the climb: at or above the launcher, going up
        if (m.n === flight && rocketPics.has(m.pic) && was?.n === flight) {
          const y = m.y * 20 + m.py;
          const wy = was.y * 20 + was.py;
          if (m.x !== l.bigs[b] || y > (GROUND - 1) * 20 || y > wy)
            throw new Error(`big firework ${b}: its rocket shows off its climb at ${m.x},${m.y}+${m.py}`);
        }
      });
    }
    for (const [slot, was] of before) if ((was.n === POP || was.n === POP_TEAL) && now.get(slot)?.n !== was.n) out.gone++;
    before = now;
  }
  return out;
}

/** A big firework's nine blocks must make a square around the middle one: each at its own offset, to the pixel. */
function square(bot: StarterBot, b: number, x: number): void {
  const all = monsters(bot);
  const mid = all.find((m) => m.n === bigMonsters(b, 0).burst);
  if (!mid || mid.x !== x) throw new Error(`big firework ${b}: its middle burst is at ${mid?.x}, not over its mortar at ${x}`);
  CELLS.forEach(([dx, dy], cell) => {
    const m = all.find((k) => k.n === bigMonsters(b, cell).burst);
    if (!m || m.x !== mid.x + dx || m.y !== mid.y + dy || m.px !== mid.px || m.py !== mid.py)
      throw new Error(`big firework ${b}: block ${cell} is out of the square (${m?.x},${m?.y}+${m?.py} for ${mid.x + dx},${mid.y + dy}+${mid.py})`);
  });
}

/** Presses Enter like a person (a tap), then watches the rocket go up and burst. */
async function launchOne(bot: StarterBot): Promise<{ x: number; y: number } | undefined> {
  const seen: Seen = { launches: new Map(), pops: [], gone: 0, bigBursts: BIGS.map(() => 0) };
  const heroX = Math.floor(bot.px.x / 20 + 0.5);
  bot.sim.press(SCAN_ENTER);
  await watch(bot, 0, 3, seen);
  bot.sim.release(SCAN_ENTER);
  await watch(bot, 0, 60, seen);
  return seen.pops.find((p) => Math.abs(p.x - heroX) <= 1);
}

/** 1. Launch!: the two launchers, their bursts, their own times; then a rocket of Lami's own. */
export async function launch(bot: StarterBot): Promise<void> {
  const l = levels[0];
  await must(bot, bot.wait(20), 'a beat');
  await must(bot, bot.walk(10, 'the first sign'), 'to the first sign');
  await must(bot, bot.wait(LOOK), 'reading');
  await must(bot, bot.walk(12, 'by the pink launcher'), 'to the pink launcher');
  const pink = await watch(bot, 0, 160);
  const [px] = [l.launchers[0].x];
  if ((pink.launches.get(px) ?? []).length < 2)
    throw new Error(`the pink launcher should launch twice in 160 ticks, not ${(pink.launches.get(px) ?? []).length}`);
  if (!pink.pops.some((p) => p.x === px && p.y === GROUND - 1 - CLIMB))
    throw new Error(`the pink rocket should burst ${CLIMB} blocks over its launcher: ${JSON.stringify(pink.pops)}`);
  if (!pink.gone) throw new Error('a small burst should go out');
  bot.say(`the pink launcher: ${pink.launches.get(px)!.length} rockets, ${pink.pops.length} bursts, ${pink.gone} gone out`);
  await must(bot, bot.walk(19, 'the second sign'), 'to the second sign');
  await must(bot, bot.wait(LOOK), 'reading');
  await must(bot, bot.walk(26, 'between the launchers'), 'between the launchers');
  const both = await watch(bot, 0, 300);
  const times = l.launchers.map((k) => both.launches.get(k.x) ?? []);
  times.forEach((list, i) => {
    const gaps = list.slice(1).map((t, k) => t - list[k]);
    const every = EVERY[l.launchers[i].color];
    if (list.length < 2 || gaps.some((g) => g !== every)) throw new Error(`launcher ${i} should launch every ${every} ticks: ${list.join(' ')}`);
  });
  const together = times[0].filter((t) => times[1].includes(t)).length;
  if (together > 1) throw new Error(`the launchers should rarely go up together; ${together} times in 300 ticks`);
  bot.say(`two launchers: ${times[0].length} pink and ${times[1].length} teal rockets, ${together} together`);
  await must(bot, bot.walk(30, 'the third sign'), 'to the third sign');
  await must(bot, bot.wait(LOOK), 'reading');
  await must(bot, bot.walk(36, 'the last sign'), 'to the last sign');
  const mine = await launchOne(bot);
  if (!mine) throw new Error('Enter should launch a rocket that bursts over Lami');
  bot.say(`Enter: a rocket from Lami burst at ${mine.x},${mine.y}`);
  await must(bot, bot.wait(LOOK), 'watching it fade');
  await leave(bot, bot.walk(40, 'the door'), 'the door');
}

/** 2. The Big Show: under each big firework, its nine blocks burst in a square, and burst again. */
export async function bigShow(bot: StarterBot): Promise<void> {
  const l = levels[1];
  await must(bot, bot.wait(20), 'a beat');
  await must(bot, bot.walk(10, 'the first sign'), 'to the first sign');
  await must(bot, bot.wait(LOOK), 'reading');
  const seen: Seen = { launches: new Map(), pops: [], gone: 0, bigBursts: BIGS.map(() => 0) };
  for (const [b, sign] of [
    [0, 30],
    [1, 48],
    [2, 0],
  ] as const) {
    await must(bot, bot.walk(l.bigs[b] - 2, `under the ${BIGS[b].kind}`), `to the ${BIGS[b].kind}`);
    const from = seen.bigBursts[b];
    await watch(bot, 1, 280, seen);
    if (seen.bigBursts[b] - from < 2) throw new Error(`the ${BIGS[b].kind} should burst twice in 280 ticks, not ${seen.bigBursts[b] - from}`);
    bot.say(`the ${BIGS[b].kind}: ${seen.bigBursts[b] - from} bursts, every one a square of nine`);
    if (sign) {
      await must(bot, bot.walk(sign, 'a sign'), 'to a sign');
      await must(bot, bot.wait(LOOK), 'reading');
    }
  }
  await leave(bot, bot.walk(62, 'the door'), 'the door');
}
