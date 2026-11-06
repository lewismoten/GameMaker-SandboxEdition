// FIREWORKS' monsters (.MON) and their pictures (.MBL). Every one is harmless: the same power (so none can pop
// another), no hit points, never solid, and they fly through anything.
//
//   ROCKET, ROCKET_TEAL  a rocket that flies straight up 5 blocks, slowing as it climbs. A launcher block gives birth to
//                        one every few seconds (levels.ts); so does Enter (hero.ts). When its path ends it dies and
//                        turns into its burst (its "new monster").
//   POP, POP_TEAL        a small burst, one block: it falls one block as it burns out, and when that path ends it is
//                        gone for good (its new monster is none).
//   the big ones         a ring, a peony and a willow, each 3x3 blocks: nine monsters, one per block, on the same path
//                        at the same speeds, so they keep their square. Each block is a FLIGHT that turns into a BURST
//                        and back: the flight waits unseen, goes down to the launcher unseen, then climbs as a rocket
//                        (only the middle one shows it); the burst falls and fades, then turns back into the flight.
//                        Two monsters taking turns make a firework that never stops.
// The engine's monster file has room for 100 pictures and 64 monsters; FIREWORKS uses most of both.
import { MONBL } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { LASTMON, LASTSL, newMonsterSet, type March, type Monster } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import { corner, mon } from '@lewismoten/gamemaker-sandbox-tools/kit/actors';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { Book } from '../../kit/starter/book';
import type { Pal } from '../../kit/starter/palette';
import { BURSTS, burstKind, burstPicture, rocketPicture, sampleTimes, type BurstKind } from './sparks';

/** Every monster's power: equal, so none can pop another, and over 100, so touching the hero pops none. */
export const POWER = 150;
/** Blocks a rocket climbs. */
export const CLIMB = 5;
/** The rocket's climb: [blocks, pixels a tick], fast off the launcher and slow at the top (5 + 5 + 10 = 20 ticks). */
const CLIMB_LEGS: readonly [number, number][] = [
  [3, 12],
  [1, 4],
  [1, 2],
];
/** Ticks each rocket picture shows: they take turns, so the trail fizzes. */
const FIZZ = 2;

export const ROCKET = 0;
export const ROCKET_TEAL = 1;
export const POP = 2;
export const POP_TEAL = 3;
/** The first of the big fireworks' monsters (each takes 18: a flight and a burst for each of its nine blocks). */
const BIG_FROM = 4;

/** The big fireworks of level 2, in monster order: what bursts, how high it goes and how long its flight waits unseen. */
export interface Big {
  kind: 'ring' | 'peony' | 'willow';
  /** Blocks the burst falls while it burns (the willow falls inside its own frames instead). */
  fall: number;
  /** The unseen wait: blocks the flight goes on down under its launcher (and back up) and its speed, so each big firework keeps its own time. */
  wait: [number, number];
}
export const BIGS: readonly Big[] = [
  { kind: 'ring', fall: 2, wait: [2, 2] },
  { kind: 'peony', fall: 2, wait: [3, 2] },
  { kind: 'willow', fall: 0, wait: [5, 4] },
];

/** The nine blocks of a big firework, middle first: [dx, dy] from the middle. */
export const CELLS: readonly [number, number][] = [
  [0, 0],
  [-1, -1],
  [0, -1],
  [1, -1],
  [-1, 0],
  [1, 0],
  [-1, 1],
  [0, 1],
  [1, 1],
];

/** The monster numbers of a big firework's block: its flight and its burst. */
export function bigMonsters(big: number, cell: number): { flight: number; burst: number } {
  const at = BIG_FROM + big * 18 + cell * 2;
  return { flight: at, burst: at + 1 };
}

/** Which picture a block of a 3x3 burst shows (its column and row in the drawn part) and the mirror that makes it. */
function mirrorOf(kind: BurstKind, dx: number, dy: number): { col: number; row: number; orient: number } {
  const col = dx === 1 ? 0 : dx + 1;
  const flipX = dx === 1;
  if (kind.symmetry === 'half') return { col, row: dy + 1, orient: flipX ? 4 : 0 };
  const row = dy === 1 ? 0 : dy + 1;
  const flipY = dy === 1;
  return { col, row, orient: flipX && flipY ? 2 : flipX ? 4 : flipY ? 6 : 0 };
}

/** The pictures (.MBL): a clear block, the rocket's two, then every burst's frames, block by block. A block that would be the same as one already in the set is not added twice. */
export function buildMonsterBlocks(pal: Pal): { book: Book; frames: Map<string, string[][][]> } {
  const book = new Book('mbl', MONBL);
  const rules = { solid: 0, hp: 0 };
  const T = 255;
  book.add('clear', new Pixels(20, 20, T), rules);
  book.add('rocket0', rocketPicture(pal, 0), rules);
  book.add('rocket1', rocketPicture(pal, 1), rules);
  const seen = new Map<string, string>([[String(new Pixels(20, 20, T).px), 'clear']]);
  /** frames.get(kind)[frame][row][col]: the block name of each drawn block. */
  const frames = new Map<string, string[][][]>();
  for (const kind of BURSTS) {
    const rows = kind.grid === 1 ? 1 : 3;
    const cols = kind.grid === 1 ? 1 : 2;
    const drawnRows = kind.symmetry === 'quad' ? 2 : rows;
    const list = sampleTimes(kind.ticks).map((t, f) => {
      const pic = burstPicture(pal, kind, t, f);
      return Array.from({ length: drawnRows }, (_r, row) =>
        Array.from({ length: cols }, (_c, col) => {
          const cell = pic.crop(col * 20, row * 20, 20, 20);
          const key = String(cell.px);
          let name = seen.get(key);
          if (!name) {
            name = `${kind.name}.${f}.${col}${row}`;
            book.add(name, cell, rules);
            seen.set(key, name);
          }
          return name;
        }),
      );
    });
    frames.set(kind.name, list);
  }
  return { book, frames };
}

/** A path from corners given as [dx, dy, speed] blocks from the start, every corner with the same mirror. */
function path(corners: [number, number, number][], orient = 0): March[] {
  return corners.map(([x, y, s]) => corner(x, y, s, orient));
}

/** The rocket's climb from `y0` blocks below where it starts: corners for the end of each leg. */
function climb(y0: number): [number, number, number][] {
  let y = y0;
  return CLIMB_LEGS.map(([blocks, speed]) => {
    y -= blocks;
    return [0, y, speed];
  });
}

/** The ticks the rocket's climb takes. */
export const CLIMB_TICKS = CLIMB_LEGS.reduce((t, [blocks, speed]) => t + (blocks * 20) / speed, 0);

/**
 * The animation of a burst block: its picture in each frame for the frame's ticks, the last held. A monster born from
 * another (or from a block) moves on from its first picture after one tick, so the first frame is listed twice: one
 * tick, then the rest of its time.
 */
function burstAnim(book: Book, frames: string[][][], kind: BurstKind, col: number, row: number, hold: number): [number, number][] {
  const list: [number, number][] = frames.map((f, k) => [book.n(f[row][col]), k === frames.length - 1 ? hold : kind.ticks[k]]);
  return [[list[0][0], 1], [list[0][0], Math.max(1, list[0][1] - 1)], ...list.slice(1)];
}

/** The .MON. */
export function buildMonsters(book: Book, frames: Map<string, string[][][]>): Monster[] {
  const set = newMonsterSet();
  const base = { power: POWER, thru: 0 };
  const rocketAnim: [number, number][] = [
    [book.n('rocket0'), FIZZ],
    [book.n('rocket1'), FIZZ],
  ];
  // the small ones: born by a launcher (or Enter), up, then a pop that falls a block and is gone
  const climbPath = path([[0, 0, 12], ...climb(0)]);
  set[ROCKET] = mon(rocketAnim, { ...base, end: -1, newmon: POP }, climbPath);
  set[ROCKET_TEAL] = mon(rocketAnim, { ...base, end: -1, newmon: POP_TEAL }, climbPath);
  for (const [n, name] of [
    [POP, 'pop'],
    [POP_TEAL, 'popTeal'],
  ] as const) {
    const kind = burstKind(name);
    set[n] = mon(
      burstAnim(book, frames.get(name)!, kind, 0, 0, 40),
      { ...base, end: -1, newmon: LASTMON },
      path([
        [0, 0, 1],
        [0, 1, 1],
      ]),
    );
  }
  // the big ones
  BIGS.forEach((big, b) => {
    const kind = burstKind(big.kind);
    // the flight starts where the burst ended (`fall` blocks under the top): it drops to the launcher in a blink, waits
    // by going on down into the ground and back up (all unseen), then climbs; the burst falls (or burns in place) and
    // turns back into the flight
    const down = CLIMB - big.fall;
    const [out, speed] = big.wait;
    const flight = path([[0, 0, 1], [0, down, 20], [0, down + out, speed], [0, down, speed], ...climb(down)]);
    const burstPath = path(
      big.fall
        ? [
            [0, 0, 1],
            [0, 1, 1],
            [0, big.fall, 2],
          ]
        : [[0, 0, 1]],
    );
    CELLS.forEach(([dx, dy], cell) => {
      const { flight: fn, burst: bn } = bigMonsters(b, cell);
      // only the middle block shows its rocket: clear while it waits and drops (a tick, then the rest: see burstAnim),
      // then the rocket for the climb
      const anim: [number, number][] =
        cell === 0
          ? [[book.n('clear'), 1], [book.n('clear'), flightHidden(big) - 2], ...Array.from({ length: LASTSL - 2 }, (_v, i) => rocketAnim[i % 2])]
          : [[MONBL, 1]];
      set[fn] = mon(anim, { ...base, end: -1, newmon: bn }, flight);
      const m = mirrorOf(kind, dx, dy);
      set[bn] = mon(
        burstAnim(book, frames.get(big.kind)!, kind, m.col, m.row, 60),
        { ...base, end: big.fall ? -1 : WILLOW_LIFE, newmon: fn },
        burstPath.map((c) => ({ ...c, orient: m.orient })),
      );
    });
  });
  return set;
}

/** Ticks the willow burns before it turns back into its flight (it does not fall by a path). */
const WILLOW_LIFE = 47;

/**
 * Ticks from a flight's birth to the start of its climb: the drop (a tick a block), down and back up (each leg a tick
 * more than its moves, since the engine notices it has arrived on the tick after) and a tick at its first corner; a flight
 * born from a burst that burned in place (the willow) starts two ticks later in its path. tools/check.ts counts the
 * ticks the rocket shows anywhere but on its climb.
 */
export function flightHidden(big: Big): number {
  const [out, speed] = big.wait;
  return (2 * out * 20) / speed + 2 + (CLIMB - big.fall) + 1 + (big.fall ? 0 : 2);
}
