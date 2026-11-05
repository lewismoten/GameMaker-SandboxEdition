// The way through the game, as orders for the bot (kit/starter/bot.ts): the keys a person
// would press, level by level. Each sign's lesson is acted out once and checked:
//   level 1: Kit drops onto the path and reads the signs while the three bands slide; the bot
//            counts how often each band's block changes, which must be the band's own rate
//            (hills every 4 ticks, town every 2, fence every tick), and that each ring comes
//            round (10, 10 and 5 pictures); the sky above them does not change. Then he walks to the door.
//   level 2: the wisps and the clouds change at their own rates, the three suns fill at ticks
//            100, 200 and 300, the barred door stays shut until the last one and then opens,
//            and Kit walks through.
// The checks here fail if anything else happens.
import type { Result, StarterBot } from '../../kit/starter/bot';
import { ORIGIN } from '../../kit/starter/map';
import { OPENS_AT, SUN_AT, SUN_COLS } from '../src/levels';
import { CLOUDS, DOOR_COL, FENCE, GROUND_ROW, HILLS, TOWN, WISPS, ringSize, type Band } from '../src/view';

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

/** The block shown at a level cell right now: the map holds the block's first look, and the engine's block table (blkmap) holds what it has turned into since. */
export const blockAt = (bot: StarterBot, x: number, y: number): number => bot.sim.w.blkmap[bot.sim.w.map[(y + ORIGIN) * 100 + x + ORIGIN]];
/** Whether the block at a level cell is solid. */
const solidAt = (bot: StarterBot, x: number, y: number): boolean => bot.sim.w.bg[blockAt(bot, x, y)].solid !== 0;

/** A band under watch: how many times its block changed and which blocks it showed. */
export interface Watch {
  band: Band;
  col: number;
  changes: number;
  seen: Set<number>;
  last: number;
}
export const watchOf = (bot: StarterBot, band: Band, col: number): Watch => ({ band, col, changes: 0, seen: new Set(), last: blockAt(bot, col, band.row) });
export function look(bot: StarterBot, w: Watch): void {
  const now = blockAt(bot, w.col, w.band.row);
  if (now !== w.last) w.changes++;
  w.last = now;
  w.seen.add(now);
}

/** Watches bands for `ticks` ticks and checks each one changed at its own rate and came round its whole ring. */
async function watchBands(bot: StarterBot, bands: [string, Band][], col: number, ticks: number): Promise<string> {
  const ws = bands.map(([, b]) => watchOf(bot, b, col));
  for (let i = 0; i < ticks; i++) {
    await must(bot, bot.wait(1), 'watching the bands');
    ws.forEach((w) => look(bot, w));
  }
  return bands
    .map(([name, b], i) => {
      const w = ws[i];
      const want = ticks / b.ticks;
      if (Math.abs(w.changes - want) > 2) throw new Error(`${name}: expected about ${want} changes in ${ticks} ticks (every ${b.ticks}), saw ${w.changes}`);
      if (w.seen.size !== ringSize(b)) throw new Error(`${name}: the ring should show ${ringSize(b)} pictures, saw ${w.seen.size}`);
      return `${name} ${w.changes}`;
    })
    .join(', ');
}

/** 1. Three Speeds: three bands, three rates. */
export async function threeSpeeds(bot: StarterBot): Promise<void> {
  await must(bot, bot.land(), 'dropping onto the path');
  const sky = blockAt(bot, 6, 2);
  await must(bot, bot.wait(READ), 'reading the left sign');
  await must(bot, bot.wait(READ), 'reading the right sign');
  const said = await watchBands(
    bot,
    [
      ['hills', HILLS],
      ['town', TOWN],
      ['fence', FENCE],
    ],
    6,
    200,
  );
  if (blockAt(bot, 6, 2) !== sky) throw new Error('level 1: the sky above the bands should not change');
  bot.say(`In 200 ticks the blocks changed: ${said}`);
  await leave(bot, bot.walk(DOOR_COL, 'the exit'), 'the exit');
}

/** 2. Drifting Clouds: two speeds of cloud, three suns, a barred door. */
export async function driftingClouds(bot: StarterBot): Promise<void> {
  const t0 = bot.sim.w.clock;
  const barTop = GROUND_ROW - 2;
  await must(bot, bot.land(), 'dropping onto the path');
  const ws = [watchOf(bot, WISPS, 6), watchOf(bot, CLOUDS, 6), watchOf(bot, HILLS, 6)];
  /** What a cell looks like now (a sun's blocks differ before they differ in picture). */
  const look2 = (x: number): string => bot.sim.w.bg[blockAt(bot, x, 2)].pixels.join(',');
  const start = SUN_COLS.map(look2);
  const filled = () => SUN_COLS.filter((x, i) => look2(x) !== start[i]).length;
  const waitUntil = async (tick: number) => {
    while (bot.sim.w.clock - t0 < tick) {
      await must(bot, bot.wait(1), 'watching the sky');
      ws.forEach((w) => look(bot, w));
    }
  };
  await must(bot, bot.wait(READ), 'reading the left sign');
  await must(bot, bot.wait(READ), 'reading the right sign');
  if (filled() !== 0) throw new Error('level 2: no sun should be full at the start');
  await must(bot, bot.walk(DOOR_COL - 1, 'the door'), 'to the door');
  if (!solidAt(bot, DOOR_COL, barTop) || !solidAt(bot, DOOR_COL, barTop + 1)) throw new Error('level 2: the door should be barred when Kit comes to it');
  for (let s = 0; s < 3; s++) {
    await waitUntil(SUN_AT[s] + 8);
    if (filled() !== s + 1) throw new Error(`level 2: ${s + 1} suns should be full at tick ${SUN_AT[s] + 8}; ${filled()} are`);
  }
  if (solidAt(bot, DOOR_COL, barTop) || solidAt(bot, DOOR_COL, barTop + 1)) throw new Error(`level 2: the door should be open by tick ${OPENS_AT + 8}`);
  for (const w of ws) {
    const want = (bot.sim.w.clock - t0 - READ * 2) / w.band.ticks;
    if (w.changes < want * 0.5) throw new Error(`level 2: band on row ${w.band.row} changed only ${w.changes} times`);
  }
  if (ws[0].changes * 2 > ws[1].changes + 3 || ws[1].changes < ws[2].changes)
    throw new Error(`level 2: the near clouds should change oftener than the wisps (${ws.map((w) => w.changes)})`);
  bot.say(`Suns filled at ticks ${SUN_AT.join(', ')}; the door opened`);
  await must(bot, bot.wait(READ), 'seeing the door open');
  await leave(bot, bot.walk(DOOR_COL, 'the exit'), 'the exit');
}
