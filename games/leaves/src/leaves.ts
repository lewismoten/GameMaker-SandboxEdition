// The leaves: their pictures (.MBL) and what each does (.MON). Every leaf is a monster. Its frames turn it (leafArt.ts),
// its path carries it down, and when its path ends it becomes a leaf lying on the grass, which is gone a few seconds
// later. Nothing here can hurt: power 150 (touching the hero does nothing to it), no hit points, never solid.
//
//   level 1, The Tumble, three leaves side by side, each born by a branch block every few seconds:
//     stiff    one picture, straight down: a stone, not a leaf
//     spin     eight frames turn it, straight down: it spins, but still drops like a stone
//     float    the same frames rocking, on a path that swoops and glides from side to side, facing the way it goes
//   level 2, The Gust, three trees, each dropping leaves of its own kind on its own timers, and three more in each gust;
//            their paths were worked out by the wind model (wind.ts) when the game was built
import { newMonsterSet, type March, type Monster } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import { mon } from '@lewismoten/gamemaker-sandbox-tools/kit/actors';
import { Book } from '../../kit/starter/book';
import type { Pal } from '../../kit/starter/palette';
import { leafPicture, restingPicture, TUMBLE } from './leafArt';
import { KINDS, type Kind } from './palette';
import { cornersOf, marchOf, simulate, windAt, type Flight } from './wind';

/** The monsters by number (their place in the .MON file). */
export const LEAF = {
  stiff: 0,
  spin: 1,
  float: 2,
  rest: { maple: 3, oak: 4, birch: 5 },
  calm: { maple: [6, 7], oak: [8, 9], birch: [10, 11] },
  gust: { maple: [12, 13, 14], oak: [15, 16, 17], birch: [18, 19, 20] },
} as const satisfies Record<string, unknown>;

/** Ticks a leaf lies on the grass before it is gone. */
export const REST_TICKS = 55;

/** How many rows the leaves fall: level 1's from a crown's middle row (3) and level 2's calm ones from its bottom row (4),
 * its gust ones from its top row (2), all to the row the hero walks on (8). */
export const DROP = { tumble: 5, calm: 4, gust: 6 } as const;

/** The pictures: eight frames of a tumble for each kind, then each kind lying on the grass. */
export function buildLeafBlocks(pal: Pal): Book {
  const book = new Book('mbl');
  const rules = { solid: 0, hp: 0 };
  for (const kind of KINDS) TUMBLE.forEach((pose, k) => book.add(`${kind}.${k}`, leafPicture(pal, kind, pose), rules));
  for (const kind of KINDS) book.add(`${kind}.rest`, restingPicture(pal, kind), rules);
  return book;
}

/** A frame list: [frame number, ticks shown]. */
type Frames = [number, number][];

/** The same list started `k` entries later, so leaves that let go together do not turn in step. */
const from = (list: Frames, k: number): Frames => [...list.slice(k % list.length), ...list.slice(0, k % list.length)];

/** A full tumble: all eight frames, each for `ticks`. */
const tumble = (ticks: number[]): Frames => ticks.map((t, k) => [k, t]);
/** Rocking: tipped one way, flat, tipped the other, flat; now and then a whole tumble. */
const rockAndTumble = (rock: number, spin: number): Frames => [
  [0, rock + 1],
  [1, rock],
  [0, rock + 1],
  [7, rock],
  [0, rock + 2],
  [1, rock],
  [0, rock],
  [7, rock + 1],
  [0, rock],
  ...tumble([spin, spin, spin + 1, spin, spin, spin, spin + 1, spin]).slice(1),
];

/** Level 1's floating leaf, by hand: swoop down one way, glide level and slow, swoop back. Blocks from where it was born. */
export const FLOAT_PATH: March[] = [
  [2, 1, 2, 0],
  [3, 1, 1, 0],
  [1, 2, 2, 4],
  [0, 2, 1, 4],
  [2, 3, 2, 0],
  [3, 3, 1, 0],
  [1, 4, 2, 4],
  [0, 4, 1, 4],
  [1, 5, 1, 0],
].map(([x, y, pic, orient]) => ({ x, y, pic, orient }));

/** Each kind's flight through the air: its weight against drag, and the swing of its sway. */
const BODY: Record<Kind, Pick<Flight, 'fall' | 'drag' | 'sway' | 'swing'>> = {
  maple: { fall: 1.9, drag: 0.14, sway: 4.2, swing: 52 },
  oak: { fall: 2.2, drag: 0.16, sway: 3.6, swing: 46 },
  birch: { fall: 1.6, drag: 0.22, sway: 4.6, swing: 38 },
};

/** The air: a calm breeze to the right with little gusts, or a gusty one. */
const AIR = {
  calm: { breeze: 0.4, gust: 0.8, gustTicks: 80 },
  gust: { breeze: 0.8, gust: 2.6, gustTicks: 40 },
} as const;

/** The mean wind over the first `ticks` of a flight. */
const meanWind = (f: Flight, ticks: number) => {
  let sum = 0;
  for (let t = 0; t < ticks; t++) sum += windAt(f, t);
  return sum / ticks;
};

/**
 * A leaf's flight for the model: its kind's body in the air given, at the first stretch of the wind (seed) that suits:
 * for a gust leaf, where the wind is near its strongest as it lets go; for a calm one, where it is near its calmest.
 * `n` picks a different stretch for each leaf of the same kind.
 */
export function flightFor(kind: Kind, air: keyof typeof AIR, n: number): Flight {
  const want = air === 'gust' ? (f: Flight) => meanWind(f, 50) > f.breeze + 0.6 * f.gust : (f: Flight) => meanWind(f, 100) < f.breeze + 0.25 * f.gust;
  let found = 0;
  for (let seed = 1; seed < 5000; seed++) {
    const f: Flight = { ...BODY[kind], ...AIR[air], phase: (seed * 2.399) % (2 * Math.PI), seed };
    if (want(f) && found++ === n + KINDS.indexOf(kind) * 3) return f;
  }
  throw new Error(`no ${air} wind found for a ${kind} leaf`);
}

/** The path a model flight becomes: its corners in whole blocks, `rows` down. */
export function modelPath(f: Flight, rows: number): March[] {
  return marchOf(cornersOf(simulate(f, rows * 20), rows));
}

/** Every monster of the game (.MON); `mb` names the pictures. */
export function buildLeaves(mb: Book): Monster[] {
  const set = newMonsterSet();
  const base = { power: 150, thru: 0, end: -1 };
  const frames = (kind: Kind, list: Frames): [number, number][] => list.map(([k, t]) => [mb.n(`${kind}.${k}`), t]);
  const leaf = (kind: Kind, list: Frames, path: March[]) => mon(frames(kind, list), { ...base, newmon: LEAF.rest[kind] }, path);
  const down = (rows: number): March[] => [{ x: 0, y: rows, pic: 2, orient: 0 }];

  set[LEAF.stiff] = leaf('maple', [[0, 20]], down(DROP.tumble));
  set[LEAF.spin] = leaf('maple', tumble([3, 3, 2, 3, 3, 3, 2, 3]), down(DROP.tumble));
  set[LEAF.float] = leaf('maple', rockAndTumble(4, 3), FLOAT_PATH);
  for (const kind of KINDS) {
    set[LEAF.rest[kind]] = mon([[mb.n(`${kind}.rest`), REST_TICKS]], { power: 150, thru: 0, end: REST_TICKS });
    const light = kind === 'birch';
    LEAF.calm[kind].forEach(
      (id, n) => (set[id] = leaf(kind, from(rockAndTumble(light ? 3 : 4, light ? 2 : 3), n * 5), modelPath(flightFor(kind, 'calm', n), DROP.calm))),
    );
    // gust leaves tumble fast, each starting at a different frame and keeping slightly different times
    const fast = [
      light ? [2, 2, 1, 2, 2, 2, 1, 2] : [2, 2, 2, 3, 2, 2, 2, 2],
      light ? [1, 2, 2, 2, 1, 2, 2, 2] : [3, 2, 2, 2, 2, 3, 2, 2],
      [2, 2, 2, 2, 2, 2, 2, 2],
    ];
    LEAF.gust[kind].forEach((id, n) => (set[id] = leaf(kind, from(tumble(fast[n]), n * 3), modelPath(flightFor(kind, 'gust', n), DROP.gust))));
  }
  return set;
}
