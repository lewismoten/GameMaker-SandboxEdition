// The way through the game, as orders for the bot (kit/starter/bot.ts): the keys a person
// would press, level by level. Each sign's lesson is acted out once and checked:
//   level 1: Kit reads the signs while the hills, the trees and the rail slide; the bot sees each strip's
//            blocks go round their ring more than once, near strips faster than far ones, and neighbors half a tile apart.
//   level 2: the car goes round the loop (the same place every lap), turned all four ways; a lamp lights per lap,
//            the barred door stays shut until the third and then opens, and Kit walks through.
// The checks here fail if anything else happens.
import type { Result, StarterBot } from '../../kit/starter/bot';
import { ORIGIN } from '../../kit/starter/map';
import { CAR } from '../src/monsters';
import { LAP, OPENS_AT } from '../src/levels';
import { CAR_AT, DOOR2_COL, DOOR_COL, GROUND_ROW, HILLS, LAMPS, LAPS, RAIL, TILE, TREES } from '../src/view';

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
const blockAt = (bot: StarterBot, x: number, y: number): number => bot.sim.w.blkmap[bot.sim.w.map[(y + ORIGIN) * 100 + x + ORIGIN]];
/** Whether the block at a level cell is solid. */
const solidAt = (bot: StarterBot, x: number, y: number): boolean => bot.sim.w.bg[blockAt(bot, x, y)].solid !== 0;

/** The car now: its place in level pixels and the way its picture is turned (0 to 3), or nothing before it is born. */
export function car(bot: StarterBot): { x: number; y: number; orient: number } | undefined {
  const i = bot.sim.w.mm.findIndex((m) => m.monnum === CAR);
  if (i < 0) return undefined;
  const mi = bot.sim.w.mi[i];
  return { x: (mi.curx[0] - ORIGIN) * 20 + mi.curx[1], y: (mi.cury[0] - ORIGIN) * 20 + mi.cury[1], orient: mi.orient };
}

/** 1. The Road Goes By: three strips of blocks slide, each its own speed. */
export async function roadGoesBy(bot: StarterBot): Promise<void> {
  const strips = [
    { name: 'hills', s: HILLS, cell: [3, HILLS.rows[0]] },
    { name: 'trees', s: TREES, cell: [3, TREES.rows[0]] },
    { name: 'rail', s: RAIL, cell: [5, RAIL.rows[0]] },
  ] as const;
  const changes = new Map<string, number>();
  const seen = new Map<string, Set<number>>(strips.map((t) => [t.name, new Set<number>()]));
  const last = new Map<string, number>();
  let apart = 0;
  const look = () => {
    for (const t of strips) {
      const b = blockAt(bot, t.cell[0], t.cell[1]);
      if (last.has(t.name) && last.get(t.name) !== b) changes.set(t.name, (changes.get(t.name) ?? 0) + 1);
      last.set(t.name, b);
      seen.get(t.name)!.add(b);
    }
    // neighbors in a column start half a tile apart: columns 3 and 4 of the trees are different blocks
    if (blockAt(bot, 3, TREES.rows[0]) !== blockAt(bot, 4, TREES.rows[0])) apart++;
  };
  const watch = async (ticks: number) => {
    for (let i = 0; i < ticks; i++) {
      await must(bot, bot.wait(1), 'watching the strips');
      look();
    }
  };
  await must(bot, bot.land(), 'dropping onto the truck');
  await watch(READ); // the left sign
  await watch(READ); // the right sign
  await watch(260); // the strips go round
  for (const t of strips) {
    const n = TILE / t.s.shift;
    const turns = (changes.get(t.name) ?? 0) / n;
    if (seen.get(t.name)!.size !== n || turns < 1.5)
      throw new Error(
        `level 1: the ${t.name} strip should go round its ${n} blocks at least one and a half times; it showed ${seen.get(t.name)!.size} and went round ${turns.toFixed(1)} times`,
      );
  }
  const px = (name: string, shift: number) => (changes.get(name) ?? 0) * shift;
  if (!(px('rail', RAIL.shift) > px('trees', TREES.shift) && px('trees', TREES.shift) > px('hills', HILLS.shift)))
    throw new Error(
      `level 1: nearer strips should slide farther: hills ${px('hills', HILLS.shift)}, trees ${px('trees', TREES.shift)}, rail ${px('rail', RAIL.shift)} pixels`,
    );
  if (apart < 200) throw new Error('level 1: neighbors should be half a tile apart');
  bot.say(`in 340 ticks the hills slid ${px('hills', HILLS.shift)} pixels, the trees ${px('trees', TREES.shift)} and the rail ${px('rail', RAIL.shift)}`);
  await leave(bot, bot.walk(DOOR_COL, 'the exit'), 'the exit');
}

/** 2. Round the Loop: the car goes round, a lamp per lap, the door opens at the third. */
export async function roundTheLoop(bot: StarterBot): Promise<void> {
  const t0 = bot.sim.w.clock;
  const barTop = GROUND_ROW - 2;
  const orients = new Set<number>();
  const startX = CAR_AT[0] * 20;
  const startY = CAR_AT[1] * 20;
  const lapAt: number[] = [];
  let wasAway = false;
  const lit = new Map<number, number>();
  const lampBlocks = LAMPS.map(([x, y]) => blockAt(bot, x, y));
  // looked at on every tick of the engine, so no moment is missed while Kit walks
  const look = () => {
    const now = bot.sim.w.clock - t0;
    const c = car(bot);
    if (c) {
      orients.add(c.orient);
      const dist = Math.abs(c.x - startX) + Math.abs(c.y - startY);
      if (dist > 40) wasAway = true;
      else if (wasAway && dist < 12) {
        lapAt.push(now);
        wasAway = false;
      }
    }
    LAMPS.forEach(([x, y], k) => {
      if (!lit.has(k) && blockAt(bot, x, y) !== lampBlocks[k]) lit.set(k, now);
    });
  };
  const tick = bot.sim.tick.bind(bot.sim);
  bot.sim.tick = async () => {
    const r = await tick();
    look();
    return r;
  };
  const watch = (ticks: number) => must(bot, bot.wait(ticks), 'watching the loop');
  await must(bot, bot.land(), 'dropping onto the lawn');
  await watch(READ);
  await watch(READ);
  await must(bot, bot.walk(DOOR2_COL - 1, 'the door'), 'to the door');
  if (!solidAt(bot, DOOR2_COL, barTop) || !solidAt(bot, DOOR2_COL, barTop + 1)) throw new Error('level 2: the door should be barred when Kit comes to it');
  let opened = -1;
  for (let i = 0; i < 700 && opened < 0; i++) {
    await watch(1);
    if (!solidAt(bot, DOOR2_COL, barTop) && !solidAt(bot, DOOR2_COL, barTop + 1)) opened = bot.sim.w.clock - t0;
  }
  if (opened < 0) throw new Error('level 2: the door never opened');
  if (Math.abs(opened - OPENS_AT) > 12) throw new Error(`level 2: the door should open at tick ${OPENS_AT}; it opened at ${opened}`);
  if (orients.size !== 4) throw new Error(`level 2: the car should be turned all four ways; saw ${[...orients].sort()}`);
  if (lapAt.length < LAPS) throw new Error(`level 2: the car should be back at the start line ${LAPS} times; it was at ${lapAt}`);
  lapAt.slice(0, LAPS).forEach((t, k) => {
    if (Math.abs(t - LAP * (k + 1)) > 6) throw new Error(`level 2: lap ${k + 1} should end at tick ${LAP * (k + 1)}; the car was home at ${t}`);
    if (Math.abs((lit.get(k) ?? -999) - t) > 8)
      throw new Error(`level 2: lamp ${k + 1} should light as lap ${k + 1} ends (tick ${t}); it lit at ${lit.get(k)}`);
  });
  bot.sim.tick = tick;
  bot.say(
    `The car went round in ${lapAt.slice(0, LAPS).join(', ')} ticks, the lamps lit at ${[...lit.values()].join(', ')} and the door opened at tick ${opened}`,
  );
  await must(bot, bot.wait(READ), 'seeing the door open');
  await leave(bot, bot.walk(DOOR2_COL, 'the exit'), 'the exit');
}
