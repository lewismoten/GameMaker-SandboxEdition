// The way through the game, as orders for the bot: both clamps and the crank in the garage, every
// plug plucked between sparks, every note of the Timing Beat played by eye (a boop a tick or two
// after its key lights), every Squeak oiled, and out of each level by its door.
import { expectScene as expect } from '@lewismoten/gamemaker-sandbox-tools/kit/routeChecks';
import { buildPalette } from '../src/art/palette';
import { CTR, MON, OIL_KEYS } from '../src/ids';
import { JUMP, NOTCHES } from '../src/levels/jump';
import { SPARK, WIRES, WIRE_TOP } from '../src/levels/spark';
import { EXIT_X, ROW, VERSES, VERSE_TICKS, beatBlocks, hitCounter, pathOf } from '../src/levels/beat';
import { ALL_SQUEAKS, LINES, OIL } from '../src/levels/oil';
import { ORIGIN } from '../src/levels/maps';
import { Bot } from './bot';

/** Runs an order; anything but carrying on (a scene change, getting stuck) is an error. */
export async function must(bot: Bot, r: Promise<string | undefined>, what: string): Promise<void> {
  const out = await r;
  if (out) throw new Error(`${what}: ${out}\n${bot.log.slice(-8).join('\n')}`);
}

/** Runs the last order of a level: it must take Doc Leo into the next scene (or the ending). */
export async function leave(bot: Bot, r: Promise<string | undefined>, what: string): Promise<void> {
  const out = await r;
  if (out !== 'link' && out !== 'end') throw new Error(`${what}: ${out ?? 'still here'}\n${bot.log.slice(-8).join('\n')}`);
}

/** Takes a tuning fork the way a person does: walks to its column, and checks the counter went up. */
export async function takeFork(bot: Bot, x: number, what: string): Promise<void> {
  const before = bot.count(CTR.forks);
  await must(bot, bot.walk(x, `to the tuning fork ${what}`), `fork ${what}`);
  if (bot.count(CTR.forks) !== before + 1) throw new Error(`missed the tuning fork ${what}`);
}

/** 1. Jump Start: the red clamp on the shelf, the black one under the bench, the terminals, the crank. */
export async function jumpStart(bot: Bot): Promise<void> {
  expect(bot, 2, 'jump start');
  await must(bot, bot.land(), 'standing in the garage');
  await must(bot, bot.walk(13, 'up the stacks of tires'), 'tires');
  await must(bot, bot.walk(17, 'along the workbench'), 'bench');
  await must(bot, bot.walk(18, 'to the end of the bench'), 'bench end');
  await must(bot, bot.hop('right', 12, 'right', 21), 'up to the shelf');
  await must(bot, bot.walk(JUMP.red[0], 'to the red clamp'), 'red clamp');
  if (bot.count(CTR.red) !== 1) throw new Error('missed the red clamp');
  await takeFork(bot, JUMP.fork[0], 'at the shelf end');
  await must(bot, bot.walk(30, 'off the shelf'), 'down');
  await must(bot, bot.walk(JUMP.black[0], 'under the bench'), 'black clamp');
  if (bot.count(CTR.black) !== 1) throw new Error('missed the black clamp');
  await must(bot, bot.walk(JUMP.crank, 'through both terminals to the crank'), 'terminals');
  await must(
    bot,
    bot.until('space', () => bot.count(CTR.charge) === 1, 'cranked the battery full', NOTCHES * 12),
    'crank',
  );
  // hands down (the reach finishes) before stepping off
  await must(bot, bot.wait(6), 'hands down');
  await leave(bot, bot.walk(JUMP.exit + 1, 'past Sir Reginald, out by the headlight'), 'headlight');
}

/** 2. Spark Plucks: each wire climbed as its spark passes, each plug plucked, the terminals. */
export async function sparkPlucks(bot: Bot): Promise<void> {
  expect(bot, 3, 'spark plucks');
  await must(bot, bot.land(), 'standing in the engine bay');
  for (const [i, w] of WIRES.entries()) {
    await must(bot, bot.walk(w.x - 1, `beside wire ${i + 1}`), 'to the wire');
    // watch the wire: wait for its spark to come, then pass, then go
    const sparking = () => bot.shown(w.x, 5).chHitPt < 0;
    let waited = 0;
    while (!sparking()) {
      await must(bot, bot.wait(1), 'watching');
      if (++waited > 80) throw new Error(`wire ${i + 1} never sparked`);
    }
    while (sparking()) await must(bot, bot.wait(1), 'waiting out the spark');
    await must(bot, bot.react(), 'reacting');
    const hp = bot.sim.ci.hitpts;
    await must(bot, bot.walk(w.x, `onto wire ${i + 1}`), 'onto the wire');
    await must(
      bot,
      bot.until('up', () => bot.px.y <= WIRE_TOP * 20, `climbed wire ${i + 1}`, 40),
      'climbing',
    );
    if (bot.sim.ci.hitpts < hp) throw new Error(`wire ${i + 1}: frizzed`);
    if (i === WIRES.length - 1) {
      await takeFork(bot, SPARK.fork[0], 'on the last ledge');
      await must(bot, bot.walk(SPARK.fork[0] + 1, 'off the ledge'), 'off the ledge');
    } else {
      await must(bot, bot.walk(w.x + 2, 'onto the ledge'), 'ledge');
      await must(bot, bot.walk(w.x + 4, 'off the ledge'), 'off the ledge');
    }
  }
  const plucked = bot.count(CTR.plucked) + 2;
  if (plucked !== 3 || bot.sim.money !== 1) throw new Error(`plucked ${plucked} and ${bot.sim.money} tips`);
  await leave(bot, bot.walk(SPARK.exit + 1, 'through the last terminals'), 'out');
}

/** The ring blocks that show a note head, by verse: the bot reads the pipes as a person does. */
function noteHeads(v: (typeof VERSES)[number]): Set<number> {
  const book = beatBlocks(v)(buildPalette('brass')).book;
  const heads = new Set<number>();
  for (const [name, i] of book.index) {
    const m = /^(v|elbow)([\d.]+)p\d+\.(\d+)$/.exec(name);
    if (m && m[2].split('.').map(Number).includes(Number(m[3]))) heads.add(i);
  }
  return heads;
}

/** 3. The Timing Beat, one verse: every note booped as its key lights, then out through the gate. */
export function timingBeat(verse: number) {
  const v = VERSES[verse];
  const heads = noteHeads(v);
  const run = async (bot: Bot): Promise<void> => {
    expect(bot, 4 + verse, `the timing beat, verse ${verse + 1}`);
    const t0 = bot.sim.ticks;
    await must(bot, bot.land(), 'onto the rail');
    const hits = () => bot.count(hitCounter(v));
    let played = 0;
    let whiffs = 0;
    // the steps until each lane's next note lands, as its pipe shows it
    const soonest = () => {
      let best: { lane: (typeof v.lanes)[number]; d: number } | undefined;
      for (const lane of v.lanes) {
        const d = pathOf(lane).findIndex((c) => heads.has(bot.shownNum(c.x, c.y))) + 1;
        if (d > 0 && (!best || d < best.d)) best = { lane, d };
      }
      return best;
    };
    while (bot.sim.ticks - t0 < VERSE_TICKS || hits() < v.need) {
      if (bot.sim.ticks - t0 > VERSE_TICKS * 3) throw new Error(`still in verse ${verse + 1} with ${hits()} hits`);
      const next = soonest();
      if (!next) {
        await must(bot, bot.wait(1), 'watching the pipes');
        continue;
      }
      const lane = next.lane;
      const goal = lane.x * 20;
      if (bot.px.x !== goal)
        await must(
          bot,
          bot.until(bot.px.x > goal ? 'left' : 'right', () => bot.px.x === goal, `to key ${lane.id}`, 30),
          'along the rail',
        );
      let waited = 0;
      while (!(bot.shown(lane.x, ROW.key).scorePts > 0)) {
        await must(bot, bot.wait(1), 'waiting for the key');
        if (++waited > 80) throw new Error(`key ${lane.id} never lit`);
      }
      await must(bot, bot.wait(1 + Math.floor(bot.hand() * 2)), 'reacting');
      const before = bot.sim.ci.score;
      await must(bot, bot.tap('space', 0), 'boop');
      if (bot.sim.ci.score > before) played++;
      else whiffs++;
      while (bot.shown(lane.x, ROW.key).scorePts > 0) await must(bot, bot.wait(1), 'letting the key go dark');
    }
    bot.say(`verse ${verse + 1}: played ${played} notes, ${whiffs} missed; ${hits()} hits, ${bot.sim.money} tips`);
    if (whiffs) throw new Error(`the bot missed ${whiffs} notes`);
    await leave(bot, bot.walk(EXIT_X + 1, 'through the gate and out'), 'out of the verse');
  };
  Object.defineProperty(run, 'name', { value: `timingBeat${verse + 1}` });
  return run;
}

/** 4. Oil's Well: a drop up a line whenever a Squeak paces it and no drop is on its way, until every note is home. */
export async function oilsWell(bot: Bot): Promise<void> {
  expect(bot, 7, "oil's well");
  await must(bot, bot.land(), 'down from the top of the oil pan');
  await must(bot, bot.walk(OIL.step, 'onto the step'), 'step');
  const { sim } = bot;
  const rows = LINES;
  /** The monsters on a line of the staff (level row), by kind. */
  const on = (row: number, kinds: number[]) => sim.w.mi.filter((mi, i) => kinds.includes(sim.w.mm[i].monnum) && mi.cury[0] - ORIGIN === row).length;
  const drops = OIL_KEYS.map((_, i) => MON.drop0 + i);
  let squirts = 0;
  while (bot.count(CTR.oiled) < ALL_SQUEAKS) {
    if (sim.ticks > 2000) throw new Error(`still oiling: ${bot.count(CTR.oiled)} notes home`);
    const line = rows.findIndex((row) => on(row, [MON.squeak, MON.squeakFast]) && !on(row, drops));
    if (line < 0) {
      // nothing to oil just now: watch the staff (the next wave squeaks out of the clef end)
      await must(bot, bot.wait(1), 'watching the staff');
      continue;
    }
    // a look at the line, then a squirt; hands still a moment before the next key
    await must(bot, bot.react(), 'reacting');
    await must(bot, bot.tap(OIL_KEYS[line], 8), `squirting line ${line + 1}`);
    squirts++;
  }
  bot.say(`oiled ${ALL_SQUEAKS} Squeaks with ${squirts} squirts`);
  await leave(bot, bot.walk(OIL.exit, 'through the gate and out under the staff'), 'out');
}
