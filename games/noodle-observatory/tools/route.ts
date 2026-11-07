// The way through the game, as orders for the bot (kit/starter/bot.ts): the keys a person would press, scene by
// scene. A room is played straight from the plan its map was painted from (src/place.ts): read each sign, climb to
// each shelf, take every part and every star washer, wait on the ladder for a wobbly shelf to come level, hop the
// gaps, fit each part in its socket. In the pantry the ring is steered with Left and Right only. In the three
// scenes to watch, the bot walks along, reads and stops to watch each thing happen. The checks fail if a treasure
// is missed, a part is not taken or fitted, a hit point is lost, or a scene moves on before it has been watched.
import type { Result, StarterBot } from '../../kit/starter/bot';
import { SCAN } from '../../kit/starter/ids';
import { ORIGIN } from '../../kit/starter/map';
import { POINTS, TILT, type Level } from '../src/level';
import { LENS_IN, LENSROLL, RING_UP, CLOTH_GONE, SUPPER } from '../src/monsters';
import { G, type Step } from '../src/place';
import { SHAFT, SHAFTS, pathAt, shaftPath } from '../src/levels/ring';
import { BAKERY, BAKERY_AT, LENSROLL_AT, STARVIEW, STARVIEW_AT } from '../src/levels/watch';
import { READ, climbUp, hop, leave, must, readAt, score, shownAt, watchFor } from './routeKit';

/** Ticks since the scene began. */
const since = (bot: StarterBot, t0: number) => bot.sim.w.clock - t0;

/** Walks to column `x` and checks the treasure there scored `points`. */
async function take(bot: StarterBot, x: number, points: number, what: string): Promise<void> {
  const before = bot.sim.ci.score;
  await must(bot, bot.walk(x, what), `to ${what}`);
  score(bot, before, points, what);
}

/** Waits on the ladder until the wobbly shelf at (x, row) has just come level again (it stays level a while). */
async function untilLevel(bot: StarterBot, l: Level, x: number, row: number): Promise<void> {
  const level = l.book.n('tilt0');
  const tipped = l.book.n('tilt2');
  if (shownAt(bot, x, row) !== tipped) await watchFor(bot, () => shownAt(bot, x, row) === tipped, 'the shelf tipping', TILT.level + TILT.wobble + TILT.tipped + 20);
  await watchFor(bot, () => shownAt(bot, x, row) === level, 'the shelf coming level', TILT.tipped + 20);
}

const itemsOf = (s: { part?: { x: number }; washer?: number }): number[] => [s.part?.x, s.washer].filter((v): v is number => v !== undefined);

async function pocket(bot: StarterBot, l: Level, s: Extract<Step, { t: 'pocket' }>): Promise<void> {
  const what = `the shelf at column ${s.ladder}`;
  await climbUp(bot, s.ladder, s.row - 1, `the ladder to ${what}`);
  if (s.tilt) await untilLevel(bot, l, s.tilt[0], s.row);
  const low = itemsOf(s);
  if (low.length) await must(bot, bot.walk(Math.max(...low), what), `along ${what}`);
  if (s.up) {
    await must(bot, bot.walk(s.up.ladder, 'the upper ladder'), 'onto the upper ladder');
    await must(bot, bot.climb('up', s.up.row - 1, 'up the upper ladder'), 'up the upper ladder');
    const high = itemsOf(s.up);
    await must(bot, bot.walk(Math.max(s.up.ladder + 1, ...high), 'the upper shelf'), 'along the upper shelf');
    await must(bot, bot.walk(s.up.ladder, 'the upper ladder'), 'back to the upper ladder');
    await must(bot, bot.climb('down', s.row - 1, 'down to the shelf'), 'down to the shelf');
  }
  if (s.back === 'ladder') {
    await must(bot, bot.walk(s.ladder, 'the ladder'), `back to the ladder of ${what}`);
    await must(bot, bot.climb('down', G - 1, 'down the ladder'), `down the ladder of ${what}`);
  } else {
    await must(bot, bot.walk(s.to + 1, 'the end of the shelf'), `off ${what}`);
    await must(bot, bot.land(), 'landing');
  }
}

/** The points a plan's step should score. */
function pointsOf(s: Step): number {
  const part = POINTS.part;
  if (s.t === 'washer') return POINTS.washer;
  if (s.t === 'take' || s.t === 'gate' || s.t === 'pad') return part;
  if (s.t === 'pocket') {
    const one = (p: { part?: unknown; washer?: number }) => (p.part ? part : 0) + (p.washer !== undefined ? POINTS.washer : 0);
    return one(s) + (s.up ? one(s.up) : 0);
  }
  return 0;
}

/** A room: every step of its plan in order, then the door. */
export async function playRoom(bot: StarterBot, l: Level): Promise<void> {
  const from = bot.sim.ci.score;
  const hp = bot.sim.ci.hitpts;
  for (const s of l.plan ?? []) {
    const before = bot.sim.ci.score;
    switch (s.t) {
      case 'sign':
        await readAt(bot, s.x + 1, `the sign at ${s.x}`);
        break;
      case 'washer':
        await take(bot, s.x, POINTS.washer, `the washer at ${s.x}`);
        break;
      case 'take':
      case 'pad':
        await take(bot, s.x, POINTS.part, `the ${s.part.icon} at ${s.x}`);
        break;
      case 'pocket':
        await pocket(bot, l, s);
        break;
      case 'gate':
        await must(bot, bot.walk(s.x + 1, `through the ${s.part.icon} socket`), `through the ${s.part.icon} socket at ${s.x}`);
        break;
      case 'pit':
        await hop(bot, s.x, s.n, `the gap at ${s.x}`);
        break;
      case 'planter':
        await hop(bot, s.x, 1, `the planter at ${s.x}`);
        break;
      case 'look':
        await must(bot, bot.wait(s.ticks), 'a look');
        break;
    }
    // (sockets side by side are fitted in one walk, so a socket's points are counted with the room's)
    if (s.t !== 'gate') score(bot, before, pointsOf(s), `${l.file}: ${s.t} at ${'x' in s ? s.x : s.ladder}`);
  }
  const want = (l.plan ?? []).reduce((t, s) => t + pointsOf(s), 0);
  score(bot, from, want, l.file);
  if (bot.sim.ci.hitpts !== hp) throw new Error(`${l.file} cost hit points: ${hp} -> ${bot.sim.ci.hitpts}`);
  await leave(bot, bot.walk(l.map.width - 3 + 0.2, 'the way on'), `${l.file}: the way on`);
}

/** The ring's bottom block row (decimals and all). */
const rowOf = (bot: StarterBot): number => bot.px.y / 20;

/** A pantry shaft: steer with Left and Right along the line through the gaps (looking a block and a half ahead) to the docking shelf. */
export async function playShaft(bot: StarterBot, l: Level): Promise<void> {
  const s = SHAFTS.find((x) => x.file === l.file)!;
  const path = shaftPath(s);
  const from = bot.sim.ci.score;
  let dir = 0;
  let out: Result;
  for (let t = 0; t < 6000 && !out; t++) {
    const want = pathAt(path, rowOf(bot) - 1.5) * 20;
    const next = bot.px.x < want - 4 ? 1 : bot.px.x > want + 4 ? -1 : 0;
    if (next !== dir) {
      if (dir) bot.sim.release(dir > 0 ? SCAN.right : SCAN.left);
      if (next) bot.sim.press(next > 0 ? SCAN.right : SCAN.left);
      dir = next;
    }
    out = await bot.tick();
  }
  bot.sim.releaseAll();
  if (out !== 'link') throw new Error(`${l.file}: the ring never docked (${out ?? `at ${(bot.px.x / 20).toFixed(1)}, ${rowOf(bot).toFixed(1)}`})`);
  const got = bot.sim.ci.score - from;
  if (got !== s.washers.length * POINTS.washer) throw new Error(`${l.file}: scored ${got}, expected ${s.washers.length * POINTS.washer}`);
  void SHAFT;
}

/** First Lens: read along, watch the toy roll the lens into the scope and the ring roll up to the moon, then go. */
async function lensroll(bot: StarterBot): Promise<void> {
  const t0 = bot.sim.w.clock;
  const A = LENSROLL_AT;
  await readAt(bot, A.signs.monkey + 1, 'the Monkey Day sign');
  await must(bot, bot.walk(A.toy + 2, 'the counter'), 'to the counter');
  if (since(bot, t0) > LENSROLL.start) throw new Error('the toy started before Nell got to watch');
  await watchFor(bot, () => since(bot, t0) > LENSROLL.start + 60, 'the toy starting off', 400);
  await must(bot, bot.walk(A.scope - 1, 'beside the scope'), 'along the counter');
  await watchFor(bot, () => since(bot, t0) > LENS_IN + 60, 'the lens going into the scope', 600);
  await readAt(bot, A.signs.rolled + 1, 'the lens sign');
  await must(bot, bot.walk(A.window[0] - 1, 'under the window'), 'to the window');
  if (since(bot, t0) > LENSROLL.ring) throw new Error('the ring started before Nell got to the window');
  await watchFor(bot, () => since(bot, t0) > RING_UP + 30, 'the ring framing the moon', 600);
  await readAt(bot, A.signs.ring + 1, 'the ring sign');
  await readAt(bot, A.signs.closer + 1, 'the closer-look sign');
  await watchFor(bot, () => since(bot, t0) > LENSROLL.open, 'the cupboard door opening', 900);
  await leave(bot, bot.walk(A.width - 3 + 0.2, 'the way on'), 'lensroll: the way on');
}

/** Kitchen in the Stars: stand under each shape as its shaft of light comes on, read, then go. */
async function starview(bot: StarterBot): Promise<void> {
  const t0 = bot.sim.w.clock;
  const A = STARVIEW_AT;
  await readAt(bot, A.signs.set + 1, 'the shutters sign');
  for (const name of ['spoon', 'fork', 'col'] as const) {
    await must(bot, bot.walk(A.shapes[name][0], `under the ${name}`), `to the ${name}`);
    if (since(bot, t0) > STARVIEW[name]) throw new Error(`the ${name} lit before Nell got there`);
    await watchFor(bot, () => since(bot, t0) > STARVIEW[name] + 40, `the ${name} lighting up`, 600);
    await readAt(bot, A.signs[name] + 1, `the ${name} sign`);
  }
  await readAt(bot, A.signs.drawer + 1, 'the kitchen drawer sign');
  await watchFor(bot, () => since(bot, t0) > STARVIEW.open, 'the way on opening', 900);
  await leave(bot, bot.walk(A.width - 3 + 0.2, 'the way on'), 'starview: the way on');
}

/** A Most Local Moon: walk to the table, look at the moon until its light comes up, read, watch the ring take the cloth, go. */
async function bakery(bot: StarterBot): Promise<void> {
  const t0 = bot.sim.w.clock;
  const A = BAKERY_AT;
  await readAt(bot, A.signs.set + 1, 'the supper sign');
  await readAt(bot, A.signs.look + 1, 'the one-more-look sign');
  await must(bot, bot.walk(A.table[0] + 2, 'the table'), 'to the table');
  if (since(bot, t0) > BAKERY.reveal) throw new Error('the window lit before Nell looked');
  await watchFor(bot, () => since(bot, t0) > BAKERY.reveal + 60, 'the window lighting up', 600);
  await readAt(bot, A.signs.sill + 1, 'the sill sign');
  await readAt(bot, A.signs.bakery + 1, 'the bakery sign');
  if (since(bot, t0) > SUPPER.ring) throw new Error('the ring came before Nell turned round');
  await watchFor(bot, () => since(bot, t0) > CLOTH_GONE + 40, 'the ring rolling off with the cloth', 900);
  await watchFor(bot, () => since(bot, t0) > SUPPER.open, 'the way on opening', 900);
  await leave(bot, bot.walk(A.width - 3 + 0.2, 'the way on'), 'bakery: the way on');
}

const WATCH: Record<string, (bot: StarterBot) => Promise<void>> = { lensroll, starview, bakery };

/** The orders for one scene. */
export function routeFor(l: Level): (bot: StarterBot) => Promise<void> {
  if (WATCH[l.file]) return WATCH[l.file];
  if (l.hero === 'ring') return (bot) => playShaft(bot, l);
  return (bot) => playRoom(bot, l);
}

void [READ, ORIGIN];
