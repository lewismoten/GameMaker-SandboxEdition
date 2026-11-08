// The way through the game, as orders for the bot (kit/starter/bot.ts): the keys a person would press, level by level.
// It acts out each lesson once, the mistake included, and checks what each sign says against what the engine shows:
//   level 1: walks into the sea off the pier (stopped), watches the sea turn: where the whole sea is one block every cell
//            shows the same frame, where it is four starts a screen shows four
//   level 2: walks into the sea off the beach (stopped), watches an edge block run up the sand and back, and walks the
//            beach to the point and the doors
import type { Result, StarterBot } from '../../kit/starter/bot';
import { SCAN } from '../../kit/starter/ids';
import { buildLevels } from '../src/levels';

/** A person's look at what just happened, in ticks (about a second and a half). */
const LOOK = 40;
const { levels } = buildLevels();
/** Where level blocks sit in the 100x100 world. */
const OX = 18;
const OY = 38;

async function must(bot: StarterBot, r: Promise<Result>, what: string): Promise<void> {
  const out = await r;
  if (out) throw new Error(`${what}: ${out}\n${bot.log.slice(-8).join('\n')}`);
}

/** The last order of a level: it must take the hero through a door (to the next level or the ending). */
async function leave(bot: StarterBot, r: Promise<Result>, what: string): Promise<void> {
  const out = await r;
  if (out !== 'link' && out !== 'end') throw new Error(`${what}: ${out ?? 'still here'}\n${bot.log.slice(-8).join('\n')}`);
}

const here = (bot: StarterBot) => {
  const p = bot.sim.pos;
  return { x: (p.x - OX) * 20 + p.sx, y: (p.y - OY) * 20 + p.sy };
};

/** Holds `key` until `done()` or `max` ticks. */
async function hold(bot: StarterBot, key: keyof typeof SCAN, done: () => boolean, max: number, what: string): Promise<Result> {
  bot.sim.press(SCAN[key]);
  for (let t = 0; t < max && !done(); t++) {
    const r = await bot.tick();
    if (r) return (bot.sim.releaseAll(), r);
  }
  bot.sim.releaseAll();
  return done() ? undefined : `${what}: stopped at ${JSON.stringify(here(bot))}`;
}

/** Walks east until the hero's left edge is at level block `x`. */
const walkTo = (bot: StarterBot, x: number, what: string) => hold(bot, 'right', () => here(bot).x >= x * 20, 4000, what);

/** The different blocks the screen's cells show right now, within `rx` blocks of the hero across and 5 above and below, without the planks and sand. */
function framesInView(bot: StarterBot, level: 0 | 1, rx = 8): number {
  const book = levels[level].book;
  const m = levels[level].map.done();
  const p = bot.sim.pos;
  const shown = new Set<number>();
  const water = [...book.index.keys()].filter((n) => n.startsWith('sea.')).map((n) => book.n(n));
  for (let y = p.y - 5; y <= p.y + 5; y++)
    for (let x = p.x - rx; x <= p.x + rx; x++) {
      const b = m.blocks[y * 100 + x];
      if (water.includes(b)) shown.add(bot.sim.w.blkmap[b]);
    }
  return shown.size;
}

/** Walks into the water in direction `key` until he stops, and checks he did stop short of it. */
async function bumpWater(bot: StarterBot, key: 'up' | 'down', at: (y: number) => boolean): Promise<void> {
  let last = here(bot).y;
  let still = 0;
  bot.sim.press(SCAN[key]);
  for (let t = 0; t < 200 && still < 8; t++) {
    await must(bot, bot.tick(), 'into the water');
    const y = here(bot).y;
    still = y === last ? still + 1 : 0;
    last = y;
  }
  bot.sim.releaseAll();
  if (still < 8 || !at(last)) throw new Error(`the water should stop him; he stopped (${still}) at y ${last}`);
  bot.say(`stopped by the water at y ${last}`);
}

/** 1. Open Water: a pier over a sea that is one block, then a sea of four starts. */
export async function openWater(bot: StarterBot): Promise<void> {
  const book = levels[0].book;
  await must(bot, bot.wait(20), 'a beat');
  await must(bot, walkTo(bot, 11, 'to the pier'), 'to the pier');
  await bumpWater(bot, 'down', (y) => y >= 7 * 20 && y < 8 * 20);
  await must(bot, bot.wait(LOOK), 'looking at the sea');
  // the whole first stretch is the one block: the sea shows a single frame, whenever you look
  const one = framesInView(bot, 0, 3);
  if (one !== 1) throw new Error(`the first sea is one block, so it should show one frame at a time, not ${one}`);
  const before = bot.sim.w.blkmap[book.n('sea.0')];
  await must(bot, bot.wait(7), 'a moment');
  if (bot.sim.w.blkmap[book.n('sea.0')] === before) throw new Error('the sea should have turned by itself');
  bot.say('the whole sea turned together');
  await must(bot, walkTo(bot, 28, 'to the middle platform'), 'to the middle platform');
  await must(bot, bot.wait(LOOK), 'reading');
  await must(bot, walkTo(bot, 44, 'into the second sea'), 'into the second sea');
  const four = framesInView(bot, 0, 3);
  if (four !== 4) throw new Error(`the second sea has four starts, so it should show four frames at once, not ${four}`);
  bot.say(`the second sea shows ${four} frames at once`);
  await must(bot, bot.wait(LOOK), 'watching the ripples');
  await leave(bot, walkTo(bot, 64, 'the doors'), 'the doors');
}

/** 2. The Shoreline: along the sand, past the cove and out to the point. */
export async function shoreline(bot: StarterBot): Promise<void> {
  const book = levels[1].book;
  await must(bot, bot.wait(20), 'a beat');
  await must(bot, walkTo(bot, 13, 'to the north shore'), 'along the beach');
  await bumpWater(bot, 'up', (y) => y >= 3 * 20 && y <= 4 * 20);
  await must(bot, bot.wait(LOOK), 'looking at the waves');
  // an edge block's ring: it goes round all four frames by itself
  const edge = [...book.index.keys()].find((n) => n.startsWith('shore') && n.endsWith('.0'))!;
  const seen = new Set<number>();
  for (let t = 0; t < 40; t++) {
    seen.add(bot.sim.w.blkmap[book.n(edge)]);
    await must(bot, bot.tick(), 'watching the edge');
  }
  if (seen.size !== 4) throw new Error(`an edge block should go through its four blocks in 40 ticks, not ${seen.size}`);
  bot.say(`${edge} went through ${seen.size} frames`);
  await must(
    bot,
    hold(bot, 'down', () => here(bot).y >= 10 * 20, 400, 'back to the path'),
    'back to the path',
  );
  await must(bot, walkTo(bot, 19, 'under the cove'), 'under the cove');
  await must(bot, bot.wait(LOOK), 'looking at the cove');
  await must(bot, walkTo(bot, 43, 'to the point'), 'to the point');
  await must(bot, bot.wait(LOOK), 'reading');
  await leave(
    bot,
    hold(bot, 'up', () => false, 400, 'up the point'),
    'the doors',
  );
}
