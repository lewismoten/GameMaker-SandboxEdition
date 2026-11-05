// The course both levels share: a road with a hedge either side, run down a 100x100 map that wraps at every edge.
// A row of the course, u, counts down from the start (u = 0). Across it, i runs 0 (the road's left block) to
// WIDTH - 1. Level 1 runs straight down; level 2 is the same course tilted: it steps one column to the right every
// RISE rows. Off the bottom of the map the road comes back in at the top, so a straight course wraps once (the map
// is 100 rows) and a tilted one goes round three times before it would meet itself (3 laps x 100 rows, 100 columns
// over: the line closes exactly). The engine does the wrapping; nothing here teaches it a thing.

/** The road's width in blocks, hedges not counted. */
export const WIDTH = 5;
/** Hedge blocks either side of the road. */
export const HEDGE = 2;
/** The map row where the course starts (u = 0), and the left block of the road there. */
export const Y0 = 50;
export const X0 = 48;
/** Rows of road for each column the tilted course steps right. */
export const RISE = 3;
/** The map is 100 blocks each way, and the engine wraps at both edges. */
export const MAP = 100;

export interface Course {
  /** Rows of road from the entrance to the finish row. */
  length: number;
  /** Rows for each column stepped right (0 = straight down). */
  rise: number;
}
/** Level 1: straight down, 98 rows. Level 2: tilted, 3 laps. */
export const STRAIGHT: Course = { length: 98, rise: 0 };
export const TILTED: Course = { length: 298, rise: RISE };

const mod = (n: number, m: number) => ((n % m) + m) % m;

/** The road's left block at row u (map column, wrapped). */
export const leftAt = (c: Course, u: number): number => mod(X0 + (c.rise ? Math.floor(u / c.rise) : 0), MAP);

/** The map block of row u, across i (i = -HEDGE ... WIDTH + HEDGE - 1 reaches the hedges). */
export function cellAt(c: Course, u: number, i: number): [number, number] {
  return [mod(leftAt(c, u) + i, MAP), mod(Y0 + u, MAP)];
}

/** Which lap of the map a row is on (0 for the first run down the map). */
export const lapOf = (u: number): number => Math.floor((u + Y0) / MAP) - Math.floor(Y0 / MAP);

/** The finish row (a row of doors) and the cap hedge behind it, which is the row above the entrance. */
export const finishRow = (c: Course): number => c.length;
export const capRow = (c: Course): number => c.length + 1;
