// The shared pieces of the generators: a seeded random stream, the cell codes a generator draws in,
// neighbor walks and a distance fill. No DOM.

/** Seeded random numbers (mulberry32): the same seed always gives the same stream. */
export function stream(seed: number) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    /** An integer from lo to hi, both included. */
    int: (lo: number, hi: number) => lo + Math.floor(next() * (hi - lo + 1)),
    chance: (p: number) => next() < p,
    pick: <T>(list: readonly T[]) => list[Math.floor(next() * list.length)],
  };
}
export type Stream = ReturnType<typeof stream>;

/** What a cell of a generated area is, before blocks are chosen. */
export const WALL = 0;
export const FLOOR = 1;
export const PATH = 2;
export const TREE = 3;
export const ROCK = 4;
export const DECOR = 5;
/** Cells the props pass adds (open to walk on): a locked door, its key, treasure, a heart. */
export const LOCK = 6;
export const KEY = 7;
export const TREASURE = 8;
export const LIFE = 9;

/** Cells a person or monster cannot stand on. */
export const closed = (c: number) => c === WALL || c === TREE || c === ROCK;

export interface Area {
  w: number;
  h: number;
  cells: Uint8Array;
}

export const newArea = (w: number, h: number, fill: number): Area => ({ w, h, cells: new Uint8Array(w * h).fill(fill) });

const SIDES: readonly [number, number][] = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

/** Steps from `from` to every open cell (-1 where it cannot be reached), moving along the four sides. */
export function distances(a: Area, from: number): Int32Array {
  const dist = new Int32Array(a.cells.length).fill(-1);
  if (closed(a.cells[from])) return dist;
  dist[from] = 0;
  const queue = [from];
  for (let i = 0; i < queue.length; i++) {
    const c = queue[i];
    const x = c % a.w,
      y = (c / a.w) | 0;
    for (const [dx, dy] of SIDES) {
      const nx = x + dx,
        ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= a.w || ny >= a.h) continue;
      const n = ny * a.w + nx;
      if (dist[n] < 0 && !closed(a.cells[n])) {
        dist[n] = dist[c] + 1;
        queue.push(n);
      }
    }
  }
  return dist;
}

/** True when every one of the eight neighbors (and the cell) is open and inside the area. */
export function openAround(a: Area, x: number, y: number): boolean {
  for (let dy = -1; dy <= 1; dy++)
    for (let dx = -1; dx <= 1; dx++) {
      const nx = x + dx,
        ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= a.w || ny >= a.h || closed(a.cells[ny * a.w + nx])) return false;
    }
  return true;
}

/** The open cell farthest from `from` by steps (the first of any tie in reading order). */
export function farthest(a: Area, from: number): number {
  const d = distances(a, from);
  let best = from;
  for (let i = 0; i < d.length; i++) if (d[i] > d[best]) best = i;
  return best;
}
