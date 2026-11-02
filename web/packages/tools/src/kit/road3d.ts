// A road that comes at you: the pieces of In The Year 2000!'s Cloud Lane that any game can
// build a pseudo-3D scene from (Virus Blaster's data bus rides use them too). One screen
// that never scrolls, a road narrowing to a vanishing point on the horizon, and traffic on a
// timetable that leaps onto the vanishing point and slides outward down its lane, growing as
// it comes. The game draws its own pictures; this file has the geometry, the spawner chains,
// the monsters' paths and the shrinking of a full-size picture into its far-off sizes.
// The Owner's Guide tells it ("A road that comes at you", "An end to a road that never ends").
import { Pixels } from './pixels';

/** The road in perspective: half its width on each screen row, and where its lanes and lines run. */
export interface RoadView {
  /** The lane's half width at screen row y (its rails sit at vx +- this). */
  halfWidth: (y: number) => number;
  /** Where lane k (-1 left, 0 middle, 1 right) runs at screen row y: two thirds of the way out for the side lanes. */
  laneX: (k: number, y: number) => number;
  /** Where the lines between the lanes run (side -1 or 1). */
  dividerX: (side: number, y: number) => number;
}

/** A three-lane road from the vanishing point (vx, horizon), its half width growing `spread` pixels a row. */
export function roadView(horizon: number, vx: number, spread: number): RoadView {
  const halfWidth = (y: number) => Math.max(0, (y - horizon) * spread);
  return {
    halfWidth,
    laneX: (k, y) => vx + (k * 2 * halfWidth(y)) / 3,
    dividerX: (side, y) => vx + (side * halfWidth(y)) / 3,
  };
}

/** One entry of a timetable: [tick after the scene starts, lane, what comes]. */
export type RoadEntry<K> = readonly [tick: number, lane: number, kind: K];

/** A spawner block of a lane's chain: on the map from the last entry's tick until just after its own. */
export interface SpawnBlock<K> {
  name: string;
  kind: K;
  /** Its birth time: the entry's tick (its first birth is its only one on the map). */
  birthTime: number;
  /** The next block of the chain, and when it takes over. */
  next: string;
  ntime: number;
}

/** A lane's chain of spawner blocks, its first block (the one on the map) and the blank it ends on. */
export interface SpawnChain<K> {
  lane: number;
  first: string;
  blocks: SpawnBlock<K>[];
  end: string;
}

/**
 * The spawner chains for a timetable, one per lane: a block per entry, each giving birth once.
 * Every block's clock starts with the scene, so a block whose birth time is its entry's tick, on
 * the map only around that tick, gives birth exactly then. Blocks are named `${prefix}${lane}_${i}`
 * and `${prefix}${lane}_end`.
 */
export function spawnChains<K>(waves: readonly RoadEntry<K>[], lanes: readonly number[], prefix = 'spawn'): SpawnChain<K>[] {
  return lanes.map((lane) => {
    const entries = waves.filter(([, l]) => l === lane).sort((a, b) => a[0] - b[0]);
    const end = `${prefix}${lane}_end`;
    const blocks: SpawnBlock<K>[] = [];
    let from = 0;
    entries.forEach(([tick, , kind], i) => {
      if (tick < from || tick < 2) throw new Error(`road lane ${lane}: entry at ${tick} is out of order`);
      blocks.push({
        name: `${prefix}${lane}_${i}`,
        kind,
        birthTime: tick,
        next: i + 1 < entries.length ? `${prefix}${lane}_${i + 1}` : end,
        ntime: tick + 1 - from,
      });
      from = tick + 1;
    });
    return { lane, first: blocks[0]?.name ?? end, blocks, end };
  });
}

/** A path step: [blocks across, blocks down, pixels a tick]. */
export type RoadStep = [dx: number, dy: number, speed: number];

/** A Game-Maker path corner: [x, y] from the start, the speed, the orientation. */
export type RoadCorner = [x: number, y: number, speed: number, orient: number];

/** A path as steps from where the last one ended (Game-Maker stores corners from the start). */
export function roadCorners(steps: RoadStep[], orient: number): RoadCorner[] {
  let x = 0;
  let y = 0;
  return steps.map(([dx, dy, speed]) => {
    x += dx;
    y += dy;
    return [x, y, speed, orient];
  });
}

/**
 * Lane k's slide from the vanishing point: -1 left, 0 middle, 1 right, outward along its line
 * and faster as it comes (a block in 20 ticks, the next in 10, then 4 and 5 pixels a tick).
 */
export const laneSlide = (k: number): RoadStep[] => [
  [k, 1, 1],
  [k, 1, 2],
  [3 * k, 4, 4],
  [2 * k, 3, 5],
];

/** Leap speed: more than any spawner is from the vanishing point, in pixels a tick. */
export const ROAD_LEAP = 240;

/** The first step, from a spawner's cell onto the vanishing point's in one tick. */
export const leapTo = (from: [number, number], vp: [number, number]): RoadStep => [vp[0] - from[0], vp[1] - from[1], ROAD_LEAP];

/** A monster's sizes in step with its slide: a dot while it crawls the first block, then nearer and nearer. */
export const growPics = (name: string): [string, number][] => [
  [`${name}0`, 12],
  [`${name}1`, 8],
  [`${name}2`, 5],
  [`${name}3`, 200],
];

/** How big each size is, and the row of the sprite its bottom sits on (lower as it nears). */
export const ROAD_SIZES = [
  { scale: 0.25, bottom: 6 },
  { scale: 0.45, bottom: 11 },
  { scale: 0.72, bottom: 16 },
  { scale: 1, bottom: 19 },
] as const;

/** A full-size 20x20 picture shrunk (nearest pixel), centered, its bottom row on `bottom`; `clear` is transparent. */
export function shrinkSprite(src: Pixels, scale: number, bottom: number, clear: number): Pixels {
  const p = new Pixels(20, 20, clear);
  if (scale >= 1) return p.blit(src, 0, bottom - 19, clear);
  const w = Math.max(1, Math.round(20 * scale));
  const x0 = Math.round(10 - w / 2);
  const y0 = bottom + 1 - w;
  for (let y = 0; y < w; y++)
    for (let x = 0; x < w; x++) {
      const c = src.get(Math.min(19, Math.floor((x + 0.5) / scale)), Math.min(19, Math.floor((y + 0.5) / scale)));
      if (c !== clear) p.set(x0 + x, y0 + y, c);
    }
  return p;
}
