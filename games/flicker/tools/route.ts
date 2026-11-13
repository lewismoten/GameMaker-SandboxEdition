// The way through the game, as orders for the bot (kit/starter/bot.ts): the keys a person would press, level by level.
// What moves is the lesson, so the bot stops where it can see each loop and records, tick by tick, which frame of it the
// engine shows (the block the game's own tables give for the ring's first block), then checks the loop's character:
//   level 1: the pulse torches change frame at even gaps (a pulse); the flickering torches at uneven gaps, and the two
//            flicker loops are rarely at the same frame; both blocks of a flag change on the same tick
//   level 2: the fall's four columns step together at even gaps; the lip and the splash step at the body's gap, so the streaks run on across the seams
//   level 3: the big fire's gaps are uneven; each spark loop is dark for most of its round, and the three differ
import type { Result, StarterBot } from '../../kit/starter/bot';
import { buildLevels } from '../src/levels';

/** A person's look at what just happened, in ticks (about a second and a half). */
const LOOK = 40;
const { levels } = buildLevels();

async function must(bot: StarterBot, r: Promise<Result>, what: string): Promise<void> {
  const out = await r;
  if (out) throw new Error(`${what}: ${out}\n${bot.log.slice(-8).join('\n')}`);
}

/** The last order of a level: it must take the hero through the door (to the next level or the ending). */
async function leave(bot: StarterBot, r: Promise<Result>, what: string): Promise<void> {
  const out = await r;
  if (out !== 'link' && out !== 'end') throw new Error(`${what}: ${out ?? 'still here'}\n${bot.log.slice(-8).join('\n')}`);
}

/** What a ring was seen to do: its frame at each tick, and for how many ticks each frame in turn stayed. */
interface Seen {
  frames: number[];
  runs: number[];
}

/** Records the frame (0 to 3) of the rings `rings` of `level` for `ticks` ticks as the bot waits. */
async function watch(bot: StarterBot, level: number, rings: string[], ticks: number): Promise<Record<string, Seen>> {
  const { book } = levels[level];
  const names = [...book.index.keys()];
  const out: Record<string, Seen> = Object.fromEntries(rings.map((r) => [r, { frames: [], runs: [] }]));
  for (let t = 0; t < ticks; t++) {
    for (const r of rings) out[r].frames.push(Number(names[bot.sim.w.blkmap[book.n(`${r}.0`)]].split('.').pop()));
    await must(bot, bot.tick(), 'watching');
  }
  for (const s of Object.values(out)) {
    let run = 1;
    for (let i = 1; i < s.frames.length; i++) {
      if (s.frames[i] === s.frames[i - 1]) run++;
      else {
        s.runs.push(run);
        run = 1;
      }
    }
    s.runs.shift(); // the first run began before the watch did
  }
  return out;
}

const distinct = (xs: number[]) => new Set(xs).size;
const frac = (a: number[], b: number[]) => a.filter((v, i) => v === b[i]).length / a.length;

/** 1. The Torch Hall. */
export async function torchHall(bot: StarterBot): Promise<void> {
  await must(bot, bot.wait(20), 'a beat');
  await must(bot, bot.walk(7, 'the first sign'), 'to the first sign');
  await must(bot, bot.wait(LOOK), 'reading');
  await must(bot, bot.walk(14, 'the pulse torches'), 'to the pulse torches');
  const pulse = (await watch(bot, 0, ['pulse'], 130)).pulse;
  if (pulse.runs.length < 4 || distinct(pulse.runs) !== 1) throw new Error(`the pulse torch should change at even gaps, not ${pulse.runs.join(' ')}`);
  bot.say(`the pulse: a new frame every ${pulse.runs[0]} ticks`);
  await must(bot, bot.walk(20, 'the second sign'), 'to the second sign');
  await must(bot, bot.wait(LOOK), 'reading');
  await must(bot, bot.walk(28, 'the flickering torches'), 'to the flickering torches');
  const fl = await watch(bot, 0, ['flameA', 'flameB'], 220);
  for (const r of ['flameA', 'flameB']) if (distinct(fl[r].runs) < 3) throw new Error(`${r} should change at uneven gaps, not ${fl[r].runs.join(' ')}`);
  const same = frac(fl.flameA.frames, fl.flameB.frames);
  if (same > 0.5) throw new Error(`the two flicker loops should differ; they are at the same frame ${Math.round(same * 100)}% of the time`);
  bot.say(`the flicker: gaps ${[...new Set(fl.flameA.runs)].sort().join(', ')} ticks; the two loops at the same frame ${Math.round(same * 100)}% of the time`);
  await must(bot, bot.walk(36, 'the third sign'), 'to the third sign');
  await must(bot, bot.wait(LOOK), 'reading');
  await must(bot, bot.walk(44, 'the flag sign'), 'to the flag sign');
  await must(bot, bot.wait(LOOK), 'reading');
  await must(bot, bot.walk(46, 'the flags'), 'to the flags');
  const flag = await watch(bot, 0, ['flagA', 'flagB'], 100);
  if (flag.flagA.frames.some((f, i) => f !== flag.flagB.frames[i])) throw new Error("the flag's two blocks should always show the same frame");
  if (distinct(flag.flagA.runs) !== 1 || distinct(flag.flagA.frames) !== 4) throw new Error('the flag should wave through four frames at even gaps');
  bot.say(`the flag: four frames, a new one every ${flag.flagA.runs[0]} ticks, both blocks in step`);
  await leave(bot, bot.walk(54, 'the door'), 'the door');
}

/** 2. The Falls. */
export async function theFalls(bot: StarterBot): Promise<void> {
  await must(bot, bot.wait(20), 'a beat');
  await must(bot, bot.walk(8, 'the first sign'), 'to the first sign');
  await must(bot, bot.wait(LOOK), 'reading');
  await must(bot, bot.walk(19, 'the fall'), 'to the fall');
  const w = await watch(bot, 1, ['fallL', 'fallM', 'fallN', 'fallR', 'lipM', 'splashM'], 160);
  const body = w.fallL;
  if (body.runs.length < 6 || distinct(body.runs) !== 1) throw new Error(`the fall should step at even gaps, not ${body.runs.join(' ')}`);
  for (const r of ['fallM', 'fallN', 'fallR']) if (w[r].frames.some((f, i) => f !== body.frames[i])) throw new Error(`${r} should step with the left column`);
  for (const r of ['lipM', 'splashM'])
    if (distinct(w[r].runs) !== 1 || w[r].runs[0] !== body.runs[0])
      throw new Error(`${r} should step at the body's gap (${body.runs[0]}), not ${w[r].runs.join(' ')}`);
  bot.say(`the fall: every column steps every ${body.runs[0]} ticks; the lip every ${w.lipM.runs[0]}; the splash every ${w.splashM.runs[0]}`);
  await must(bot, bot.walk(38, 'the second sign'), 'to the second sign');
  await must(bot, bot.wait(LOOK), 'reading');
  await must(bot, bot.walk(47, 'the third sign'), 'to the third sign');
  await must(bot, bot.wait(LOOK), 'reading');
  await leave(bot, bot.walk(56, 'the door'), 'the door');
}

/** 3. The Fire on the Hill. */
export async function fireOnTheHill(bot: StarterBot): Promise<void> {
  await must(bot, bot.wait(20), 'a beat');
  await must(bot, bot.walk(8, 'the first sign'), 'to the first sign');
  await must(bot, bot.wait(LOOK), 'reading');
  await must(bot, bot.walk(16, 'the fire'), 'to the fire');
  const w = await watch(bot, 2, ['fire.tl', 'fire.br', 'spark0', 'spark1', 'spark2'], 260);
  if (distinct(w['fire.tl'].runs) < 3) throw new Error(`the fire should step at uneven gaps, not ${w['fire.tl'].runs.join(' ')}`);
  if (w['fire.tl'].frames.some((f, i) => f !== w['fire.br'].frames[i])) throw new Error("the fire's blocks should step together");
  for (const s of ['spark0', 'spark1', 'spark2']) {
    const dark = w[s].frames.filter((f) => f === 3).length / w[s].frames.length;
    if (dark < 0.25) throw new Error(`${s} should rest dark for much of its round, not ${Math.round(dark * 100)}%`);
  }
  const lit = Array.from({ length: 260 }, (_, i) => [0, 1, 2].filter((k) => w[`spark${k}`].frames[i] !== 3).length);
  bot.say(`the fire: gaps ${[...new Set(w['fire.tl'].runs)].sort().join(', ')} ticks; most sparks lit at once: ${Math.max(...lit)}`);
  await must(bot, bot.walk(32, 'the second sign'), 'to the second sign');
  await must(bot, bot.wait(LOOK), 'reading');
  await leave(bot, bot.walk(42, 'the door'), 'the door');
}
