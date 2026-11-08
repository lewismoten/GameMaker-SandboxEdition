// The way through PASS THE PIE, as orders for the bot (kit/starter/bot.ts): the keys a person would press, street by
// street, with human timing (signs get a two-second look, a moving vacuum is watched before a hop) and every acorn
// a person would see taken.
//   1 Pumpkin Yard  (Rory)   scuff the leaf piles, the shelf of acorns, the squirrels, the pie to Mrs. Pettigrew
//   2 Payback       (Plume)  kick the lawn turkeys and a vacuum, the spare key on the shed, the garden gate
//   3 Gravy Slide   (Rory)   hop a vacuum block and a moving vacuum, take the counter over the long one
//   4 Windy Park    (Plume)  two kicks a dummy, the casserole up top, a vacuum, the crew tent takes the dish
//   5 Hungry Dog    (Rory)   hop a vacuum, the bone past the shelf's vacuum, the dog, hop the long vacuum, the toll
//   6 Big Gobble    (Plume)  the rolls from Rory, kick and hop to the blower, five kicks, the hall before it shuts
import { LASTMON } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import type { Result, StarterBot } from '../../kit/starter/bot';
import { ORIGIN } from '../../kit/starter/map';
import { AT } from '../src/levels';
import { BLOWER_HITS, MONS } from '../src/monsters';
import { SCAN_ENTER } from '../src/plumeChar';

/** A person's look at a sign, in ticks (about two seconds). */
const READ = 36;
/** Hit points the whole walkthrough may lose (a person is allowed a few bumps). */
export const BUMP_BUDGET = 40;

async function must(bot: StarterBot, r: Promise<Result>, what: string): Promise<void> {
  const out = await r;
  if (out) throw new Error(`${what}: ${out}\n${bot.log.slice(-8).join('\n')}`);
}

/** The last order of a level: it must take the hero through the door (to the next level or the ending). */
async function leave(bot: StarterBot, r: Promise<Result>, what: string): Promise<void> {
  const out = await r;
  if (out !== 'link' && out !== 'end') throw new Error(`${what}: ${out ?? 'still here'}\n${bot.log.slice(-8).join('\n')}`);
}

async function read(bot: StarterBot, x: number, what: string): Promise<void> {
  await must(bot, bot.walk(x, `the ${what} sign`), `to the ${what} sign`);
  await must(bot, bot.wait(READ), `reading the ${what} sign`);
}

/** Walks to `x`, jumping when something stops it. */
async function cross(bot: StarterBot, x: number, what: string): Promise<void> {
  const hp = bot.sim.ci.hitpts;
  await must(bot, bot.walk(x, what, 900, { jumpWhenJittering: true }), what);
  if (bot.sim.ci.hitpts < hp) bot.say(`${what}: bumped, hit points ${hp} -> ${bot.sim.ci.hitpts}`);
}

/** Hops over a block at column `at` (and `at + width - 1`), going `dir`: takes off two blocks before it, lands past it. */
async function hop(bot: StarterBot, at: number, what: string, dir: 'left' | 'right' = 'right', width = 1): Promise<void> {
  const hp = bot.sim.ci.hitpts;
  const from = dir === 'right' ? at - 2 : at + width + 1;
  const to = dir === 'right' ? at + width + 2 : at - 3;
  await must(bot, bot.walk(from, what), `to ${what}`);
  await must(bot, bot.jump(dir, to), `over ${what}`);
  if (bot.sim.ci.hitpts < hp) throw new Error(`${what} hurt: hit points ${hp} -> ${bot.sim.ci.hitpts}`);
}

/** The live monsters of the given numbers, with their left edge in level pixels. */
function monsters(bot: StarterBot, nums: number[]): { x: number; y: number; n: number }[] {
  const w = bot.sim.w;
  const out: { x: number; y: number; n: number }[] = [];
  w.mm.forEach((m, i) => {
    if (m.monnum === LASTMON || !nums.includes(m.monnum)) return;
    const mi = w.mi[i];
    out.push({ x: (mi.curx[0] - ORIGIN) * 20 + mi.curx[1], y: mi.cury[0] - ORIGIN, n: m.monnum });
  });
  return out;
}

const VACS = [MONS.vacShort, MONS.vacLong];

/** One kick: Enter tapped like a person, then the kick plays out. */
async function kick(bot: StarterBot): Promise<void> {
  bot.sim.press(SCAN_ENTER);
  await must(bot, bot.wait(3), 'kicking');
  bot.sim.release(SCAN_ENTER);
  await must(bot, bot.wait(14), 'the kick');
}

/** Walks up to the thing at column `x` (row `row`) and kicks until nothing of `nums` stands there; `hits` kicks expected. */
async function kickDown(bot: StarterBot, x: number, nums: number[], hits: number, what: string, row = 9): Promise<void> {
  await must(bot, bot.walk(x - 1, what), `to ${what}`);
  const there = () => monsters(bot, nums).some((m) => m.y === row && Math.abs(m.x - x * 20) < 20);
  let n = 0;
  while (there()) {
    if (++n > hits + 2) throw new Error(`${what}: still standing after ${n - 1} kicks\n${bot.log.slice(-6).join('\n')}`);
    await kick(bot);
  }
  if (n !== hits) throw new Error(`${what}: took ${n} kicks, not ${hits}`);
  bot.say(`kicked ${what} (${n}), score ${bot.sim.ci.score}, hit points ${bot.sim.ci.hitpts}`);
}

/** Mr. Plume steps up to where a vacuum turns (`start`), waits for it to come into reach and kicks it. */
async function kickVac(bot: StarterBot, start: number, what: string): Promise<void> {
  await must(bot, bot.walk(start - 1, what), `to ${what}`);
  let last: number | undefined;
  for (let t = 0; t < 400; t++) {
    const me = bot.px.x;
    const near = monsters(bot, VACS).filter((m) => Math.abs(m.x - me) < 200 && m.y === 9);
    if (!near.length) return bot.say(`kicked ${what}, hit points ${bot.sim.ci.hitpts}`);
    const v = near[0];
    const coming = last !== undefined && v.x < last;
    last = v.x;
    if (v.x < me) throw new Error(`${what}: it got past`);
    if (coming && v.x - me <= 44) {
      await kick(bot);
      last = undefined;
    } else await must(bot, bot.tick(), 'waiting for the vacuum');
  }
  throw new Error(`${what}: the vacuum never came into reach`);
}

/** Rory waits two blocks short of where a pacing vacuum turns, watches it, and hops it as it comes, so it passes
 *  under the top of the jump. */
async function hopVac(bot: StarterBot, start: number, what: string, land: number): Promise<void> {
  const hp = bot.sim.ci.hitpts;
  await must(bot, bot.walk(start - 2, what), `to ${what}`);
  let last = monsters(bot, VACS).find((m) => Math.abs(m.x - start * 20) < 160)?.x;
  for (let t = 0; t < 400; t++) {
    await must(bot, bot.tick(), 'watching the vacuum');
    const v = monsters(bot, VACS).find((m) => Math.abs(m.x - start * 20) < 160);
    if (!v || last === undefined) throw new Error(`${what}: no vacuum`);
    const coming = v.x < last;
    last = v.x;
    const gap = v.x - (bot.px.x + 20);
    if (coming && gap >= 44 && gap <= 64) {
      await must(bot, bot.jump('right', land), `over ${what}`);
      if (bot.sim.ci.hitpts < hp) throw new Error(`${what} hurt: hit points ${hp} -> ${bot.sim.ci.hitpts}`);
      return bot.say(`hopped ${what}`);
    }
  }
  throw new Error(`${what}: never a gap`);
}

/** Up the ladder at `ladder` to a ledge whose hero row is `row`, and later back down. */
async function up(bot: StarterBot, ladder: number, row: number): Promise<void> {
  await must(bot, bot.walk(ladder + 1, 'the ladder'), 'to the ladder');
  await must(bot, bot.walk(ladder, 'the ladder'), 'onto the ladder');
  await must(bot, bot.climb('up', row, 'up the ladder'), 'up the ladder');
}
async function down(bot: StarterBot, ladder: number): Promise<void> {
  await must(bot, bot.walk(ladder + 1, 'the ladder again'), 'back to the ladder');
  await must(bot, bot.walk(ladder, 'the ladder'), 'onto the ladder');
  await must(bot, bot.climb('down', 8, 'down the ladder'), 'down the ladder');
}

/** Through a gate (the dish or a key opens it) and out of the street. */
async function door(bot: StarterBot, gate: number, exit: number, what: string): Promise<void> {
  await cross(bot, gate - 1, what);
  await must(bot, bot.wait(20), `at ${what}`);
  await cross(bot, gate + 2, `through ${what}`);
  await leave(bot, bot.walk(exit + 1, 'the exit'), 'the exit');
}

/** 1. Pumpkin Yard (Rory). */
export async function pumpkinYard(bot: StarterBot): Promise<void> {
  await read(bot, 8, 'morning');
  await cross(bot, AT.yard.dish + 1, 'the pie');
  await read(bot, 14, 'leaf');
  await cross(bot, AT.yard.fences[0] - 1, 'the first fence');
  await cross(bot, AT.yard.fences[0] + 3, 'over the first fence');
  await up(bot, AT.yard.shelf[0], 2);
  await must(bot, bot.walk(AT.yard.shelf[2], 'the end of the shelf'), 'along the shelf');
  await down(bot, AT.yard.shelf[0]);
  await read(bot, 37, 'squirrel');
  await cross(bot, AT.yard.fences[1] + 3, 'the squirrels and the second fence');
  await read(bot, 56, 'parade');
  await cross(bot, AT.yard.fences[2] + 3, 'the third fence');
  await read(bot, 66, 'pie');
  await cross(bot, AT.yard.gate - 3, 'the last leaf piles');
  await door(bot, AT.yard.gate, AT.yard.exit, "Mrs. Pettigrew's door");
}

/** 2. Payback (Mr. Plume). */
export async function payback(bot: StarterBot): Promise<void> {
  await read(bot, 6, 'flyer');
  await read(bot, 12, 'kick');
  await kickDown(bot, AT.lawn.inflatables[0], [MONS.inflatable], 1, 'the first lawn turkey');
  await cross(bot, 27, 'the acorns');
  await kickDown(bot, AT.lawn.inflatables[1], [MONS.inflatable], 1, 'the second lawn turkey');
  await kickVac(bot, AT.lawn.vac, "Dale's vacuum");
  await read(bot, 40, 'key');
  await up(bot, AT.lawn.shelf[0], 2);
  await kickDown(bot, AT.lawn.shelfTurkey, [MONS.inflatable], 1, 'the turkey on the shed', 2);
  await must(bot, bot.walk(AT.lawn.key, 'the spare key'), 'to the key');
  await down(bot, AT.lawn.shelf[0]);
  await read(bot, 54, 'chat');
  await kickDown(bot, AT.lawn.inflatables[2], [MONS.inflatable], 1, 'the third lawn turkey');
  await kickDown(bot, AT.lawn.inflatables[3], [MONS.inflatable], 1, 'the fourth lawn turkey');
  await read(bot, 67, 'gate');
  await door(bot, AT.lawn.gate, AT.lawn.exit, 'the garden gate');
}

/** 3. Gravy Slide (Rory). */
export async function gravySlide(bot: StarterBot): Promise<void> {
  await read(bot, 8, 'gravy');
  await cross(bot, AT.gravy.dish + 1, 'the gravy boat');
  await read(bot, 15, 'vacuum');
  await hop(bot, AT.gravy.block, 'the vacuum by the stove');
  await cross(bot, 26, 'the acorns');
  await hopVac(bot, AT.gravy.vac, 'the vacuum on the floor', AT.gravy.vac + 5);
  await read(bot, 41, 'counter');
  await up(bot, AT.gravy.counter[0], 5);
  await must(bot, bot.walk(AT.gravy.counter[2] + 2, 'off the end of the counter'), 'along the counter');
  await must(bot, bot.land(), 'down from the counter');
  await read(bot, 60, 'chat');
  await cross(bot, 64, 'the acorns');
  await door(bot, AT.gravy.gate, AT.gravy.exit, "Aunt Marjorie's door");
}

/** 4. Windy Park (Mr. Plume). */
export async function windyPark(bot: StarterBot): Promise<void> {
  await read(bot, 6, 'crew');
  for (const x of AT.park.dummies) {
    if (x === AT.park.dummies[1]) await read(bot, 20, 'dummy');
    await kickDown(bot, x, [MONS.dummy, MONS.dummyHit], 2, `the dummy at ${x}`);
  }
  await read(bot, 29, 'casserole');
  await up(bot, AT.park.shelf[0], 2);
  await kickDown(bot, AT.park.shelfDummy, [MONS.dummy, MONS.dummyHit], 2, 'the dummy up top', 2);
  await must(bot, bot.walk(AT.park.dish, 'the casserole'), 'to the casserole');
  await down(bot, AT.park.shelf[0]);
  await read(bot, 44, 'chat');
  await cross(bot, 48, 'the acorns');
  await kickVac(bot, AT.park.vac, 'the crew vacuum');
  await read(bot, 57, 'tent');
  await cross(bot, AT.park.gate - 1, 'the tent');
  await must(bot, bot.wait(20), 'at the tent');
  await kickDown(bot, AT.park.lateDummy, [MONS.dummy, MONS.dummyHit], 2, 'the last dummy');
  await cross(bot, 76, 'the acorns');
  await leave(bot, bot.walk(AT.park.exit + 1, 'the exit'), 'the exit');
}

/** 5. Hungry Dog (Rory). */
export async function hungryDog(bot: StarterBot): Promise<void> {
  await read(bot, 8, 'rolls');
  await cross(bot, AT.dog.dish + 1, 'the rolls');
  await read(bot, 12, 'chat');
  await hopVac(bot, AT.dog.vac, 'the vacuum', AT.dog.vac + 5);
  // the dog will not let the rolls by: walk up to him once, as a person would, then go for the bone
  await read(bot, 42, 'dog');
  await cross(bot, AT.dog.dog - 1, 'the dog');
  await must(bot, bot.wait(30), 'looking at the dog');
  await up(bot, AT.dog.shelf[0], 2);
  await hop(bot, AT.dog.shelfVac, 'the vacuum on the shelf');
  await must(bot, bot.walk(AT.dog.bone, 'the bone'), 'to the bone');
  await hop(bot, AT.dog.shelfVac, 'the vacuum on the shelf, going back', 'left');
  await down(bot, AT.dog.shelf[0]);
  await cross(bot, AT.dog.dog + 2, 'the dog, with the bone');
  await must(bot, bot.wait(40), 'watching him chew');
  await read(bot, 50, 'narrator');
  await hopVac(bot, AT.dog.vac2, 'the long vacuum', AT.dog.vac2 + 6);
  await cross(bot, 60, 'the acorns');
  await door(bot, AT.dog.gate, AT.dog.exit, "Dale's gate");
}

/** 6. Big Gobble (Mr. Plume). */
export async function bigGobble(bot: StarterBot): Promise<void> {
  await cross(bot, AT.dash.dish + 1, 'the rolls');
  await must(bot, bot.wait(20), 'reading Rory');
  await kickDown(bot, AT.dash.inflatables[0], [MONS.inflatable], 1, 'the first parade turkey');
  await hop(bot, AT.dash.floats[0], 'the first float');
  await kickDown(bot, AT.dash.inflatables[1], [MONS.inflatable], 1, 'the second parade turkey');
  await hop(bot, AT.dash.floats[1], 'the second float');
  await kickVac(bot, AT.dash.vac, 'the parade vacuum');
  const blower = Array.from({ length: BLOWER_HITS }, (_, i) => MONS.blower + i);
  await kickDown(bot, AT.dash.blower, blower, BLOWER_HITS, "Big Gobble's blower");
  await cross(bot, AT.dash.hall + 2, 'the town hall');
  await door(bot, AT.dash.gate, AT.dash.exit, 'the long table');
}
