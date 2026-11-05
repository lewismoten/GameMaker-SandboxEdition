// The way through the game, as orders for the bot (kit/starter/bot.ts): the keys a person
// would press, level by level. Each sign's lesson is acted out once and checked:
//   level 1: Kit drops onto the road and reads the signs while the balls roll out of the hill;
//            the bot sees balls born at the vanishing point, each one passing through all four
//            sizes on its way down its lane, in all three lanes; then he walks to the door.
//   level 2: the finish arch grows through its four sizes, the barred door stays shut until it has
//            arrived and then opens, and Kit walks through.
// The checks here fail if anything else happens.
import type { Result, StarterBot } from '../../kit/starter/bot';
import { ORIGIN } from '../../kit/starter/map';
import { OPENS_AT } from '../src/levels';
import { BALL } from '../src/monsters';
import { DOOR_COL, GROUND_ROW } from '../src/view';

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

/** A person stopped at a sign for a moment to read it. */
const READ = 40;

/** Every ball alive: its lane (0 to 2), its size (0 to 3, the picture it shows) and its place in level pixels. */
export function balls(bot: StarterBot): { lane: number; size: number; x: number; y: number; id: number }[] {
  return bot.sim.w.mm.flatMap((m, i) => {
    if (m.monnum < BALL || m.monnum > BALL + 2) return [];
    const mi = bot.sim.w.mi[i];
    return [{ lane: m.monnum - BALL, size: mi.curPic, x: (mi.curx[0] - ORIGIN) * 20 + mi.curx[1], y: (mi.cury[0] - ORIGIN) * 20 + mi.cury[1], id: i }];
  });
}

/** The block shown at a level cell right now: the map holds the block's first look, and the engine's block table (blkmap) holds what it has turned into since. */
const blockAt = (bot: StarterBot, x: number, y: number): number => bot.sim.w.blkmap[bot.sim.w.map[(y + ORIGIN) * 100 + x + ORIGIN]];
/** Whether the block at a level cell is solid. */
const solidAt = (bot: StarterBot, x: number, y: number): boolean => bot.sim.w.bg[blockAt(bot, x, y)].solid !== 0;

/** 1. Over the Hill: balls roll out of the hill and grow as they come. */
export async function overTheHill(bot: StarterBot): Promise<void> {
  const lanes = new Set<number>();
  const last = new Map<number, number>();
  const seen = new Set<number>();
  let grown = 0;
  let born = 0;
  let first: { x: number; y: number } | undefined;
  const look = () => {
    for (const b of balls(bot)) {
      lanes.add(b.lane);
      // a slot is reused by the next ball, so count each time one shows the next size up
      if (b.size === 0 && last.get(b.id) !== 0) born++;
      if (b.size === 3 && last.get(b.id) === 2) grown++;
      last.set(b.id, b.size);
      seen.add(b.size);
      first ??= { x: b.x, y: b.y };
    }
  };
  const watch = async (ticks: number) => {
    for (let i = 0; i < ticks; i++) {
      await must(bot, bot.wait(1), 'watching the balls');
      look();
    }
  };
  await must(bot, bot.land(), 'dropping onto the road');
  await watch(READ); // the left sign
  await watch(READ); // the right sign
  await watch(330); // balls in all three lanes
  if (!first) throw new Error('level 1: no ball was ever born');
  if (first.y > 70) throw new Error(`level 1: the first ball should start at the horizon, not at y ${first.y}`);
  if (lanes.size !== 3) throw new Error(`level 1: balls should roll in all three lanes; saw ${[...lanes]}`);
  if (seen.size !== 4) throw new Error(`level 1: balls should show all four sizes; saw ${[...seen]}`);
  if (born < 6 || grown < born - 1)
    throw new Error(`level 1: ${born} balls were born and ${grown} grew through their sizes; expected 6 or more and all but the last`);
  bot.say(`${lanes.size} lanes, ${born} balls born, ${grown} grown through all four sizes`);
  await leave(bot, bot.walk(DOOR_COL, 'the exit'), 'the exit');
}

/** 2. Coming Closer: the arch grows, the bar lifts. */
export async function comingCloser(bot: StarterBot): Promise<void> {
  const t0 = bot.sim.w.clock;
  const seen = new Set<number>();
  const arch = (): void => void seen.add(blockAt(bot, 8, 3));
  const barTop = GROUND_ROW - 2;
  await must(bot, bot.land(), 'dropping onto the road');
  arch();
  await must(bot, bot.wait(READ), 'reading the arch sign');
  await must(bot, bot.wait(READ), 'reading the door sign');
  arch();
  await must(bot, bot.walk(DOOR_COL - 1, 'the door'), 'to the door');
  if (!solidAt(bot, DOOR_COL, barTop) || !solidAt(bot, DOOR_COL, barTop + 1)) throw new Error('level 2: the door should be barred when Kit comes to it');
  let opened = -1;
  for (let i = 0; i < 700 && opened < 0; i++) {
    await must(bot, bot.wait(1), 'waiting at the door');
    arch();
    if (!solidAt(bot, DOOR_COL, barTop) && !solidAt(bot, DOOR_COL, barTop + 1)) opened = bot.sim.w.clock - t0;
  }
  if (opened < 0) throw new Error('level 2: the door never opened');
  if (Math.abs(opened - OPENS_AT) > 12) throw new Error(`level 2: the door should open at tick ${OPENS_AT}; it opened at ${opened}`);
  if (seen.size < 4) throw new Error(`level 2: the arch should show four sizes at the vanishing point's row; saw ${seen.size}`);
  bot.say(`The arch grew through ${seen.size} sizes and the door opened at tick ${opened}`);
  await must(bot, bot.wait(READ), 'seeing the door open');
  await leave(bot, bot.walk(DOOR_COL, 'the exit'), 'the exit');
}
